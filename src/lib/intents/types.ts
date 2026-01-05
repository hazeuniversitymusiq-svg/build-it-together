/**
 * FLOW Intent Types
 * 
 * FLOW has exactly 3 intents. Every user action maps to one of these.
 * This is the core of the orchestration layer.
 */

// The three FLOW intents
export type FlowIntentType = 'PAY_MERCHANT' | 'SEND_MONEY' | 'RECEIVE_MONEY';

// Trigger sources that can create an intent
export type IntentTrigger = 'QR_SCAN' | 'CONTACT_SELECT' | 'PAYMENT_LINK' | 'MANUAL';

// Base intent structure
interface BaseIntent {
  id: string;
  type: FlowIntentType;
  trigger: IntentTrigger;
  createdAt: Date;
  status: 'pending' | 'authorized' | 'completed' | 'cancelled' | 'failed';
}

// PAY_MERCHANT: Pay a business/merchant
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

// SEND_MONEY: Send money to a person
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

// RECEIVE_MONEY: Request money from someone
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

// Union type for all intents
export type FlowIntent = PayMerchantIntent | SendMoneyIntent | ReceiveMoneyIntent;

// QR code payload structures
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
