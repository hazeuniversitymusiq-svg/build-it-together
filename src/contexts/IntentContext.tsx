import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  FlowIntent, 
  parseQRCode, 
  parsePaymentLink,
  createIntentFromContact,
  createReceiveIntent,
  createPayIntent,
  createSendIntent,
  PaymentLinkPayload,
} from '@/lib/intents';

interface IntentContextValue {
  // Current active intent
  currentIntent: FlowIntent | null;
  
  // Intent history (for activity feed)
  intentHistory: FlowIntent[];
  
  // Trigger handlers - each maps to exactly one intent type
  handleQRScan: (rawData: string) => FlowIntent | null;
  handleContactSelect: (contact: { id?: string; name: string; phone?: string; email?: string }) => FlowIntent;
  handlePaymentLink: (payload: PaymentLinkPayload) => FlowIntent;
  
  // Manual intent creation
  requestMoney: (amount?: number, currency?: string, note?: string) => FlowIntent;
  payMerchant: (merchant: { id: string; name: string }, amount: number, currency?: string) => FlowIntent;
  sendMoney: (recipient: { name: string; phone?: string }, amount: number, currency?: string, note?: string) => FlowIntent;
  
  // Intent lifecycle
  authorizeIntent: (intentId: string) => void;
  completeIntent: (intentId: string) => void;
  cancelIntent: (intentId: string) => void;
  failIntent: (intentId: string, reason?: string) => void;
  clearCurrentIntent: () => void;
}

const IntentContext = createContext<IntentContextValue | null>(null);

export function IntentProvider({ children }: { children: React.ReactNode }) {
  const [currentIntent, setCurrentIntent] = useState<FlowIntent | null>(null);
  const [intentHistory, setIntentHistory] = useState<FlowIntent[]>([]);

  // Helper to set intent and add to history
  const activateIntent = useCallback((intent: FlowIntent) => {
    setCurrentIntent(intent);
    return intent;
  }, []);

  // Update intent status
  const updateIntentStatus = useCallback((
    intentId: string, 
    status: FlowIntent['status']
  ) => {
    setCurrentIntent(prev => {
      if (prev?.id === intentId) {
        const updated = { ...prev, status };
        // Add completed/cancelled/failed intents to history
        if (status === 'completed' || status === 'cancelled' || status === 'failed') {
          setIntentHistory(history => [updated, ...history]);
        }
        return updated;
      }
      return prev;
    });
  }, []);

  // ============ TRIGGER HANDLERS ============
  // Each trigger maps to exactly one intent type

  /**
   * QR Scan → PAY_MERCHANT or SEND_MONEY
   */
  const handleQRScan = useCallback((rawData: string): FlowIntent | null => {
    const intent = parseQRCode(rawData);
    if (intent) {
      activateIntent(intent);
    }
    return intent;
  }, [activateIntent]);

  /**
   * Contact Select → SEND_MONEY (always)
   */
  const handleContactSelect = useCallback((contact: { 
    id?: string; 
    name: string; 
    phone?: string; 
    email?: string;
  }): FlowIntent => {
    const intent = createIntentFromContact(contact);
    return activateIntent(intent);
  }, [activateIntent]);

  /**
   * Payment Link → PAY_MERCHANT or RECEIVE_MONEY
   */
  const handlePaymentLink = useCallback((payload: PaymentLinkPayload): FlowIntent => {
    const intent = parsePaymentLink(payload);
    return activateIntent(intent);
  }, [activateIntent]);

  // ============ MANUAL INTENT CREATION ============

  const requestMoney = useCallback((
    amount?: number, 
    currency?: string, 
    note?: string
  ): FlowIntent => {
    const intent = createReceiveIntent({ amount, currency, note });
    return activateIntent(intent);
  }, [activateIntent]);

  const payMerchant = useCallback((
    merchant: { id: string; name: string },
    amount: number,
    currency: string = 'USD'
  ): FlowIntent => {
    const intent = createPayIntent(merchant, amount, currency);
    return activateIntent(intent);
  }, [activateIntent]);

  const sendMoney = useCallback((
    recipient: { name: string; phone?: string },
    amount: number,
    currency: string = 'USD',
    note?: string
  ): FlowIntent => {
    const intent = createSendIntent(recipient, amount, currency, note);
    return activateIntent(intent);
  }, [activateIntent]);

  // ============ INTENT LIFECYCLE ============

  const authorizeIntent = useCallback((intentId: string) => {
    updateIntentStatus(intentId, 'authorized');
  }, [updateIntentStatus]);

  const completeIntent = useCallback((intentId: string) => {
    updateIntentStatus(intentId, 'completed');
  }, [updateIntentStatus]);

  const cancelIntent = useCallback((intentId: string) => {
    updateIntentStatus(intentId, 'cancelled');
  }, [updateIntentStatus]);

  const failIntent = useCallback((intentId: string, _reason?: string) => {
    updateIntentStatus(intentId, 'failed');
  }, [updateIntentStatus]);

  const clearCurrentIntent = useCallback(() => {
    setCurrentIntent(null);
  }, []);

  const value: IntentContextValue = {
    currentIntent,
    intentHistory,
    handleQRScan,
    handleContactSelect,
    handlePaymentLink,
    requestMoney,
    payMerchant,
    sendMoney,
    authorizeIntent,
    completeIntent,
    cancelIntent,
    failIntent,
    clearCurrentIntent,
  };

  return (
    <IntentContext.Provider value={value}>
      {children}
    </IntentContext.Provider>
  );
}

export function useIntent() {
  const context = useContext(IntentContext);
  if (!context) {
    throw new Error('useIntent must be used within an IntentProvider');
  }
  return context;
}
