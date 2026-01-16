/**
 * FLOW Security Service
 * 
 * Centralized security layer that integrates:
 * - Rate limiting
 * - Transaction signing
 * - Audit logging
 * 
 * All edge functions are called from here for consistency.
 */

import { supabase } from '@/integrations/supabase/client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

export interface TransactionSignature {
  id: string;
  signature: string;
  verified: boolean;
}

export interface AuditLogResult {
  logged: boolean;
  id: string;
  hash: string;
}

/**
 * Check if user is rate limited for an action
 */
export async function checkRateLimit(actionType: string): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limit', {
      body: { action: 'check', actionType },
    });

    if (error) {
      // Fail open - allow if rate limit service is down
      console.warn('[FLOW] Rate limit check unavailable:', error);
      return { allowed: true, remaining: 10, limit: 10, resetAt: '' };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.warn('[FLOW] Rate limit service error:', err);
    return { allowed: true, remaining: 10, limit: 10, resetAt: '' };
  }
}

/**
 * Record a rate-limited action
 */
export async function recordRateLimitAction(actionType: string): Promise<void> {
  try {
    await supabase.functions.invoke('rate-limit', {
      body: { action: 'record', actionType },
    });
  } catch (err) {
    // Non-critical
    console.warn('[FLOW] Rate limit record skipped:', err);
  }
}

/**
 * Sign a transaction payload
 */
export async function signTransaction(
  intentId: string,
  planId: string,
  amount: number,
  payeeName: string,
  rail: string
): Promise<TransactionSignature | null> {
  try {
    const { data, error } = await supabase.functions.invoke('transaction-signing', {
      body: {
        action: 'sign',
        intentId,
        planId,
        payload: { amount, payeeName, rail, timestamp: Date.now() },
      },
    });

    if (error) {
      // This blocks payment, but should not trigger the native full-screen debug overlay.
      console.warn('[FLOW] Transaction signing unavailable:', error);
      return null;
    }

    return data as TransactionSignature;
  } catch (err) {
    console.warn('[FLOW] Signing service error:', err);
    return null;
  }
}

/**
 * Verify a transaction signature
 */
export async function verifyTransactionSignature(signatureId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('transaction-signing', {
      body: { action: 'verify', signatureId },
    });

    if (error) {
      console.warn('[FLOW] Signature verification unavailable:', error);
      return false;
    }

    return data?.verified === true;
  } catch (err) {
    console.warn('[FLOW] Verification service error:', err);
    return false;
  }
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(
  auditAction: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, unknown>,
  riskScore?: number
): Promise<AuditLogResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('audit-log', {
      body: {
        action: 'log',
        auditAction,
        entityType,
        entityId,
        payload,
        riskScore,
      },
    });

    if (error) {
      // Audit is non-critical
      console.warn('[FLOW] Audit log skipped:', error);
      return null;
    }

    return data as AuditLogResult;
  } catch (err) {
    console.warn('[FLOW] Audit service error:', err);
    return null;
  }
}

/**
 * Full security check before payment execution
 * Returns true if payment can proceed
 */
export async function prePaymentSecurityCheck(
  intentId: string,
  planId: string,
  amount: number,
  payeeName: string,
  rail: string
): Promise<{
  approved: boolean;
  signature?: TransactionSignature;
  rateLimitResult?: RateLimitResult;
  error?: string;
}> {
  // 1. Check rate limit
  const rateLimitResult = await checkRateLimit('payment.execute');
  if (!rateLimitResult.allowed) {
    await createAuditLog(
      'PAYMENT_RATE_LIMITED',
      'intent',
      intentId,
      { amount, payeeName, remaining: rateLimitResult.remaining },
      50 // Medium risk
    );
    return {
      approved: false,
      rateLimitResult,
      error: `Too many payment attempts. Try again in a moment.`,
    };
  }

  // 2. Sign the transaction
  const signature = await signTransaction(intentId, planId, amount, payeeName, rail);
  if (!signature) {
    await createAuditLog(
      'PAYMENT_SIGNING_FAILED',
      'intent',
      intentId,
      { amount, payeeName },
      70 // High risk
    );
    return {
      approved: false,
      error: 'Unable to secure transaction. Please try again.',
    };
  }

  // 3. Record the rate limit action
  await recordRateLimitAction('payment.execute');

  // 4. Log the payment initiation
  await createAuditLog(
    'PAYMENT_INITIATED',
    'intent',
    intentId,
    { amount, payeeName, rail, signatureId: signature.id },
    0 // Low risk for initiated payments
  );

  return {
    approved: true,
    signature,
    rateLimitResult,
  };
}

/**
 * Post-payment audit logging
 */
export async function postPaymentAuditLog(
  transactionId: string,
  intentId: string,
  success: boolean,
  amount: number,
  payeeName: string,
  rail: string,
  error?: string
): Promise<void> {
  const action = success ? 'PAYMENT_COMPLETED' : 'PAYMENT_FAILED';
  const riskScore = success ? 0 : 30;

  await createAuditLog(
    action,
    'transaction',
    transactionId,
    { intentId, amount, payeeName, rail, success, error },
    riskScore
  );
}
