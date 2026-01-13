/**
 * FLOW Resolve Engine
 * 
 * The brain of FLOW - determines how to execute a payment.
 * Now uses smart resolution for intelligent rail selection.
 */

import { supabase } from '@/integrations/supabase/client';
import { checkResolutionGates, checkConsentGate } from './gates';
import { resolvePayment, type ResolverContext } from '@/lib/orchestration/resolver';
import { smartResolve, type SmartResolutionContext, type ScoredRail, type SmartResolutionResult } from '@/lib/orchestration/smart-resolver';
import { DEFAULT_GUARDRAILS, getOrResetDailyState } from '@/lib/orchestration/guardrails';
import type { Database } from '@/integrations/supabase/types';
import type { 
  ResolutionPlan, 
  ResolutionStep, 
  ResolveResult, 
  RiskLevel,
  FundingSource,
  PaymentRequest,
  UserPaymentState,
  FallbackPreference,
} from '@/types';

type IntentType = Database['public']['Enums']['intent_type'];
type ConnectorName = Database['public']['Enums']['connector_name'];

interface Connector {
  id: string;
  name: ConnectorName;
  type: string;
  status: string;
  capabilities: Record<string, boolean>;
}

// Re-export types for consumers
export type { ResolutionStep, ResolutionPlan, ResolveResult };

// Capability mapping by intent type
const INTENT_CAPABILITY_MAP: Record<IntentType, string> = {
  PayMerchant: 'can_pay_qr',
  SendMoney: 'can_p2p',
  RequestMoney: 'can_p2p',
  PayBill: 'can_pay',
};

/**
 * Get connectors that can handle this intent type
 */
async function getCandidateRails(
  userId: string,
  intentType: IntentType,
  railsAvailable?: string[]
): Promise<Connector[]> {
  const requiredCapability = INTENT_CAPABILITY_MAP[intentType];

  const { data: connectors } = await supabase
    .from('connectors')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'available');

  if (!connectors) return [];

  const mapped: Connector[] = connectors.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    status: c.status,
    capabilities: (c.capabilities || {}) as Record<string, boolean>,
  }));

  return mapped.filter((c) => {
    const hasCapability = c.capabilities[requiredCapability] === true;
    const isInAvailableRails = !railsAvailable || railsAvailable.includes(c.name);
    return hasCapability && isInAvailableRails;
  });
}

/**
 * Get funding sources from DB and convert to orchestration format
 */
async function getFundingSources(userId: string): Promise<FundingSource[]> {
  const { data: sources } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('linked_status', 'linked')
    .eq('available', true)
    .order('priority', { ascending: true });

  if (!sources) return [];

  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type === 'debit_card' || s.type === 'credit_card' ? 'card' : s.type,
    priority: s.priority,
    balance: Number(s.balance),
    isAvailable: s.available,
    isLinked: s.linked_status === 'linked',
    maxAutoTopUp: Number(s.max_auto_topup_amount),
    requireConfirmAbove: Number(s.require_extra_confirm_amount),
    currency: s.currency,
  }));
}

/**
 * Get user's fallback preference from settings
 */
async function getUserFallbackPreference(userId: string): Promise<FallbackPreference> {
  const { data } = await supabase
    .from('user_settings')
    .select('fallback_preference')
    .eq('user_id', userId)
    .maybeSingle();

  return (data?.fallback_preference as FallbackPreference) || 'use_card';
}

/**
 * Determine risk level based on amount and resolution action
 */
function assignRiskLevel(amount: number, requiresConfirmation: boolean): RiskLevel {
  if (amount > 500) return 'high';
  if (amount > 100 || requiresConfirmation) return 'medium';
  return 'low';
}

/**
 * Convert orchestration steps to human-readable steps
 */
function generateHumanSteps(
  resolution: { action: string; steps: Array<{ action: string; sourceType?: string; amount?: number }> },
  amount: number,
  chosenRail: string,
  intentType?: string,
  recipientName?: string,
  recipientPreferredWallet?: string
): ResolutionStep[] {
  const steps: ResolutionStep[] = [];

  // Determine destination description for P2P payments
  const isP2P = intentType === 'SendMoney';
  const destinationDesc = isP2P && recipientName
    ? recipientPreferredWallet && recipientPreferredWallet !== 'None'
      ? `${recipientName}'s ${recipientPreferredWallet}`
      : `${recipientName} via ${chosenRail}`
    : chosenRail;

  for (const step of resolution.steps) {
    if (step.action === 'top_up') {
      steps.push({
        action: 'TOP_UP',
        description: `Add RM${step.amount?.toFixed(2)} to your wallet from ${step.sourceType}`,
        amount: step.amount,
        source: step.sourceType,
      });
    } else if (step.action === 'charge') {
      steps.push({
        action: 'PAY',
        description: isP2P 
          ? `Send RM${step.amount?.toFixed(2)} to ${destinationDesc}`
          : `Pay RM${step.amount?.toFixed(2)} using ${chosenRail}`,
        amount: step.amount,
        source: chosenRail,
      });
    }
  }

  // If no steps were generated, add a simple pay step
  if (steps.length === 0) {
    steps.push({
      action: 'PAY',
      description: isP2P 
        ? `Send RM${amount.toFixed(2)} to ${destinationDesc}`
        : `Pay RM${amount.toFixed(2)} using ${chosenRail}`,
      amount,
      source: chosenRail,
    });
  }

  return steps;
}

/**
 * ResolveEngine
 * Main resolution logic - determines how to execute a payment
 * Now uses smart resolution for intelligent rail selection
 */
export async function resolveIntent(
  userId: string,
  deviceId: string,
  intentId: string
): Promise<ResolveResult> {
  // Check gates
  const gateResult = await checkResolutionGates(userId, deviceId);
  if (!gateResult.passed) {
    return {
      success: false,
      error: gateResult.blockedReason,
      gateResult: {
        passed: gateResult.passed,
        blockedReason: gateResult.blockedReason,
      },
    };
  }

  // Fetch intent
  const { data: intent, error: intentError } = await supabase
    .from('intents')
    .select('*')
    .eq('id', intentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (intentError || !intent) {
    return {
      success: false,
      error: 'Payment request not found',
    };
  }

  const amount = Number(intent.amount);
  const metadata = intent.metadata as Record<string, unknown>;
  const railsAvailable = metadata?.railsAvailable as string[] | undefined;
  const recipientWallets = metadata?.recipientWallets as string[] | undefined;
  const recipientPreferredWallet = metadata?.recipientPreferredWallet as string | undefined;

  // ========================================
  // NEW: Use Smart Resolution
  // ========================================
  const smartContext: SmartResolutionContext = {
    userId,
    amount,
    intentType: intent.type,
    merchantRails: railsAvailable,
    recipientWallets,
    recipientPreferredWallet,
  };

  const smartResult = await smartResolve(smartContext);

  if (!smartResult.success || !smartResult.recommendedRail) {
    return {
      success: false,
      error: smartResult.explanation,
    };
  }

  // Get funding sources for fallback resolver
  const fundingSources = await getFundingSources(userId);
  if (fundingSources.length === 0) {
    return {
      success: false,
      error: 'No funding sources available',
    };
  }

  // Get user preferences
  const fallbackPreference = await getUserFallbackPreference(userId);

  // Get user payment state from localStorage (or initialize)
  const storedState = localStorage.getItem(`flow_payment_state_${userId}`);
  const userState: UserPaymentState = storedState 
    ? getOrResetDailyState(JSON.parse(storedState))
    : { dailyAutoApproved: 0, lastResetDate: new Date().toISOString().split('T')[0] };

  // Create payment request for guardrails check
  const paymentRequest: PaymentRequest = {
    amount,
    currency: intent.currency,
    intentId,
  };

  // Build resolver context for guardrails
  const resolverContext: ResolverContext = {
    sources: fundingSources,
    config: DEFAULT_GUARDRAILS,
    userState,
    fallbackPreference,
  };

  // Run pure resolver for guardrails check
  const resolution = resolvePayment(paymentRequest, resolverContext);

  // Handle blocked resolution
  if (resolution.action === 'BLOCKED') {
    return {
      success: false,
      error: resolution.blockedReason || 'Unable to process payment',
    };
  }

  // Use smart resolver's recommended rail
  const recommendedRail = smartResult.recommendedRail;
  const chosenRail = recommendedRail.name;
  const fallbackRail = smartResult.alternatives[0]?.name;

  // Determine if top-up is needed from smart result
  const topupNeeded = smartResult.requiresTopUp;
  const topupAmount = smartResult.topUpAmount || 0;

  // Check consent for chosen connector
  const consentResult = await checkConsentGate(userId, recommendedRail.connectorId);

  // Generate human-readable steps
  const steps = generateSmartSteps(
    recommendedRail,
    smartResult,
    amount,
    intent.type,
    intent.payee_name
  );
  
  const riskLevel = assignRiskLevel(amount, resolution.requiresConfirmation);

  const reasonCodes: string[] = [];
  if (topupNeeded) reasonCodes.push('TOPUP_REQUIRED');
  if (riskLevel === 'high') reasonCodes.push('HIGH_VALUE');
  if (!consentResult.passed) reasonCodes.push('CONSENT_NEEDED');
  if (resolution.requiresConfirmation) reasonCodes.push('CONFIRMATION_REQUIRED');
  
  // Add smart resolution metadata
  reasonCodes.push(`SCORE_${Math.round(recommendedRail.totalScore)}`);

  const plan: ResolutionPlan = {
    intentId,
    chosenRail,
    fallbackRail,
    topupNeeded,
    topupAmount,
    executionMode: 'sync',
    steps,
    reasonCodes,
    riskLevel,
  };

  // Save resolution plan
  const { data: savedPlan, error: saveError } = await supabase
    .from('resolution_plans')
    .insert({
      user_id: userId,
      intent_id: intentId,
      chosen_rail: chosenRail,
      fallback_rail: fallbackRail,
      topup_needed: topupNeeded,
      topup_amount: topupAmount,
      execution_mode: 'sync',
      steps: steps as unknown as Database['public']['Tables']['resolution_plans']['Insert']['steps'],
      reason_codes: reasonCodes as unknown as Database['public']['Tables']['resolution_plans']['Insert']['reason_codes'],
      risk_level: riskLevel,
    })
    .select('id')
    .single();

  if (saveError || !savedPlan) {
    return {
      success: false,
      error: 'Failed to create payment plan',
    };
  }

  return {
    success: true,
    plan,
    planId: savedPlan.id,
  };
}

/**
 * Generate steps from smart resolution result
 */
function generateSmartSteps(
  rail: ScoredRail,
  result: SmartResolutionResult,
  amount: number,
  intentType: string,
  payeeName: string
): ResolutionStep[] {
  const steps: ResolutionStep[] = [];
  const isP2P = intentType === 'SendMoney';

  // Add top-up step if needed
  if (result.requiresTopUp && result.topUpAmount && result.topUpSource) {
    steps.push({
      action: 'TOP_UP',
      description: `Add RM ${result.topUpAmount.toFixed(2)} to ${rail.name} from ${result.topUpSource}`,
      amount: result.topUpAmount,
      source: result.topUpSource,
    });
  }

  // Add payment step
  steps.push({
    action: 'PAY',
    description: isP2P 
      ? `Send RM ${amount.toFixed(2)} to ${payeeName} via ${rail.name}`
      : `Pay RM ${amount.toFixed(2)} using ${rail.name}`,
    amount,
    source: rail.name,
  });

  return steps;
}

/**
 * Get human-readable explanation of a resolution plan
 */
export function explainPlan(plan: ResolutionPlan): string {
  const parts: string[] = [];

  for (const step of plan.steps) {
    if (step.description) {
      parts.push(step.description);
    }
  }

  return parts.join('. Then ');
}

/**
 * Get smart resolution preview (for UI to show alternatives)
 */
export async function getSmartResolutionPreview(
  userId: string,
  amount: number,
  intentType: 'PayMerchant' | 'SendMoney' | 'RequestMoney' | 'PayBill',
  merchantRails?: string[],
  recipientWallets?: string[],
  recipientPreferredWallet?: string
) {
  return smartResolve({
    userId,
    amount,
    intentType,
    merchantRails,
    recipientWallets,
    recipientPreferredWallet,
  });
}
