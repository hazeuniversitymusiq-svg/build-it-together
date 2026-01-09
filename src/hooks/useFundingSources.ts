/**
 * Real-world Funding Sources Hook
 * 
 * Fetches and manages funding sources from Supabase.
 * This is the REAL data layer - no localStorage simulation.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export type FundingSourceRow = Tables<'funding_sources'>;

export interface RealFundingSource {
  id: string;
  type: 'wallet' | 'bank' | 'debit_card' | 'credit_card';
  name: string;
  balance: number;
  priority: number;
  isLinked: boolean;
  isAvailable: boolean;
  maxAutoTopUp: number;
  requireConfirmAbove: number;
  currency: string;
}

function mapRowToSource(row: FundingSourceRow): RealFundingSource {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    balance: row.balance,
    priority: row.priority,
    isLinked: row.linked_status === 'linked',
    isAvailable: row.available,
    maxAutoTopUp: row.max_auto_topup_amount,
    requireConfirmAbove: row.require_extra_confirm_amount,
    currency: row.currency,
  };
}

export function useFundingSources() {
  const { user } = useAuth();
  const [sources, setSources] = useState<RealFundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch sources from Supabase
  const fetchSources = useCallback(async () => {
    if (!user) {
      setSources([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('funding_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });

      if (fetchError) throw fetchError;

      setSources((data || []).map(mapRowToSource));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // Update balance for a source (manual entry)
  const updateBalance = useCallback(async (sourceId: string, newBalance: number) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ balance: newBalance })
        .eq('id', sourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, balance: newBalance } : s
      ));

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }, [user]);

  // Update linked status
  const updateLinkedStatus = useCallback(async (sourceId: string, linked: boolean) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ 
          linked_status: linked ? 'linked' : 'unlinked',
          available: linked 
        })
        .eq('id', sourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, isLinked: linked, isAvailable: linked } : s
      ));

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }, [user]);

  // Update priority order
  const updatePriorities = useCallback(async (orderedIds: string[]) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Update each source with new priority
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('funding_sources')
          .update({ priority: index + 1 })
          .eq('id', id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);

      // Update local state
      setSources(prev => {
        const sorted = [...prev].sort((a, b) => {
          const aIndex = orderedIds.indexOf(a.id);
          const bIndex = orderedIds.indexOf(b.id);
          return aIndex - bIndex;
        });
        return sorted.map((s, i) => ({ ...s, priority: i + 1 }));
      });

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }, [user]);

  // Get wallet balance (convenience)
  const walletBalance = sources.find(s => s.type === 'wallet')?.balance ?? 0;

  // Get total available balance
  const totalBalance = sources
    .filter(s => s.isLinked && s.isAvailable)
    .reduce((sum, s) => sum + s.balance, 0);

  return {
    sources,
    loading,
    error,
    walletBalance,
    totalBalance,
    refetch: fetchSources,
    updateBalance,
    updateLinkedStatus,
    updatePriorities,
  };
}
