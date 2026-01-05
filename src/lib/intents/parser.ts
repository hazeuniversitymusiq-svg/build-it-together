/**
 * Intent Parser
 * 
 * Parses trigger inputs and maps them to FLOW intents.
 * Every trigger → exactly one intent type.
 */

import { 
  FlowIntent, 
  PayMerchantIntent, 
  SendMoneyIntent, 
  ReceiveMoneyIntent,
  QRPayload,
  PaymentLinkPayload,
  MerchantQRPayload,
  PersonalQRPayload
} from './types';

// Generate unique intent ID
const generateIntentId = (): string => {
  return `intent_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

/**
 * Parse a QR code and create the appropriate intent
 * 
 * Merchant QR → PAY_MERCHANT
 * Personal QR → SEND_MONEY
 */
export function parseQRCode(rawData: string): FlowIntent | null {
  try {
    const payload = JSON.parse(rawData) as QRPayload;
    
    if (payload.type === 'merchant') {
      return createPayMerchantIntent(payload, 'QR_SCAN');
    }
    
    if (payload.type === 'personal') {
      return createSendMoneyIntent(payload, 'QR_SCAN');
    }
    
    return null;
  } catch {
    // Try to parse as simple URL or fallback formats
    return parseSimpleQR(rawData);
  }
}

/**
 * Parse simple QR formats (URLs, plain text)
 */
function parseSimpleQR(rawData: string): FlowIntent | null {
  // Check if it's a FLOW payment URL
  if (rawData.startsWith('flow://pay/')) {
    const merchantName = decodeURIComponent(rawData.replace('flow://pay/', '').split('?')[0]);
    const params = new URLSearchParams(rawData.split('?')[1] || '');
    
    return {
      id: generateIntentId(),
      type: 'PAY_MERCHANT',
      trigger: 'QR_SCAN',
      createdAt: new Date(),
      status: 'pending',
      merchant: {
        id: params.get('id') || merchantName.toLowerCase().replace(/\s/g, '_'),
        name: merchantName,
      },
      amount: {
        value: parseFloat(params.get('amount') || '0'),
        currency: params.get('currency') || 'USD',
      },
      reference: params.get('ref') || undefined,
    };
  }
  
  // Check if it's a FLOW send URL
  if (rawData.startsWith('flow://send/')) {
    const recipientName = decodeURIComponent(rawData.replace('flow://send/', '').split('?')[0]);
    const params = new URLSearchParams(rawData.split('?')[1] || '');
    
    return {
      id: generateIntentId(),
      type: 'SEND_MONEY',
      trigger: 'QR_SCAN',
      createdAt: new Date(),
      status: 'pending',
      recipient: {
        name: recipientName,
        phone: params.get('phone') || undefined,
      },
      amount: {
        value: parseFloat(params.get('amount') || '0'),
        currency: params.get('currency') || 'USD',
      },
      note: params.get('note') || undefined,
    };
  }
  
  return null;
}

/**
 * Create PAY_MERCHANT intent from merchant QR payload
 */
function createPayMerchantIntent(
  payload: MerchantQRPayload, 
  trigger: 'QR_SCAN' | 'PAYMENT_LINK'
): PayMerchantIntent {
  return {
    id: generateIntentId(),
    type: 'PAY_MERCHANT',
    trigger,
    createdAt: new Date(),
    status: 'pending',
    merchant: {
      id: payload.merchantId,
      name: payload.merchantName,
    },
    amount: {
      value: payload.amount,
      currency: payload.currency,
    },
    reference: payload.reference,
  };
}

/**
 * Create SEND_MONEY intent from personal QR or contact selection
 */
function createSendMoneyIntent(
  payload: PersonalQRPayload, 
  trigger: 'QR_SCAN' | 'CONTACT_SELECT'
): SendMoneyIntent {
  return {
    id: generateIntentId(),
    type: 'SEND_MONEY',
    trigger,
    createdAt: new Date(),
    status: 'pending',
    recipient: {
      id: payload.userId,
      name: payload.name,
      phone: payload.phone,
    },
    amount: {
      value: payload.amount || 0,
      currency: payload.currency || 'USD',
    },
  };
}

/**
 * Create intent from contact selection
 * Contact selection always → SEND_MONEY
 */
export function createIntentFromContact(contact: {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
}): SendMoneyIntent {
  return {
    id: generateIntentId(),
    type: 'SEND_MONEY',
    trigger: 'CONTACT_SELECT',
    createdAt: new Date(),
    status: 'pending',
    recipient: {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
    },
    amount: {
      value: 0, // To be filled in by user
      currency: 'USD',
    },
  };
}

/**
 * Parse payment link and create appropriate intent
 * 
 * Pay links → PAY_MERCHANT
 * Request links → RECEIVE_MONEY
 */
export function parsePaymentLink(payload: PaymentLinkPayload): FlowIntent {
  if (payload.direction === 'pay') {
    return {
      id: generateIntentId(),
      type: 'PAY_MERCHANT',
      trigger: 'PAYMENT_LINK',
      createdAt: new Date(),
      status: 'pending',
      merchant: {
        id: payload.merchantId || 'unknown',
        name: payload.merchantName || 'Unknown Merchant',
      },
      amount: {
        value: payload.amount || 0,
        currency: payload.currency || 'USD',
      },
      reference: payload.reference,
    };
  }
  
  // Request link = someone wants to receive money from user
  return {
    id: generateIntentId(),
    type: 'RECEIVE_MONEY',
    trigger: 'PAYMENT_LINK',
    createdAt: new Date(),
    status: 'pending',
    amount: payload.amount ? {
      value: payload.amount,
      currency: payload.currency || 'USD',
    } : undefined,
    from: payload.recipientName ? {
      name: payload.recipientName,
    } : undefined,
  };
}

/**
 * Create a RECEIVE_MONEY intent (user wants to request money)
 */
export function createReceiveIntent(options?: {
  amount?: number;
  currency?: string;
  note?: string;
}): ReceiveMoneyIntent {
  return {
    id: generateIntentId(),
    type: 'RECEIVE_MONEY',
    trigger: 'MANUAL',
    createdAt: new Date(),
    status: 'pending',
    amount: options?.amount ? {
      value: options.amount,
      currency: options.currency || 'USD',
    } : undefined,
    note: options?.note,
  };
}

/**
 * Create a manual PAY_MERCHANT intent
 */
export function createPayIntent(merchant: {
  id: string;
  name: string;
  logo?: string;
}, amount: number, currency: string = 'USD'): PayMerchantIntent {
  return {
    id: generateIntentId(),
    type: 'PAY_MERCHANT',
    trigger: 'MANUAL',
    createdAt: new Date(),
    status: 'pending',
    merchant,
    amount: {
      value: amount,
      currency,
    },
  };
}

/**
 * Create a manual SEND_MONEY intent
 */
export function createSendIntent(recipient: {
  id?: string;
  name: string;
  phone?: string;
  email?: string;
}, amount: number, currency: string = 'USD', note?: string): SendMoneyIntent {
  return {
    id: generateIntentId(),
    type: 'SEND_MONEY',
    trigger: 'MANUAL',
    createdAt: new Date(),
    status: 'pending',
    recipient,
    amount: {
      value: amount,
      currency,
    },
    note,
  };
}
