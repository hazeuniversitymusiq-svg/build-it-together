/**
 * FLOW Intent Types
 * 
 * Centralized intent type definitions.
 * FLOW has exactly 3 intents. Every user action maps to one.
 */

// ============================================
// Intent Types
// ============================================

export type FlowIntentType = 'PAY_MERCHANT' | 'SEND_MONEY' | 'RECEIVE_MONEY';

export type IntentTrigger = 'QR_SCAN' | 'CONTACT_SELECT' | 'PAYMENT_LINK' | 'MANUAL';

export type IntentStatus = 'pending' | 'authorized' | 'completed' | 'cancelled' | 'failed';

// ============================================
// Base Intent
// ============================================

interface BaseIntent {
  id: string;
  type: FlowIntentType;
  trigger: IntentTrigger;
  createdAt: Date;
  status: IntentStatus;
}

// ============================================
// Intent Variants
// ============================================

export interface PayMerchantIntent extends BaseIntent {
  type: 'PAY_MERCHANT';
  merchant: {
    id: string;
    name: string;
    logo?: string;
  };
  amount: {
    value: number;
    currency: string;
  };
  reference?: string;
}

export interface SendMoneyIntent extends BaseIntent {
  type: 'SEND_MONEY';
  recipient: {
    id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  amount: {
    value: number;
    currency: string;
  };
  note?: string;
}

export interface ReceiveMoneyIntent extends BaseIntent {
  type: 'RECEIVE_MONEY';
  amount?: {
    value: number;
    currency: string;
  };
  from?: {
    name: string;
    phone?: string;
  };
  note?: string;
}

export type FlowIntent = PayMerchantIntent | SendMoneyIntent | ReceiveMoneyIntent;

// ============================================
// QR Payload Types
// ============================================

export interface MerchantQRPayload {
  type: 'merchant';
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  reference?: string;
}

export interface PersonalQRPayload {
  type: 'personal';
  userId?: string;
  name: string;
  phone?: string;
  amount?: number;
  currency?: string;
}

export interface PaymentLinkPayload {
  type: 'payment_link';
  direction: 'pay' | 'request';
  merchantId?: string;
  merchantName?: string;
  recipientName?: string;
  amount?: number;
  currency?: string;
  reference?: string;
}

export type QRPayload = MerchantQRPayload | PersonalQRPayload;
