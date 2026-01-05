/**
 * FLOW Rule Resolution Engine
 * 
 * The brain of FLOW - determines HOW to pay.
 * Pure rules, no ML.
 * 
 * Resolution order:
 * 1. Check wallet first (user's declared priority)
 * 2. If insufficient → calculate top-up from next source
 * 3. If unavailable → fallback to next rail
 * 4. Apply guardrails at each step
 */

import type {
  FundingSource,
  PaymentRequest,
  PaymentResolution,
  ResolutionStep,
  GuardrailConfig,
  UserPaymentState,
} from './types';
import { checkGuardrails, canAutoTopUp, DEFAULT_GUARDRAILS } from './guardrails';

export interface ResolverContext {
  sources: FundingSource[];
  config?: GuardrailConfig;
  userState: UserPaymentState;
}

/**
 * Main resolution function - determines how to fulfill a payment
 */
export function resolvePayment(
  request: PaymentRequest,
  context: ResolverContext
): PaymentResolution {
  const { amount } = request;
  const { sources, config = DEFAULT_GUARDRAILS, userState } = context;

  // Step 1: Check guardrails first
  const guardrailCheck = checkGuardrails(request, userState, config);
  
  if (guardrailCheck.blockedReason) {
    return {
      action: 'BLOCKED',
      steps: [],
      requiresConfirmation: false,
      blockedReason: guardrailCheck.blockedReason,
      totalAmount: amount,
    };
  }

  // Step 2: Get available sources sorted by user's priority
  const availableSources = sources
    .filter(s => s.isLinked && s.isAvailable)
    .sort((a, b) => a.priority - b.priority);

  if (availableSources.length === 0) {
    return {
      action: 'BLOCKED',
      steps: [],
      requiresConfirmation: false,
      blockedReason: 'No payment methods available. Please link a funding source.',
      totalAmount: amount,
    };
  }

  // Step 3: Try to resolve with primary source (usually wallet)
  const primarySource = availableSources[0];
  const resolution = tryResolveWithSource(primarySource, amount, availableSources, config);

  // Step 4: Apply confirmation requirements
  return {
    ...resolution,
    requiresConfirmation: guardrailCheck.requiresConfirmation || resolution.requiresConfirmation,
    confirmationReason: guardrailCheck.reason || resolution.confirmationReason,
  };
}

/**
 * Try to resolve payment with a specific source
 */
function tryResolveWithSource(
  source: FundingSource,
  amount: number,
  allSources: FundingSource[],
  config: GuardrailConfig
): PaymentResolution {
  // Case 1: Source has sufficient balance
  if (source.balance >= amount) {
    return {
      action: 'USE_SINGLE_SOURCE',
      steps: [{
        action: 'charge',
        sourceId: source.id,
        sourceType: source.type,
        amount,
      }],
      requiresConfirmation: false,
      totalAmount: amount,
    };
  }

  // Case 2: Source is wallet with insufficient balance - try top-up
  if (source.type === 'wallet') {
    const shortfall = amount - source.balance;
    const topUpResult = tryTopUp(shortfall, allSources.slice(1), config);

    if (topUpResult.success) {
      const steps: ResolutionStep[] = [];
      
      // Add top-up step
      steps.push({
        action: 'top_up',
        sourceId: topUpResult.sourceId!,
        sourceType: topUpResult.sourceType!,
        amount: shortfall,
      });

      // Add charge step
      steps.push({
        action: 'charge',
        sourceId: source.id,
        sourceType: source.type,
        amount,
      });

      return {
        action: 'TOP_UP_WALLET',
        steps,
        requiresConfirmation: topUpResult.requiresConfirmation,
        confirmationReason: topUpResult.confirmationReason,
        totalAmount: amount,
      };
    }

    // Top-up not possible, try fallback
    return tryFallback(amount, allSources.slice(1), config);
  }

  // Case 3: Non-wallet source insufficient - try fallback
  return tryFallback(amount, allSources.filter(s => s.id !== source.id), config);
}

/**
 * Try to top up wallet from another source
 */
function tryTopUp(
  amount: number,
  sources: FundingSource[],
  config: GuardrailConfig
): {
  success: boolean;
  sourceId?: string;
  sourceType?: FundingSource['type'];
  requiresConfirmation: boolean;
  confirmationReason?: string;
} {
  // Find a source that can cover the top-up
  for (const source of sources) {
    if (source.balance >= amount) {
      const autoCheck = canAutoTopUp(amount, config);

      return {
        success: true,
        sourceId: source.id,
        sourceType: source.type,
        requiresConfirmation: !autoCheck.allowed,
        confirmationReason: autoCheck.reason,
      };
    }
  }

  return {
    success: false,
    requiresConfirmation: false,
  };
}

/**
 * Try fallback sources when primary can't cover payment
 */
function tryFallback(
  amount: number,
  sources: FundingSource[],
  _config: GuardrailConfig
): PaymentResolution {
  // Find first source that can cover the amount
  for (const source of sources) {
    if (source.balance >= amount) {
      return {
        action: 'USE_FALLBACK',
        steps: [{
          action: 'charge',
          sourceId: source.id,
          sourceType: source.type,
          amount,
        }],
        requiresConfirmation: false,
        totalAmount: amount,
      };
    }
  }

  // No source can cover it
  return {
    action: 'INSUFFICIENT_FUNDS',
    steps: [],
    requiresConfirmation: false,
    blockedReason: 'Insufficient funds across all payment methods.',
    totalAmount: amount,
  };
}

/**
 * Explain a resolution in human-readable format
 */
export function explainResolution(resolution: PaymentResolution): string {
  switch (resolution.action) {
    case 'USE_SINGLE_SOURCE':
      return `Pay directly from ${resolution.steps[0].sourceType}`;
    
    case 'TOP_UP_WALLET':
      const topUpStep = resolution.steps.find(s => s.action === 'top_up');
      return `Top up wallet from ${topUpStep?.sourceType}, then pay`;
    
    case 'USE_FALLBACK':
      return `Using ${resolution.steps[0].sourceType} as fallback`;
    
    case 'REQUIRES_CONFIRMATION':
      return `Confirmation required: ${resolution.confirmationReason}`;
    
    case 'BLOCKED':
      return resolution.blockedReason || 'Payment blocked';
    
    case 'INSUFFICIENT_FUNDS':
      return 'Not enough funds available';
    
    default:
      return 'Unknown resolution';
  }
}
