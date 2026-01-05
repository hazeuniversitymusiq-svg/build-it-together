/**
 * FLOW Orchestration Engine - Types
 * 
 * Core types for the rules-based payment orchestration.
 * No ML - pure deterministic logic.
 */

// Funding source types
export type FundingRailType = 'wallet' | 'bank' | 'card';

export interface FundingSource {
  id: string;
  type: FundingRailType;
  name: string;
  balance: number; // Available balance (for wallet) or limit (for card)
  isLinked: boolean;
  isAvailable: boolean; // Can be used right now
  priority: number; // Lower = higher priority (from user's declared order)
}

// Payment request
export interface PaymentRequest {
  amount: number;
  currency: string;
  intentId: string;
  merchantId?: string;
  recipientId?: string;
}

// Resolution result
export type ResolutionAction = 
  | 'USE_SINGLE_SOURCE'      // One source covers it
  | 'TOP_UP_WALLET'          // Need to top up wallet first
  | 'USE_FALLBACK'           // Primary unavailable, use next
  | 'SPLIT_PAYMENT'          // Split across sources (future)
  | 'REQUIRES_CONFIRMATION'  // Amount exceeds auto-approve threshold
  | 'BLOCKED'                // Cannot proceed - needs user action
  | 'INSUFFICIENT_FUNDS';    // No source can cover this

export interface ResolutionStep {
  action: 'charge' | 'top_up';
  sourceId: string;
  sourceType: FundingRailType;
  amount: number;
}

export interface PaymentResolution {
  action: ResolutionAction;
  steps: ResolutionStep[];
  requiresConfirmation: boolean;
  confirmationReason?: string;
  blockedReason?: string;
  totalAmount: number;
}

// Guardrail configuration
export interface GuardrailConfig {
  maxAutoTopUpAmount: number;        // Max amount FLOW can top up without asking
  maxSinglePaymentAuto: number;      // Max payment that auto-approves
  requireConfirmationAbove: number;  // Always ask above this amount
  dailyAutoLimit: number;            // Daily limit for auto-approved payments
  allowSplitPayments: boolean;       // Whether to split across sources
}

// User's payment state (for tracking daily limits, etc.)
export interface UserPaymentState {
  dailyAutoApproved: number;
  lastResetDate: string; // ISO date
}
