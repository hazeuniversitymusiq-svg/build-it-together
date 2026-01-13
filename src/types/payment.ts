/**
 * FLOW Payment Types
 * 
 * Centralized type definitions for payment orchestration.
 * Single source of truth - no duplicates.
 */

// ============================================
// Funding Source Types
// ============================================

export type FundingRailType = 'wallet' | 'bank' | 'card' | 'debit_card' | 'credit_card' | 'bnpl';

export interface FundingSource {
  id: string;
  type: FundingRailType;
  name: string;
  balance: number;
  isLinked: boolean;
  isAvailable: boolean;
  priority: number;
  maxAutoTopUp?: number;
  requireConfirmAbove?: number;
  currency?: string;
}

// ============================================
// Linked Card Types (subset of FundingSource)
// ============================================

export type CardBrand = 'visa' | 'mastercard' | 'amex';

export interface LinkedCard {
  id: string;
  cardNumber: string; // Last 4 digits only
  maskedNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: CardBrand;
  fundingSourceType: 'debit_card' | 'credit_card';
  isDefault: boolean;
  isAvailable: boolean;
  priority: number;
  addedAt: string;
  nickname?: string;
}

// ============================================
// Payment Request Types
// ============================================

export interface PaymentRequest {
  amount: number;
  currency: string;
  intentId: string;
  merchantId?: string;
  recipientId?: string;
}

// ============================================
// Resolution Types
// ============================================

export type ResolutionAction = 
  | 'USE_SINGLE_SOURCE'
  | 'TOP_UP_WALLET'
  | 'USE_FALLBACK'
  | 'SPLIT_PAYMENT'
  | 'REQUIRES_CONFIRMATION'
  | 'BLOCKED'
  | 'INSUFFICIENT_FUNDS';

export interface ResolutionStep {
  action: string;
  sourceId?: string;
  sourceType?: FundingRailType;
  amount?: number;
  description?: string;
  source?: string;
}

export interface PaymentResolution {
  action: ResolutionAction;
  steps: ResolutionStep[];
  requiresConfirmation: boolean;
  confirmationReason?: string;
  blockedReason?: string;
  totalAmount: number;
  preferredCard?: boolean;
}

// ============================================
// Guardrails & State
// ============================================

export interface GuardrailConfig {
  maxAutoTopUpAmount: number;
  maxSinglePaymentAuto: number;
  requireConfirmationAbove: number;
  dailyAutoLimit: number;
  allowSplitPayments: boolean;
}

export interface UserPaymentState {
  dailyAutoApproved: number;
  lastResetDate: string;
}

// ============================================
// Resolution Plan (for persistence)
// ============================================

export type RiskLevel = 'low' | 'medium' | 'high';

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
  gateResult?: {
    passed: boolean;
    blockedReason?: string;
  };
}

// ============================================
// Preferences
// ============================================

export type FallbackPreference = 'use_card' | 'top_up_wallet' | 'ask_each_time';
