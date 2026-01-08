/**
 * FLOW Intent Creators
 * 
 * Core functions to create intents from various sources.
 * No UI logic - pure data transformation.
 */

import { supabase } from '@/integrations/supabase/client';
import { checkIntentCreationGates, type GateResult } from './gates';
import type { Database, Json } from '@/integrations/supabase/types';

type IntentType = Database['public']['Enums']['intent_type'];

export interface IntentInput {
  userId: string;
  type: IntentType;
  payeeName: string;
  payeeIdentifier: string;
  amount: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface IntentResult {
  success: boolean;
  intentId?: string;
  error?: string;
  gateResult?: GateResult;
}

/**
 * Base intent creator - validates gates and inserts intent
 */
async function createIntent(input: IntentInput): Promise<IntentResult> {
  // Check identity gate
  const gateResult = await checkIntentCreationGates(input.userId);
  if (!gateResult.passed) {
    return {
      success: false,
      error: gateResult.blockedReason,
      gateResult,
    };
  }

  const { data, error } = await supabase
    .from('intents')
    .insert([{
      user_id: input.userId,
      type: input.type,
      payee_name: input.payeeName,
      payee_identifier: input.payeeIdentifier,
      amount: input.amount,
      currency: input.currency || 'MYR',
      metadata: (input.metadata || {}) as Json,
    }])
    .select('id')
    .single();

  if (error || !data) {
    return {
      success: false,
      error: 'Failed to create payment request',
    };
  }

  return {
    success: true,
    intentId: data.id,
  };
}

/**
 * CreateIntentFromQR
 * Creates a PayMerchant intent from a scanned QR code
 */
export async function createIntentFromQR(
  userId: string,
  qrPayloadId: string
): Promise<IntentResult> {
  // Fetch QR payload
  const { data: qrPayload, error } = await supabase
    .from('qr_payloads')
    .select('*')
    .eq('id', qrPayloadId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !qrPayload) {
    return {
      success: false,
      error: 'QR code not found',
    };
  }

  return createIntent({
    userId,
    type: 'PayMerchant',
    payeeName: qrPayload.merchant_name || 'Merchant',
    payeeIdentifier: qrPayload.reference_id || qrPayload.id,
    amount: qrPayload.amount || 0,
    metadata: {
      qrPayloadId: qrPayload.id,
      railsAvailable: qrPayload.rails_available,
      rawPayload: qrPayload.raw_payload,
    },
  });
}

/**
 * CreateIntentSendMoney
 * Creates a SendMoney intent to a contact
 */
export async function createIntentSendMoney(
  userId: string,
  contactId: string,
  amount: number,
  note?: string
): Promise<IntentResult> {
  // Fetch contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !contact) {
    return {
      success: false,
      error: 'Contact not found',
    };
  }

  return createIntent({
    userId,
    type: 'SendMoney',
    payeeName: contact.name,
    payeeIdentifier: contact.phone,
    amount,
    metadata: {
      contactId: contact.id,
      supportedWallets: contact.supported_wallets,
      defaultWallet: contact.default_wallet,
      note,
    },
  });
}

/**
 * CreateIntentPayBill
 * Creates a PayBill intent for a linked biller account
 */
export async function createIntentPayBill(
  userId: string,
  billerAccountId: string,
  amount: number
): Promise<IntentResult> {
  // Fetch biller account
  const { data: billerAccount, error } = await supabase
    .from('biller_accounts')
    .select('*')
    .eq('id', billerAccountId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !billerAccount) {
    return {
      success: false,
      error: 'Biller account not found',
    };
  }

  if (billerAccount.status !== 'linked') {
    return {
      success: false,
      error: 'Biller account is not linked',
    };
  }

  return createIntent({
    userId,
    type: 'PayBill',
    payeeName: billerAccount.biller_name,
    payeeIdentifier: billerAccount.account_reference,
    amount,
    metadata: {
      billerAccountId: billerAccount.id,
      billerName: billerAccount.biller_name,
    },
  });
}

/**
 * CreateIntentRequestMoney
 * Creates a RequestMoney intent (for completeness)
 */
export async function createIntentRequestMoney(
  userId: string,
  fromName: string,
  fromPhone: string,
  amount: number,
  note?: string
): Promise<IntentResult> {
  return createIntent({
    userId,
    type: 'RequestMoney',
    payeeName: fromName,
    payeeIdentifier: fromPhone,
    amount,
    metadata: { note },
  });
}
