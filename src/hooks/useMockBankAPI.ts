/**
 * Mock Bank API Client Hook
 * 
 * Provides a clean interface to interact with the mock bank API
 * for demoing the ideal FLOW payment experience.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BankBalance {
  accountId: string;
  accountType: string;
  accountName: string;
  currency: string;
  availableBalance: number;
  currentBalance: number;
  pendingTransactions: number;
  asOf: string;
  dailyLimit: {
    total: number;
    used: number;
    remaining: number;
  };
}

interface PaymentResult {
  paymentId: string;
  status: 'completed' | 'pending_authorization' | 'failed';
  amount: { value: number; currency: string };
  recipient: { name: string; maskedAccount: string };
  completedAt?: string;
  bankReference?: string;
  newBalance?: number;
  authorization?: {
    type: string;
    challengeId: string;
    expiresAt: string;
    methodsAvailable: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface AuthorizationResult {
  paymentId: string;
  status: 'completed' | 'failed';
  authorizedAt?: string;
  authorizationMethod?: string;
  bankReference?: string;
  newBalance?: number;
  recipient?: string;
  amount?: number;
  error?: {
    code: string;
    message: string;
  };
}

interface Transaction {
  transactionId: string;
  type: 'debit' | 'credit';
  amount: { value: number; currency: string };
  description: string;
  category: string;
  status: string;
  postedAt: string;
  reference: string;
}

interface TransactionHistory {
  accountId: string;
  transactions: Transaction[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
  summary: {
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
  };
}

// Get the edge function URL
function getApiUrl(endpoint: string): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yqlojpvoeyzitbrrihiy';
  return `https://${projectId}.supabase.co/functions/v1/mock-bank-api/${endpoint}`;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  };
}

export function useMockBankAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // GET /balance - Fetch current balance
  const getBalance = useCallback(async (): Promise<BankBalance | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('balance'), {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch balance');
      }
      
      return {
        accountId: data.account_id,
        accountType: data.account_type,
        accountName: data.account_name,
        currency: data.currency,
        availableBalance: data.available_balance,
        currentBalance: data.current_balance,
        pendingTransactions: data.pending_transactions,
        asOf: data.as_of,
        dailyLimit: {
          total: data.daily_limit.total,
          used: data.daily_limit.used,
          remaining: data.daily_limit.remaining,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /payments/initiate - Start a payment
  const initiatePayment = useCallback(async (
    amount: number,
    recipientName: string,
    reference: string,
    duitnowId?: string
  ): Promise<PaymentResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('payments/initiate'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: { value: amount, currency: 'MYR' },
          recipient: { name: recipientName, duitnow_id: duitnowId },
          reference,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && !data.error) {
        throw new Error('Failed to initiate payment');
      }
      
      if (data.error) {
        return {
          paymentId: '',
          status: 'failed',
          amount: { value: amount, currency: 'MYR' },
          recipient: { name: recipientName, maskedAccount: '' },
          error: data.error,
        };
      }
      
      return {
        paymentId: data.payment_id,
        status: data.status,
        amount: data.amount,
        recipient: {
          name: data.recipient.name,
          maskedAccount: data.recipient.masked_account,
        },
        completedAt: data.completed_at,
        bankReference: data.bank_reference,
        newBalance: data.new_balance,
        authorization: data.authorization ? {
          type: data.authorization.type,
          challengeId: data.authorization.challenge_id,
          expiresAt: data.authorization.expires_at,
          methodsAvailable: data.authorization.methods_available,
        } : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initiate payment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /payments/:id/authorize - Complete 2FA
  const authorizePayment = useCallback(async (
    paymentId: string,
    challengeId: string,
    authType: 'biometric' | 'pin' = 'biometric'
  ): Promise<AuthorizationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl(`payments/${paymentId}/authorize`), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          challenge_id: challengeId,
          authorization_type: authType,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && !data.error) {
        throw new Error('Failed to authorize payment');
      }
      
      if (data.error) {
        return {
          paymentId,
          status: 'failed',
          error: data.error,
        };
      }
      
      return {
        paymentId: data.payment_id,
        status: data.status,
        authorizedAt: data.authorized_at,
        authorizationMethod: data.authorization_method,
        bankReference: data.bank_reference,
        newBalance: data.new_balance,
        recipient: data.recipient,
        amount: data.amount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to authorize payment';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /transactions - Fetch transaction history
  const getTransactions = useCallback(async (
    options?: { limit?: number; type?: 'debit' | 'credit' | 'all' }
  ): Promise<TransactionHistory | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.type) params.set('type', options.type);
      
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl(`transactions?${params}`), {
        method: 'GET',
        headers,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch transactions');
      }
      
      return {
        accountId: data.account_id,
        transactions: data.transactions.map((t: Record<string, unknown>) => ({
          transactionId: t.transaction_id,
          type: t.type,
          amount: t.amount as { value: number; currency: string },
          description: t.description,
          category: t.category,
          status: t.status,
          postedAt: t.posted_at,
          reference: t.reference,
        })),
        pagination: {
          hasMore: data.pagination.has_more,
          nextCursor: data.pagination.next_cursor,
        },
        summary: {
          totalDebit: data.summary.total_debit,
          totalCredit: data.summary.total_credit,
          transactionCount: data.summary.transaction_count,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch transactions';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync balance to mock bank (for demo purposes)
  const syncBalance = useCallback(async (balance: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(getApiUrl('balance/sync'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ balance }),
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    loading,
    error,
    getBalance,
    initiatePayment,
    authorizePayment,
    getTransactions,
    syncBalance,
  };
}

export type { BankBalance, PaymentResult, AuthorizationResult, Transaction, TransactionHistory };
