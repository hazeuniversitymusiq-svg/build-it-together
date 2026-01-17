/**
 * FLOW Execute Plan
 * 
 * Executes a resolution plan and creates transaction records.
 * Handles both sync and async execution modes.
 * 
 * SECURITY: Integrates rate limiting, transaction signing, and audit logging.
 */

import { supabase } from '@/integrations/supabase/client';
import { checkResolutionGates, type GateResult } from './gates';
import { 
  prePaymentSecurityCheck, 
  postPaymentAuditLog,
  type TransactionSignature 
} from './security-service';
import type { Database } from '@/integrations/supabase/types';

type TransactionStatus = Database['public']['Enums']['transaction_status'];
type FailureType = Database['public']['Enums']['failure_type'];

export interface ExecutionResult {
  success: boolean;
  transactionId?: string;
  status?: TransactionStatus;
  error?: string;
  failureType?: FailureType;
  gateResult?: GateResult;
  signature?: TransactionSignature;
}

interface ExecutionContext {
  userId: string;
  deviceId: string;
  planId: string;
  signature?: TransactionSignature;
}

/**
 * Check if user has paused FLOW
 */
async function checkPausedState(userId: string): Promise<boolean> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('flow_paused')
    .eq('user_id', userId)
    .maybeSingle();

  return settings?.flow_paused ?? false;
}

/**
 * Classify failure type based on error context
 */
function classifyFailure(error: string, context?: Record<string, unknown>): FailureType {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('insufficient') || errorLower.includes('balance')) {
    return 'insufficient_funds';
  }
  if (errorLower.includes('connector') || errorLower.includes('unavailable') || errorLower.includes('timeout')) {
    return 'connector_unavailable';
  }
  if (errorLower.includes('paused')) {
    return 'user_paused';
  }
  if (errorLower.includes('risk') || errorLower.includes('blocked')) {
    return 'risk_blocked';
  }
  if (errorLower.includes('identity') || errorLower.includes('suspended')) {
    return 'identity_blocked';
  }

  return 'unknown';
}

/**
 * Create execution log entry
 */
async function logExecution(
  userId: string,
  transactionId: string,
  intentSnapshot: unknown,
  planSnapshot: unknown,
  connectorCalls: unknown[],
  outcome: unknown
): Promise<void> {
  await supabase.from('execution_logs').insert([{
    user_id: userId,
    transaction_id: transactionId,
    intent_snapshot: intentSnapshot as Database['public']['Tables']['execution_logs']['Insert']['intent_snapshot'],
    plan_snapshot: planSnapshot as Database['public']['Tables']['execution_logs']['Insert']['plan_snapshot'],
    connector_calls: connectorCalls as Database['public']['Tables']['execution_logs']['Insert']['connector_calls'],
    outcome: outcome as Database['public']['Tables']['execution_logs']['Insert']['outcome'],
  }]);
}

/**
 * Simulate connector call (for prototype mode)
 * In production, this would call actual connector APIs via edge functions
 * 
 * Realistic simulation: 95% success rate, occasional failures
 */
async function simulateConnectorCall(
  connectorName: string,
  action: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  // Simulate network delay (realistic: 100-500ms)
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 400));

  // Simulate realistic failure rate (5%)
  const shouldFail = Math.random() < 0.05;
  if (shouldFail) {
    const errors = [
      'Connection timeout',
      'Insufficient balance on connector',
      'Connector temporarily unavailable',
    ];
    return { 
      success: false, 
      error: errors[Math.floor(Math.random() * errors.length)] 
    };
  }

  return { success: true };
}

/**
 * Execute a resolution plan synchronously
 */
async function executeSyncPlan(
  context: ExecutionContext,
  plan: Database['public']['Tables']['resolution_plans']['Row'],
  intent: Database['public']['Tables']['intents']['Row']
): Promise<ExecutionResult> {
  const connectorCalls: Record<string, unknown>[] = [];
  const steps = plan.steps as Array<{ action: string; source?: string; amount?: number }>;

  // Execute each step
  for (const step of steps) {
    const callResult = await simulateConnectorCall(
      step.source || plan.chosen_rail,
      step.action,
      step.amount || Number(intent.amount)
    );

    connectorCalls.push({
      connector: step.source || plan.chosen_rail,
      action: step.action,
      amount: step.amount,
      result: callResult.success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
    });

    if (!callResult.success) {
      // Create failed transaction
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: context.userId,
          intent_id: plan.intent_id,
          plan_id: context.planId,
          status: 'failed',
          failure_type: classifyFailure(callResult.error || 'Connector call failed'),
          receipt: { error: callResult.error },
        })
        .select('id')
        .single();

      if (transaction) {
        await logExecution(
          context.userId,
          transaction.id,
          intent as unknown as Record<string, unknown>,
          plan as unknown as Record<string, unknown>,
          connectorCalls,
          { success: false, error: callResult.error }
        );

        // Log failed transaction for activity feed
        await supabase.from('transaction_logs').insert({
          user_id: context.userId,
          intent_id: plan.intent_id,
          intent_type: intent.type,
          amount: Number(intent.amount),
          currency: intent.currency,
          status: 'failed',
          trigger: 'qr_scan',
          rail_used: plan.chosen_rail,
          merchant_name: intent.type === 'PayMerchant' ? intent.payee_name : null,
          recipient_name: intent.type === 'SendMoney' ? intent.payee_name : null,
          reference: transaction.id.substring(0, 8).toUpperCase(),
        });
      }

      return {
        success: false,
        transactionId: transaction?.id,
        status: 'failed',
        failureType: classifyFailure(callResult.error || 'Connector call failed'),
        error: callResult.error,
      };
    }
  }

  // Create successful transaction with signature reference
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: context.userId,
      intent_id: plan.intent_id,
      plan_id: context.planId,
      status: 'success',
      receipt: {
        amount: Number(intent.amount),
        currency: intent.currency,
        payee: intent.payee_name,
        rail: plan.chosen_rail,
        completedAt: new Date().toISOString(),
        signatureId: context.signature?.id,
      },
    })
    .select('id')
    .single();

  if (txError || !transaction) {
    // Log failure
    await postPaymentAuditLog(
      'unknown',
      plan.intent_id,
      false,
      Number(intent.amount),
      intent.payee_name,
      plan.chosen_rail,
      'Failed to record transaction'
    );
    return {
      success: false,
      error: 'Failed to record transaction',
      failureType: 'unknown',
    };
  }

  // Log execution
  await logExecution(
    context.userId,
    transaction.id,
    intent as unknown as Record<string, unknown>,
    plan as unknown as Record<string, unknown>,
    connectorCalls,
    { success: true, signatureId: context.signature?.id }
  );

  // === CREATE TRANSACTION LOG FOR ACTIVITY FEED ===
  // Determine trigger based on intent type
  const triggerType = (() => {
    switch (intent.type) {
      case 'PayMerchant': return 'qr_scan';
      case 'SendMoney': return 'contact';
      case 'RequestMoney': return 'request';
      case 'PayBill': return 'bill_payment';
      default: return 'manual';
    }
  })();

  await supabase.from('transaction_logs').insert({
    user_id: context.userId,
    intent_id: plan.intent_id,
    intent_type: intent.type,
    amount: Number(intent.amount),
    currency: intent.currency,
    status: 'success',
    trigger: triggerType,
    rail_used: plan.chosen_rail,
    merchant_name: (intent.type === 'PayMerchant' || intent.type === 'PayBill') ? intent.payee_name : null,
    merchant_id: (intent.type === 'PayMerchant' || intent.type === 'PayBill') ? intent.payee_identifier : null,
    recipient_name: (intent.type === 'SendMoney' || intent.type === 'RequestMoney') ? intent.payee_name : null,
    recipient_id: (intent.type === 'SendMoney' || intent.type === 'RequestMoney') ? intent.payee_identifier : null,
    reference: transaction.id.substring(0, 8).toUpperCase(),
  });

  // === UPDATE WALLET BALANCE (deduct amount) ===
  // Find the funding source used and deduct balance
  const { data: fundingSource } = await supabase
    .from('funding_sources')
    .select('id, balance, name')
    .eq('user_id', context.userId)
    .eq('name', plan.chosen_rail)
    .maybeSingle();

  if (fundingSource) {
    const newBalance = Math.max(0, fundingSource.balance - Number(intent.amount));
    await supabase
      .from('funding_sources')
      .update({ balance: newBalance })
      .eq('id', fundingSource.id);
  }

  // Post-payment audit log
  await postPaymentAuditLog(
    transaction.id,
    plan.intent_id,
    true,
    Number(intent.amount),
    intent.payee_name,
    plan.chosen_rail
  );

  return {
    success: true,
    transactionId: transaction.id,
    status: 'success',
    signature: context.signature,
  };
}

/**
 * Execute a resolution plan asynchronously
 */
async function executeAsyncPlan(
  context: ExecutionContext,
  plan: Database['public']['Tables']['resolution_plans']['Row'],
  intent: Database['public']['Tables']['intents']['Row']
): Promise<ExecutionResult> {
  // Create pending transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: context.userId,
      intent_id: plan.intent_id,
      plan_id: context.planId,
      status: 'pending',
      receipt: {
        amount: Number(intent.amount),
        currency: intent.currency,
        payee: intent.payee_name,
        rail: plan.chosen_rail,
        initiatedAt: new Date().toISOString(),
      },
    })
    .select('id')
    .single();

  if (txError || !transaction) {
    return {
      success: false,
      error: 'Failed to initiate transaction',
      failureType: 'unknown',
    };
  }

  // In a real system, this would queue the execution
  // For prototype, we'll simulate completion
  setTimeout(async () => {
    await supabase
      .from('transactions')
      .update({
        status: 'success',
        receipt: {
          amount: Number(intent.amount),
          currency: intent.currency,
          payee: intent.payee_name,
          rail: plan.chosen_rail,
          initiatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id);

    await logExecution(
      context.userId,
      transaction.id,
      intent as unknown as Record<string, unknown>,
      plan as unknown as Record<string, unknown>,
      [{ connector: plan.chosen_rail, action: 'PAY', result: 'success' }],
      { success: true, async: true }
    );
  }, 2000);

  return {
    success: true,
    transactionId: transaction.id,
    status: 'pending',
  };
}

/**
 * ExecutePlan
 * Main execution function - runs a resolution plan
 * 
 * SECURITY: Now includes rate limiting, transaction signing, and audit logging
 */
export async function executePlan(
  userId: string,
  deviceId: string,
  planId: string
): Promise<ExecutionResult> {
  // Check gates
  const gateResult = await checkResolutionGates(userId, deviceId);
  if (!gateResult.passed) {
    return {
      success: false,
      error: gateResult.blockedReason,
      gateResult,
    };
  }

  // Check paused state
  const isPaused = await checkPausedState(userId);
  if (isPaused) {
    return {
      success: false,
      error: 'FLOW is currently paused',
      failureType: 'user_paused',
    };
  }

  // Fetch plan
  const { data: plan, error: planError } = await supabase
    .from('resolution_plans')
    .select('*')
    .eq('id', planId)
    .eq('user_id', userId)
    .maybeSingle();

  if (planError || !plan) {
    return {
      success: false,
      error: 'Payment plan not found',
    };
  }

  // Fetch intent
  const { data: intent, error: intentError } = await supabase
    .from('intents')
    .select('*')
    .eq('id', plan.intent_id)
    .eq('user_id', userId)
    .maybeSingle();

  if (intentError || !intent) {
    return {
      success: false,
      error: 'Payment request not found',
    };
  }

  // === SECURITY: Pre-payment checks ===
  const securityCheck = await prePaymentSecurityCheck(
    plan.intent_id,
    planId,
    Number(intent.amount),
    intent.payee_name,
    plan.chosen_rail
  );

  if (!securityCheck.approved) {
    return {
      success: false,
      error: securityCheck.error || 'Security check failed',
      failureType: 'risk_blocked',
    };
  }

  const context: ExecutionContext = {
    userId,
    deviceId,
    planId,
    signature: securityCheck.signature,
  };

  // Execute based on mode
  if (plan.execution_mode === 'async') {
    return executeAsyncPlan(context, plan, intent);
  }

  return executeSyncPlan(context, plan, intent);
}

/**
 * Cancel a pending transaction
 */
export async function cancelTransaction(
  userId: string,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: transaction, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !transaction) {
    return { success: false, error: 'Transaction not found' };
  }

  if (transaction.status !== 'pending') {
    return { success: false, error: 'Only pending transactions can be cancelled' };
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('id', transactionId);

  if (updateError) {
    return { success: false, error: 'Failed to cancel transaction' };
  }

  return { success: true };
}
