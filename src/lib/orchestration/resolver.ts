/**
 * FLOW Rule Resolution Engine
 * 
 * The brain of FLOW - determines HOW to pay.
 * Pure rules, no ML.
 * 
 * FLOW CARD PRIORITY CHAIN:
 * 1. PRIMARY: Debit Card / DuitNow (instant bank debit, no balance needed)
 * 2. SECONDARY: E-Wallets (TnG, GrabPay, Boost - uses existing balance)
 * 3. BACKUP: Bank Transfer (fallback / auto top-up for wallets)
 * 
 * Resolution order:
 * 1. Try primary sources first (debit card/duitnow)
 * 2. If unavailable → try secondary (wallets with sufficient balance)
 * 3. If insufficient → auto top-up wallet from backup (bank)
 * 4. Apply guardrails at each step
 */

import type {
  FundingSource,
  FundingPriorityGroup,
  PaymentRequest,
  PaymentResolution,
  ResolutionStep,
  GuardrailConfig,
  UserPaymentState,
  FallbackPreference,
} from '@/types';
import { checkGuardrails, canAutoTopUp, DEFAULT_GUARDRAILS } from './guardrails';

export interface ResolverContext {
  sources: FundingSource[];
  config?: GuardrailConfig;
  userState: UserPaymentState;
  fallbackPreference?: FallbackPreference;
  useFlowCardPriority?: boolean; // Enable Flow Card priority chain
}

/**
 * Determine priority group for a funding source type
 */
function getPriorityGroup(type: FundingSource['type']): FundingPriorityGroup {
  switch (type) {
    case 'debit_card':
    case 'duitnow':
      return 'primary';
    case 'wallet':
      return 'secondary';
    case 'bank':
      return 'backup';
    case 'credit_card':
    case 'card':
      return 'secondary'; // Credit cards as secondary (after debit)
    default:
      return 'secondary';
  }
}

/**
 * Sort sources by Flow Card priority chain
 */
function sortByFlowCardPriority(sources: FundingSource[]): FundingSource[] {
  const groupOrder: Record<FundingPriorityGroup, number> = {
    primary: 1,
    secondary: 2,
    backup: 3,
  };

  return [...sources].sort((a, b) => {
    const aGroup = a.priorityGroup || getPriorityGroup(a.type);
    const bGroup = b.priorityGroup || getPriorityGroup(b.type);
    
    // First sort by priority group
    const groupDiff = groupOrder[aGroup] - groupOrder[bGroup];
    if (groupDiff !== 0) return groupDiff;
    
    // Then by user-defined priority within group
    return a.priority - b.priority;
  });
}

/**
 * Find primary sources (Debit Card / DuitNow)
 */
function findPrimarySources(sources: FundingSource[]): FundingSource[] {
  return sources.filter(s => {
    const group = s.priorityGroup || getPriorityGroup(s.type);
    return group === 'primary' && s.isLinked && s.isAvailable;
  });
}

/**
 * Find secondary sources (Wallets)
 */
function findSecondarySources(sources: FundingSource[]): FundingSource[] {
  return sources.filter(s => {
    const group = s.priorityGroup || getPriorityGroup(s.type);
    return group === 'secondary' && s.isLinked && s.isAvailable;
  });
}

/**
 * Find backup sources (Banks for auto top-up)
 */
function findBackupSources(sources: FundingSource[]): FundingSource[] {
  return sources.filter(s => {
    const group = s.priorityGroup || getPriorityGroup(s.type);
    return group === 'backup' && s.isLinked && s.isAvailable;
  });
}

/**
 * Find the default card from available sources
 * Cards have priority 1 when set as default
 */
function findDefaultCard(sources: FundingSource[]): FundingSource | null {
  // Look for debit cards first (primary group)
  const debitCard = sources.find(
    s => s.type === 'debit_card' && s.isLinked && s.isAvailable && s.priority === 1
  );
  
  if (debitCard) return debitCard;
  
  // Then any card with priority 1
  const defaultCard = sources.find(
    s => (s.type === 'card' || s.type === 'debit_card' || s.type === 'credit_card') 
      && s.isLinked && s.isAvailable && s.priority === 1
  );
  
  if (defaultCard) return defaultCard;
  
  // Fallback: any available card sorted by priority
  const anyCard = sources
    .filter(s => (s.type === 'card' || s.type === 'debit_card' || s.type === 'credit_card') 
      && s.isLinked && s.isAvailable)
    .sort((a, b) => a.priority - b.priority)[0];
  
  return anyCard || null;
}

/**
 * Main resolution function - determines how to fulfill a payment
 * 
 * For Flow Card payments (useFlowCardPriority = true):
 * 1. PRIMARY: Try Debit Card / DuitNow first (instant bank debit)
 * 2. SECONDARY: Try E-Wallets if primary unavailable
 * 3. BACKUP: Auto top-up wallet from Bank if insufficient
 */
export function resolvePayment(
  request: PaymentRequest,
  context: ResolverContext
): PaymentResolution {
  const { amount } = request;
  const { 
    sources, 
    config = DEFAULT_GUARDRAILS, 
    userState, 
    fallbackPreference = 'use_card',
    useFlowCardPriority = false 
  } = context;

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

  // Step 2: Get available sources - use Flow Card priority if enabled
  const availableSources = useFlowCardPriority
    ? sortByFlowCardPriority(sources.filter(s => s.isLinked && s.isAvailable))
    : sources.filter(s => s.isLinked && s.isAvailable).sort((a, b) => a.priority - b.priority);

  if (availableSources.length === 0) {
    return {
      action: 'BLOCKED',
      steps: [],
      requiresConfirmation: false,
      blockedReason: 'No payment methods available. Please link a funding source.',
      totalAmount: amount,
    };
  }

  // Step 3: Flow Card Priority Chain Resolution
  if (useFlowCardPriority) {
    const resolution = resolveWithFlowCardPriority(amount, availableSources, config);
    return {
      ...resolution,
      requiresConfirmation: guardrailCheck.requiresConfirmation || resolution.requiresConfirmation,
      confirmationReason: guardrailCheck.reason || resolution.confirmationReason,
    };
  }

  // Step 4: Standard resolution (fallback)
  const primarySource = availableSources[0];
  const resolution = tryResolveWithSource(primarySource, amount, availableSources, config, fallbackPreference);

  // Step 5: Apply confirmation requirements
  return {
    ...resolution,
    requiresConfirmation: guardrailCheck.requiresConfirmation || resolution.requiresConfirmation,
    confirmationReason: guardrailCheck.reason || resolution.confirmationReason,
  };
}

/**
 * Flow Card Priority Chain Resolution
 * 1. PRIMARY: Debit Card / DuitNow (instant bank debit)
 * 2. SECONDARY: E-Wallets with sufficient balance
 * 3. BACKUP: Auto top-up wallet from Bank
 */
function resolveWithFlowCardPriority(
  amount: number,
  sources: FundingSource[],
  config: GuardrailConfig
): PaymentResolution {
  const primarySources = findPrimarySources(sources);
  const secondarySources = findSecondarySources(sources);
  const backupSources = findBackupSources(sources);

  // Step 1: Try PRIMARY sources (Debit Card / DuitNow)
  // These don't require balance check - direct bank debit
  if (primarySources.length > 0) {
    const bestPrimary = primarySources.sort((a, b) => a.priority - b.priority)[0];
    return {
      action: 'USE_SINGLE_SOURCE',
      steps: [{
        action: 'charge',
        sourceId: bestPrimary.id,
        sourceType: bestPrimary.type,
        amount,
        description: `Pay with ${bestPrimary.name}`,
      }],
      requiresConfirmation: amount > config.requireConfirmationAbove,
      confirmationReason: amount > config.requireConfirmationAbove 
        ? `Payment of RM${amount.toFixed(2)} requires confirmation`
        : undefined,
      totalAmount: amount,
    };
  }

  // Step 2: Try SECONDARY sources (Wallets) with sufficient balance
  const walletWithBalance = secondarySources
    .filter(s => s.balance >= amount)
    .sort((a, b) => a.priority - b.priority)[0];

  if (walletWithBalance) {
    return {
      action: 'USE_SINGLE_SOURCE',
      steps: [{
        action: 'charge',
        sourceId: walletWithBalance.id,
        sourceType: walletWithBalance.type,
        amount,
        description: `Pay with ${walletWithBalance.name}`,
      }],
      requiresConfirmation: false,
      totalAmount: amount,
    };
  }

  // Step 3: Try SECONDARY + BACKUP (Wallet + Auto top-up from Bank)
  const primaryWallet = secondarySources.sort((a, b) => a.priority - b.priority)[0];
  const bankForTopUp = backupSources.sort((a, b) => a.priority - b.priority)[0];

  if (primaryWallet && bankForTopUp) {
    const shortfall = amount - primaryWallet.balance;
    const autoCheck = canAutoTopUp(shortfall, config);

    const steps: ResolutionStep[] = [
      {
        action: 'top_up',
        sourceId: bankForTopUp.id,
        sourceType: bankForTopUp.type,
        amount: shortfall,
        description: `Top up from ${bankForTopUp.name}`,
      },
      {
        action: 'charge',
        sourceId: primaryWallet.id,
        sourceType: primaryWallet.type,
        amount,
        description: `Pay with ${primaryWallet.name}`,
      },
    ];

    return {
      action: 'TOP_UP_WALLET',
      steps,
      requiresConfirmation: !autoCheck.allowed,
      confirmationReason: autoCheck.reason,
      totalAmount: amount,
    };
  }

  // Step 4: Fallback - any source that can cover it
  for (const source of sources) {
    if (source.balance >= amount) {
      return {
        action: 'USE_FALLBACK',
        steps: [{
          action: 'charge',
          sourceId: source.id,
          sourceType: source.type,
          amount,
          description: `Pay with ${source.name}`,
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
    blockedReason: 'Insufficient funds. Link a debit card or top up your wallet.',
    totalAmount: amount,
  };
}

/**
 * Try to resolve payment with a specific source
 */
function tryResolveWithSource(
  source: FundingSource,
  amount: number,
  allSources: FundingSource[],
  config: GuardrailConfig,
  fallbackPreference: FallbackPreference
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

  // Case 2: Source is wallet with insufficient balance
  if (source.type === 'wallet') {
    const shortfall = amount - source.balance;
    
    // Handle based on user's fallback preference
    if (fallbackPreference === 'ask_each_time') {
      // Return a resolution that requires user choice
      return {
        action: 'REQUIRES_CONFIRMATION',
        steps: [],
        requiresConfirmation: true,
        confirmationReason: 'Choose payment method: wallet balance is low',
        totalAmount: amount,
      };
    }
    
    if (fallbackPreference === 'use_card') {
      // Check for default card first - prefer direct card payment
      const defaultCard = findDefaultCard(allSources);
      
      if (defaultCard) {
        // Use default card for direct payment (no wallet top-up needed)
        return {
          action: 'USE_FALLBACK',
          steps: [{
            action: 'charge',
            sourceId: defaultCard.id,
            sourceType: defaultCard.type,
            amount,
          }],
          requiresConfirmation: amount > config.requireConfirmationAbove,
          confirmationReason: amount > config.requireConfirmationAbove 
            ? `Card payment of RM${amount.toFixed(2)} requires confirmation`
            : undefined,
          totalAmount: amount,
          preferredCard: true, // Flag for UI to show card preference
        } as PaymentResolution;
      }
    }
    
    // Fallback preference is 'top_up_wallet' OR no card available
    // Try top-up from bank/other sources
    const topUpResult = tryTopUp(shortfall, allSources.filter(s => s.type !== 'card'), config);

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

    // Top-up not possible, try fallback to any remaining source
    return tryFallback(amount, allSources.slice(1), config);
  }

  // Case 3: Non-wallet source insufficient - try fallback
  return tryFallback(amount, allSources.filter(s => s.id !== source.id), config);
}

/**
 * Try to top up wallet from another source (excluding cards)
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
  // Find a non-card source that can cover the top-up
  for (const source of sources) {
    if (source.type !== 'card' && source.balance >= amount) {
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
  // Prefer cards for fallback (direct payment without balance check)
  const cards = sources.filter(s => s.type === 'card');
  if (cards.length > 0) {
    const bestCard = cards.sort((a, b) => a.priority - b.priority)[0];
    return {
      action: 'USE_FALLBACK',
      steps: [{
        action: 'charge',
        sourceId: bestCard.id,
        sourceType: bestCard.type,
        amount,
      }],
      requiresConfirmation: false,
      totalAmount: amount,
    };
  }

  // Find first non-card source that can cover the amount
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
      const source = resolution.steps[0];
      if (source?.sourceType === 'card') {
        return `Using linked card for direct payment`;
      }
      return `Using ${source?.sourceType} as fallback`;
    
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
