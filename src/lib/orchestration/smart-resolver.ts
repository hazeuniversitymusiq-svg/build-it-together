/**
 * FLOW Smart Resolution Engine
 * 
 * Intelligent payment rail selection using:
 * - User's connected apps (connectors)
 * - Real-time balances (funding sources)
 * - Merchant compatibility (accepted rails)
 * - User payment history (transaction logs)
 * - Connector health (status/availability)
 * 
 * Scoring factors:
 * 1. Compatibility (0-100): Does user have this rail AND merchant accepts it?
 * 2. Balance (0-100): Sufficient funds without top-up?
 * 3. Priority (0-100): User's configured priority
 * 4. History (0-100): How often user uses this rail?
 * 5. Health (0-100): Connector status (available/degraded)
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ConnectorName = Database['public']['Enums']['connector_name'];
type ConnectorStatus = Database['public']['Enums']['connector_status'];

// ============================================
// Types
// ============================================

export interface RailCandidate {
  name: string;
  connectorId: string;
  type: 'wallet' | 'bank' | 'card' | 'biller';
  status: ConnectorStatus;
  fundingSourceId?: string;
  balance: number;
  priority: number;
  capabilities: Record<string, boolean>;
}

export interface ScoredRail extends RailCandidate {
  scores: {
    compatibility: number;
    balance: number;
    priority: number;
    history: number;
    health: number;
  };
  totalScore: number;
  explanation: string;
}

export interface SmartResolutionContext {
  userId: string;
  amount: number;
  intentType: 'PayMerchant' | 'SendMoney' | 'RequestMoney' | 'PayBill';
  merchantRails?: string[];           // Rails merchant accepts
  recipientWallets?: string[];        // For P2P: recipient's wallets
  recipientPreferredWallet?: string;  // For P2P: recipient's default
}

export interface SmartResolutionResult {
  success: boolean;
  recommendedRail?: ScoredRail;
  alternatives: ScoredRail[];
  explanation: string;
  requiresTopUp: boolean;
  topUpAmount?: number;
  topUpSource?: string;
}

// ============================================
// Scoring Weights (totaling 100)
// ============================================

const WEIGHTS = {
  compatibility: 35,  // Most important: can this rail work?
  balance: 30,        // Second: does user have funds?
  priority: 15,       // User's preference matters
  history: 10,        // Past behavior is informative
  health: 10,         // Connector reliability
};

// ============================================
// Core Resolution Logic
// ============================================

/**
 * Get all candidate rails for a user with their current state
 */
async function getUserRails(userId: string): Promise<RailCandidate[]> {
  // Get connectors with their status
  const { data: connectors } = await supabase
    .from('connectors')
    .select('*')
    .eq('user_id', userId);

  if (!connectors?.length) return [];

  // Get funding sources for balance info
  const { data: fundingSources } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('linked_status', 'linked');

  const sourceMap = new Map(
    fundingSources?.map(s => [s.name, s]) || []
  );

  return connectors.map(c => {
    const source = sourceMap.get(c.name);
    return {
      name: c.name,
      connectorId: c.id,
      type: c.type as RailCandidate['type'],
      status: c.status,
      fundingSourceId: source?.id,
      balance: Number(source?.balance || 0),
      priority: source?.priority || 99,
      capabilities: (c.capabilities || {}) as Record<string, boolean>,
    };
  });
}

/**
 * Get user's payment history for frequency analysis
 */
async function getPaymentHistory(
  userId: string, 
  limitDays: number = 30
): Promise<Map<string, number>> {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);

  const { data: logs } = await supabase
    .from('transaction_logs')
    .select('rail_used')
    .eq('user_id', userId)
    .eq('status', 'success')
    .gte('created_at', since.toISOString());

  const counts = new Map<string, number>();
  logs?.forEach(log => {
    if (log.rail_used) {
      counts.set(log.rail_used, (counts.get(log.rail_used) || 0) + 1);
    }
  });

  return counts;
}

/**
 * Calculate compatibility score
 * - Does user have this connector?
 * - Does merchant accept this rail?
 * - Does connector have required capability?
 */
function scoreCompatibility(
  rail: RailCandidate,
  context: SmartResolutionContext
): number {
  const { intentType, merchantRails, recipientWallets, recipientPreferredWallet } = context;

  // Map intent to required capability
  const capabilityMap: Record<string, string> = {
    PayMerchant: 'can_pay_qr',
    SendMoney: 'can_p2p',
    RequestMoney: 'can_receive',
    PayBill: 'can_pay',
  };

  const requiredCap = capabilityMap[intentType];
  
  // Must have required capability
  if (!rail.capabilities[requiredCap]) {
    return 0;
  }

  // For merchant payments: check if merchant accepts this rail
  if (intentType === 'PayMerchant' && merchantRails?.length) {
    if (!merchantRails.includes(rail.name)) {
      return 0; // Merchant doesn't accept this rail
    }
    return 100; // Full compatibility
  }

  // For P2P: bonus for matching recipient's wallets
  if (intentType === 'SendMoney' && recipientWallets?.length) {
    if (rail.name === recipientPreferredWallet) {
      return 100; // Perfect match
    }
    if (recipientWallets.includes(rail.name)) {
      return 80; // Good match
    }
    return 30; // Can still send, but not optimal
  }

  // For other cases, basic capability is enough
  return 70;
}

/**
 * Calculate balance score
 * - Full score if balance covers amount
 * - Partial score based on coverage percentage
 * - Cards get full score (no balance requirement)
 */
function scoreBalance(
  rail: RailCandidate,
  amount: number
): { score: number; requiresTopUp: boolean; topUpAmount: number } {
  // Cards don't require balance
  if (rail.type === 'card') {
    return { score: 100, requiresTopUp: false, topUpAmount: 0 };
  }

  if (rail.balance >= amount) {
    return { score: 100, requiresTopUp: false, topUpAmount: 0 };
  }

  // Partial coverage
  const coverage = rail.balance / amount;
  const topUpAmount = amount - rail.balance;
  
  // If > 50% covered, still usable with top-up
  if (coverage >= 0.5) {
    return { 
      score: Math.round(coverage * 60), // Max 60 for partial
      requiresTopUp: true, 
      topUpAmount 
    };
  }

  // Less than 50% covered - low score
  return { 
    score: Math.round(coverage * 30), 
    requiresTopUp: true, 
    topUpAmount 
  };
}

/**
 * Calculate priority score
 * Priority 1 = 100, Priority 5+ = 20
 */
function scorePriority(rail: RailCandidate): number {
  const priority = rail.priority;
  if (priority <= 1) return 100;
  if (priority === 2) return 80;
  if (priority === 3) return 60;
  if (priority === 4) return 40;
  return 20;
}

/**
 * Calculate history score based on usage frequency
 */
function scoreHistory(
  rail: RailCandidate,
  historyMap: Map<string, number>
): number {
  const totalUsage = Array.from(historyMap.values()).reduce((a, b) => a + b, 0);
  if (totalUsage === 0) return 50; // Neutral for new users

  const railUsage = historyMap.get(rail.name) || 0;
  const usageRatio = railUsage / totalUsage;
  
  return Math.round(usageRatio * 100);
}

/**
 * Calculate health score based on connector status
 */
function scoreHealth(rail: RailCandidate): number {
  switch (rail.status) {
    case 'available': return 100;
    case 'degraded': return 50;
    case 'unavailable': return 0;
    default: return 50;
  }
}

/**
 * Generate human-readable explanation
 */
function generateExplanation(rail: ScoredRail, context: SmartResolutionContext): string {
  const parts: string[] = [];

  // Primary reason
  if (rail.scores.compatibility === 100) {
    if (context.intentType === 'SendMoney' && context.recipientPreferredWallet === rail.name) {
      parts.push(`${rail.name} is ${context.recipientPreferredWallet ? 'recipient\'s preferred wallet' : 'compatible'}`);
    } else if (context.merchantRails?.includes(rail.name)) {
      parts.push(`Merchant accepts ${rail.name}`);
    } else {
      parts.push(`${rail.name} is available`);
    }
  }

  // Balance status
  if (rail.scores.balance === 100) {
    if (rail.type !== 'card') {
      parts.push(`sufficient balance (RM ${rail.balance.toFixed(2)})`);
    }
  } else if (rail.scores.balance > 0) {
    parts.push(`needs top-up of RM ${(context.amount - rail.balance).toFixed(2)}`);
  }

  // Priority mention
  if (rail.priority === 1) {
    parts.push('your preferred payment method');
  }

  return parts.join(', ') || 'Available for payment';
}

/**
 * Find best top-up source for a wallet
 */
async function findTopUpSource(
  userId: string,
  excludeRail: string,
  amount: number
): Promise<{ source: string; sourceId: string } | null> {
  const { data: sources } = await supabase
    .from('funding_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('linked_status', 'linked')
    .eq('available', true)
    .neq('name', excludeRail)
    .order('priority', { ascending: true });

  if (!sources?.length) return null;

  // Prefer bank for top-up (usually has more funds)
  const bank = sources.find(s => s.type === 'bank' && Number(s.balance) >= amount);
  if (bank) return { source: bank.name, sourceId: bank.id };

  // Any source with sufficient balance
  const any = sources.find(s => Number(s.balance) >= amount);
  if (any) return { source: any.name, sourceId: any.id };

  return null;
}

// ============================================
// Main Export
// ============================================

/**
 * Smart resolution: Score all rails and return best option
 */
export async function smartResolve(
  context: SmartResolutionContext
): Promise<SmartResolutionResult> {
  const { userId, amount, intentType, merchantRails } = context;

  // Get user's available rails
  const userRails = await getUserRails(userId);
  
  if (userRails.length === 0) {
    return {
      success: false,
      alternatives: [],
      explanation: 'No payment apps connected. Please connect at least one wallet or bank.',
      requiresTopUp: false,
    };
  }

  // Get usage history for scoring
  const historyMap = await getPaymentHistory(userId);

  // Score each rail
  const scoredRails: ScoredRail[] = userRails.map(rail => {
    const compatScore = scoreCompatibility(rail, context);
    const balanceResult = scoreBalance(rail, amount);
    const priorityScore = scorePriority(rail);
    const historyScore = scoreHistory(rail, historyMap);
    const healthScore = scoreHealth(rail);

    const scores = {
      compatibility: compatScore,
      balance: balanceResult.score,
      priority: priorityScore,
      history: historyScore,
      health: healthScore,
    };

    // Weighted total
    const totalScore = 
      (scores.compatibility * WEIGHTS.compatibility +
       scores.balance * WEIGHTS.balance +
       scores.priority * WEIGHTS.priority +
       scores.history * WEIGHTS.history +
       scores.health * WEIGHTS.health) / 100;

    const scored: ScoredRail = {
      ...rail,
      scores,
      totalScore,
      explanation: '', // Will fill after sorting
    };

    return scored;
  });

  // Filter out incompatible rails (score 0)
  const compatibleRails = scoredRails
    .filter(r => r.scores.compatibility > 0 && r.scores.health > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  if (compatibleRails.length === 0) {
    const merchantInfo = merchantRails?.length 
      ? `Merchant accepts: ${merchantRails.join(', ')}. ` 
      : '';
    return {
      success: false,
      alternatives: [],
      explanation: `${merchantInfo}None of your connected apps match. Please connect a compatible payment app.`,
      requiresTopUp: false,
    };
  }

  // Add explanations
  compatibleRails.forEach(rail => {
    rail.explanation = generateExplanation(rail, context);
  });

  const recommended = compatibleRails[0];
  const alternatives = compatibleRails.slice(1, 4); // Top 3 alternatives

  // Check if top-up is needed
  const balanceCheck = scoreBalance(recommended, amount);
  let topUpSource: string | undefined;
  
  if (balanceCheck.requiresTopUp) {
    const source = await findTopUpSource(userId, recommended.name, balanceCheck.topUpAmount);
    topUpSource = source?.source;
  }

  return {
    success: true,
    recommendedRail: recommended,
    alternatives,
    explanation: recommended.explanation,
    requiresTopUp: balanceCheck.requiresTopUp,
    topUpAmount: balanceCheck.topUpAmount || undefined,
    topUpSource,
  };
}

/**
 * Get a summary of why a rail was chosen (for UI display)
 */
export function getResolutionSummary(result: SmartResolutionResult): string {
  if (!result.success || !result.recommendedRail) {
    return result.explanation;
  }

  const rail = result.recommendedRail;
  const parts = [`Using ${rail.name}`];

  if (result.requiresTopUp && result.topUpAmount) {
    parts.push(`(top-up RM ${result.topUpAmount.toFixed(2)} from ${result.topUpSource || 'bank'})`);
  }

  if (rail.scores.compatibility === 100 && rail.scores.balance === 100) {
    parts.push('• Best match');
  }

  return parts.join(' ');
}
