/**
 * FLOW Intent Engine
 * 
 * Central export for the intent capture layer.
 * This is the core of FLOW's orchestration logic.
 */

// Types
export type {
  FlowIntentType,
  IntentTrigger,
  FlowIntent,
  PayMerchantIntent,
  SendMoneyIntent,
  ReceiveMoneyIntent,
  QRPayload,
  MerchantQRPayload,
  PersonalQRPayload,
  PaymentLinkPayload,
} from './types';

// Parser functions
export {
  parseQRCode,
  parsePaymentLink,
  createIntentFromContact,
  createReceiveIntent,
  createPayIntent,
  createSendIntent,
} from './parser';
