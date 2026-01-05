/**
 * Transaction Logs Hook
 * 
 * Fetches and persists transaction audit trail from database.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FlowIntent } from '@/lib/intents/types';

export interface TransactionLog {
  id: string;
  intent_id: string;
  intent_type: 'PAY_MERCHANT' | 'SEND_MONEY' | 'RECEIVE_MONEY';
  trigger: string;
  amount: number;
  currency: string;
  recipient_name: string | null;
  recipient_id: string | null;
  merchant_name: string | null;
  merchant_id: string | null;
  rail_used: string | null;
  status: string;
  note: string | null;
  reference: string | null;
  created_at: string;
}

export function useTransactionLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs from database
  const fetchLogs = useCallback(async () => {
    if (!user) {
      setLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setLogs((data as TransactionLog[]) || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transaction logs:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Log a completed intent
  const logTransaction = useCallback(async (
    intent: FlowIntent,
    railUsed?: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const logEntry = {
        user_id: user.id,
        intent_id: intent.id,
        intent_type: intent.type,
        trigger: intent.trigger,
        amount: intent.type === 'RECEIVE_MONEY' 
          ? (intent.amount?.value || 0)
          : intent.amount.value,
        currency: intent.type === 'RECEIVE_MONEY'
          ? (intent.amount?.currency || 'USD')
          : intent.amount.currency,
        recipient_name: intent.type === 'SEND_MONEY' ? intent.recipient.name : null,
        recipient_id: intent.type === 'SEND_MONEY' ? (intent.recipient.id || null) : null,
        merchant_name: intent.type === 'PAY_MERCHANT' ? intent.merchant.name : null,
        merchant_id: intent.type === 'PAY_MERCHANT' ? intent.merchant.id : null,
        rail_used: railUsed || null,
        status: 'completed',
        note: intent.type === 'SEND_MONEY' || intent.type === 'RECEIVE_MONEY' 
          ? (intent.note || null) : null,
        reference: intent.type === 'PAY_MERCHANT' ? (intent.reference || null) : null,
      };

      const { error: insertError } = await supabase
        .from('transaction_logs')
        .insert(logEntry);

      if (insertError) throw insertError;

      // Refresh logs after insert
      await fetchLogs();
      return true;
    } catch (err) {
      console.error('Failed to log transaction:', err);
      return false;
    }
  }, [user, fetchLogs]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    logTransaction,
    refreshLogs: fetchLogs,
  };
}
