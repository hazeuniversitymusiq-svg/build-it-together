/**
 * FLOW Guardrails
 * 
 * Determines when FLOW proceeds automatically vs. stops to ask.
 * These are safety rails - not intelligence.
 */

import type { GuardrailConfig, PaymentRequest, UserPaymentState } from './types';

// Default guardrail configuration
export const DEFAULT_GUARDRAILS: GuardrailConfig = {
  maxAutoTopUpAmount: 100,        // Auto top-up up to $100
  maxSinglePaymentAuto: 50,       // Auto-approve payments up to $50
  requireConfirmationAbove: 500,  // Always confirm above $500
  dailyAutoLimit: 200,            // $200/day auto-approved max
  allowSplitPayments: false,      // Start simple - no splits
};

export interface GuardrailCheck {
  canProceedAuto: boolean;
  requiresConfirmation: boolean;
  reason?: string;
  blockedReason?: string;
}

/**
 * Check if a payment can proceed automatically or needs user confirmation
 */
export function checkGuardrails(
  request: PaymentRequest,
  state: UserPaymentState,
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): GuardrailCheck {
  const { amount } = request;
  
  // Rule 1: Hard block - amount exceeds maximum confirmable
  if (amount > config.requireConfirmationAbove * 10) {
    return {
      canProceedAuto: false,
      requiresConfirmation: false,
      blockedReason: 'Amount exceeds maximum allowed. Contact support.',
    };
  }

  // Rule 2: Always require confirmation above threshold
  if (amount > config.requireConfirmationAbove) {
    return {
      canProceedAuto: false,
      requiresConfirmation: true,
      reason: `Payments above ${formatCurrency(config.requireConfirmationAbove)} require confirmation`,
    };
  }

  // Rule 3: Check daily auto-approved limit
  const todayTotal = state.dailyAutoApproved + amount;
  if (todayTotal > config.dailyAutoLimit) {
    return {
      canProceedAuto: false,
      requiresConfirmation: true,
      reason: `Daily auto-approved limit (${formatCurrency(config.dailyAutoLimit)}) would be exceeded`,
    };
  }

  // Rule 4: Check single payment auto-approve threshold
  if (amount > config.maxSinglePaymentAuto) {
    return {
      canProceedAuto: false,
      requiresConfirmation: true,
      reason: `Amount exceeds auto-approve threshold (${formatCurrency(config.maxSinglePaymentAuto)})`,
    };
  }

  // All guardrails passed - can proceed automatically
  return {
    canProceedAuto: true,
    requiresConfirmation: false,
  };
}

/**
 * Check if a top-up amount is within auto-approved limits
 */
export function canAutoTopUp(
  topUpAmount: number,
  config: GuardrailConfig = DEFAULT_GUARDRAILS
): { allowed: boolean; reason?: string } {
  if (topUpAmount <= 0) {
    return { allowed: false, reason: 'Invalid top-up amount' };
  }

  if (topUpAmount > config.maxAutoTopUpAmount) {
    return {
      allowed: false,
      reason: `Top-up of ${formatCurrency(topUpAmount)} exceeds auto limit (${formatCurrency(config.maxAutoTopUpAmount)})`,
    };
  }

  return { allowed: true };
}

/**
 * Get the current day's payment state, resetting if needed
 */
export function getOrResetDailyState(state: UserPaymentState): UserPaymentState {
  const today = new Date().toISOString().split('T')[0];
  
  if (state.lastResetDate !== today) {
    return {
      dailyAutoApproved: 0,
      lastResetDate: today,
    };
  }
  
  return state;
}

/**
 * Update state after a successful auto-approved payment
 */
export function recordAutoApprovedPayment(
  state: UserPaymentState,
  amount: number
): UserPaymentState {
  const currentState = getOrResetDailyState(state);
  return {
    ...currentState,
    dailyAutoApproved: currentState.dailyAutoApproved + amount,
  };
}

// Helper
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
