/**
 * FLOW Resolve Engine
 * 
 * The brain of FLOW - determines how to execute a payment.
 * Pure deterministic logic. No ML.
 */

import { supabase } from '@/integrations/supabase/client';
import { checkResolutionGates, checkConsentGate, type GateResult } from './gates';
import type { Database } from '@/integrations/supabase/types';

type IntentType = Database['public']['Enums']['intent_type'];
type RiskLevel = Database['public']['Enums']['risk_level'];
type ConnectorName = Database['public']['Enums']['connector_name'];

interface Connector {
  id: string;
  name: ConnectorName;
  type: string;
  status: string;
  capabilities: Record<string, boolean>;
}

interface FundingSource {
  id: string;
  name: string;
  type: string;
  priority: number;
  balance: number;
  available: boolean;
  maxAutoTopupAmount: number;
  requireExtraConfirmAmount: number;
}

export interface ResolutionStep {
  action: string;
  description: string;
  amount?: number;
  source?: string;
}

export interface ResolutionPlan {
  intentId: string;
  chosenRail: string;
  fallbackRail?: string;
  topupNeeded: boolean;
  topupAmount: number;
  executionMode: 'sync' | 'async';
  pendingReason?: string;
  steps: ResolutionStep[];
  reasonCodes: string[];
  riskLevel: RiskLevel;
}

export interface ResolveResult {
  success: boolean;
  plan?: ResolutionPlan;
  planId?: string;
  error?: string;
  gateResult?: GateResult;
}

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
 * Get funding sources sorted by priority
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
    type: s.type,
    priority: s.priority,
    balance: Number(s.balance),
    available: s.available,
    maxAutoTopupAmount: Number(s.max_auto_topup_amount),
    requireExtraConfirmAmount: Number(s.require_extra_confirm_amount),
  }));
}

/**
 * Determine risk level based on amount and transaction context
 */
function assignRiskLevel(amount: number, fundingSource: FundingSource): RiskLevel {
  if (amount > fundingSource.requireExtraConfirmAmount) {
    return 'high';
  }
  if (amount > fundingSource.maxAutoTopupAmount) {
    return 'medium';
  }
  return 'low';
}

/**
 * Generate human-readable steps (no technical language)
 */
function generateHumanSteps(
  amount: number,
  chosenRail: string,
  topupNeeded: boolean,
  topupAmount: number,
  topupSource?: string
): ResolutionStep[] {
  const steps: ResolutionStep[] = [];

  if (topupNeeded && topupSource) {
    steps.push({
      action: 'TOP_UP',
      description: `Add RM${topupAmount.toFixed(2)} to your wallet from ${topupSource}`,
      amount: topupAmount,
      source: topupSource,
    });
  }

  steps.push({
    action: 'PAY',
    description: `Pay RM${amount.toFixed(2)} using ${chosenRail}`,
    amount,
    source: chosenRail,
  });

  return steps;
}

/**
 * ResolveEngine
 * Main resolution logic - determines how to execute a payment
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
      gateResult,
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

  // Get candidate rails
  const candidates = await getCandidateRails(userId, intent.type, railsAvailable);
  if (candidates.length === 0) {
    return {
      success: false,
      error: 'No payment methods available for this transaction',
    };
  }

  // Get funding sources
  const fundingSources = await getFundingSources(userId);
  if (fundingSources.length === 0) {
    return {
      success: false,
      error: 'No funding sources available',
    };
  }

  // Check consent for first candidate
  const primaryCandidate = candidates[0];
  const consentResult = await checkConsentGate(userId, primaryCandidate.id);
  
  // Select primary funding source (wallet preferred)
  const walletSource = fundingSources.find((s) => s.type === 'wallet');
  const primarySource = walletSource || fundingSources[0];

  // Determine if top-up is needed
  let topupNeeded = false;
  let topupAmount = 0;
  let topupSource: string | undefined;

  if (primarySource.balance < amount) {
    const deficit = amount - primarySource.balance;
    
    // Find a source that can fund the top-up
    const topupFundingSource = fundingSources.find(
      (s) => s.type !== 'wallet' && s.balance >= deficit
    );

    if (topupFundingSource) {
      // Check if within auto top-up limit
      if (deficit <= primarySource.maxAutoTopupAmount) {
        topupNeeded = true;
        topupAmount = deficit;
        topupSource = topupFundingSource.name;
      } else {
        // Need manual confirmation for large top-up
        topupNeeded = true;
        topupAmount = deficit;
        topupSource = topupFundingSource.name;
      }
    } else {
      // Cannot fund - try fallback to direct payment
      const directSource = fundingSources.find(
        (s) => s.type !== 'wallet' && s.balance >= amount
      );
      if (!directSource) {
        return {
          success: false,
          error: 'Insufficient funds across all payment sources',
        };
      }
      // Use direct payment instead
      topupNeeded = false;
    }
  }

  const chosenRail = primaryCandidate.name;
  const fallbackRail = candidates.length > 1 ? candidates[1].name : undefined;
  const riskLevel = assignRiskLevel(amount, primarySource);
  const steps = generateHumanSteps(amount, chosenRail, topupNeeded, topupAmount, topupSource);

  const reasonCodes: string[] = [];
  if (topupNeeded) reasonCodes.push('TOPUP_REQUIRED');
  if (riskLevel === 'high') reasonCodes.push('HIGH_VALUE');
  if (!consentResult.passed) reasonCodes.push('CONSENT_NEEDED');

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
 * Get human-readable explanation of a resolution plan
 */
export function explainPlan(plan: ResolutionPlan): string {
  const parts: string[] = [];

  for (const step of plan.steps) {
    parts.push(step.description);
  }

  return parts.join('. Then ');
}
