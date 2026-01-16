/**
 * FLOW Funding Sources Hook (Unified)
 * 
 * Single hook for ALL funding source management:
 * - Wallets, banks, debit/credit cards
 * - Balance updates, priority ordering, linking
 * - Card-specific operations (add, remove, set default)
 * 
 * This replaces both useFundingSources and useLinkedCards.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';
import type { LinkedCard, CardBrand, FundingSource as BaseFundingSource } from '@/types';

export type FundingSourceRow = Tables<'funding_sources'>;
export type FundingSourceType = 'wallet' | 'bank' | 'debit_card' | 'credit_card';

export interface RealFundingSource extends BaseFundingSource {
  currency: string;
}

// ============================================
// Card Metadata Helpers
// ============================================

// Format: "CardType|Last4|CardholderName|MM|YY|Nickname"
function parseCardMetadata(name: string): {
  cardType: CardBrand;
  last4: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  nickname?: string;
} | null {
  const parts = name.split('|');
  if (parts.length < 5) return null;
  
  return {
    cardType: parts[0] as CardBrand,
    last4: parts[1],
    cardholderName: parts[2],
    expiryMonth: parts[3],
    expiryYear: parts[4],
    nickname: parts[5] || undefined,
  };
}

function encodeCardMetadata(
  cardType: string,
  last4: string,
  cardholderName: string,
  expiryMonth: string,
  expiryYear: string,
  nickname?: string
): string {
  return [cardType, last4, cardholderName, expiryMonth, expiryYear, nickname || ''].join('|');
}

function maskCardNumber(last4: string): string {
  return `•••• •••• •••• ${last4}`;
}

// ============================================
// Row Mappers
// ============================================

function mapRowToSource(row: FundingSourceRow): RealFundingSource {
  return {
    id: row.id,
    type: row.type === 'debit_card' || row.type === 'credit_card' ? 'card' : row.type,
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

function mapRowToCard(row: FundingSourceRow): LinkedCard | null {
  const metadata = parseCardMetadata(row.name);
  if (!metadata) return null;

  return {
    id: row.id,
    cardNumber: metadata.last4,
    maskedNumber: maskCardNumber(metadata.last4),
    cardholderName: metadata.cardholderName,
    expiryMonth: metadata.expiryMonth,
    expiryYear: metadata.expiryYear,
    cardType: metadata.cardType,
    fundingSourceType: row.type as 'debit_card' | 'credit_card',
    isDefault: row.priority === 1,
    isAvailable: row.available,
    priority: row.priority,
    addedAt: row.created_at,
    nickname: metadata.nickname,
  };
}

// ============================================
// Main Hook
// ============================================

export function useFundingSources() {
  const { user } = useAuth();
  const [rawSources, setRawSources] = useState<FundingSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sources from Supabase
  const fetchSources = useCallback(async () => {
    if (!user) {
      setRawSources([]);
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

      setRawSources(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sources');
      setRawSources([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchSources();

    // Subscribe to realtime changes for this user's funding sources
    if (!user) return;

    const channel = supabase
      .channel(`funding_sources_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'funding_sources',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[FLOW] Funding source realtime update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            setRawSources(prev => [...prev, payload.new as FundingSourceRow]);
          } else if (payload.eventType === 'UPDATE') {
            setRawSources(prev => 
              prev.map(s => s.id === (payload.new as FundingSourceRow).id 
                ? payload.new as FundingSourceRow 
                : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRawSources(prev => 
              prev.filter(s => s.id !== (payload.old as FundingSourceRow).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSources, user]);

  // ============================================
  // Derived Data (memoized)
  // ============================================

  const sources = useMemo(() => 
    rawSources.map(mapRowToSource), 
    [rawSources]
  );

  const cards = useMemo(() => 
    rawSources
      .filter(r => r.type === 'debit_card' || r.type === 'credit_card')
      .map(mapRowToCard)
      .filter((c): c is LinkedCard => c !== null),
    [rawSources]
  );

  const walletBalance = useMemo(() => 
    rawSources.find(s => s.type === 'wallet')?.balance ?? 0,
    [rawSources]
  );

  // Total balance only includes actual funds (wallets + banks), not credit/BNPL
  const totalBalance = useMemo(() => 
    rawSources
      .filter(s => 
        s.linked_status === 'linked' && 
        s.available && 
        (s.type === 'wallet' || s.type === 'bank')
      )
      .reduce((sum, s) => sum + s.balance, 0),
    [rawSources]
  );

  const linkedCards = useMemo(() => 
    cards.filter(c => c.isAvailable),
    [cards]
  );

  const hasLinkedCards = linkedCards.length > 0;

  const defaultCardId = useMemo(() => 
    cards.find(c => c.priority === 1)?.id ?? null,
    [cards]
  );

  const wallets = useMemo(() => 
    sources.filter(s => s.type === 'wallet' && s.isLinked),
    [sources]
  );

  const banks = useMemo(() => 
    sources.filter(s => s.type === 'bank' && s.isLinked),
    [sources]
  );

  // ============================================
  // Balance & Link Updates
  // ============================================

  const updateBalance = useCallback(async (sourceId: string, newBalance: number) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ balance: newBalance })
        .eq('id', sourceId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setRawSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, balance: newBalance } : s
      ));

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }, [user]);

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

      setRawSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, linked_status: linked ? 'linked' : 'unlinked', available: linked } : s
      ));

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
    }
  }, [user]);

  const updatePriorities = useCallback(async (orderedIds: string[]) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('funding_sources')
          .update({ priority: index + 1 })
          .eq('id', id)
          .eq('user_id', user.id)
      );

      await Promise.all(updates);

      setRawSources(prev => {
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

  // ============================================
  // Card-Specific Operations
  // ============================================

  const addCard = useCallback(async (cardData: {
    cardType: CardBrand;
    last4: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    isDebit: boolean;
    nickname?: string;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const existing = rawSources.filter(
        s => s.type === 'debit_card' || s.type === 'credit_card'
      );
      const nextPriority = (existing[existing.length - 1]?.priority || 0) + 1;
      const isFirstCard = existing.length === 0;

      const name = encodeCardMetadata(
        cardData.cardType,
        cardData.last4,
        cardData.cardholderName,
        cardData.expiryMonth,
        cardData.expiryYear,
        cardData.nickname
      );

      const { data, error: insertError } = await supabase
        .from('funding_sources')
        .insert({
          user_id: user.id,
          type: cardData.isDebit ? 'debit_card' : 'credit_card',
          name,
          priority: isFirstCard ? 1 : nextPriority + 10,
          linked_status: 'linked',
          available: true,
          balance: 0,
          currency: 'MYR',
          max_auto_topup_amount: 500,
          require_extra_confirm_amount: 200,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchSources();
      return { success: true, error: null, cardId: data.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add card' };
    }
  }, [user, rawSources, fetchSources]);

  const removeCard = useCallback(async (cardId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('funding_sources')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchSources();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove card' };
    }
  }, [user, fetchSources]);

  const setDefaultCard = useCallback(async (cardId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Reset all card priorities
      const { error: resetError } = await supabase
        .from('funding_sources')
        .update({ priority: 99 })
        .eq('user_id', user.id)
        .in('type', ['debit_card', 'credit_card']);

      if (resetError) throw resetError;

      // Set selected card to priority 1
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ priority: 1 })
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchSources();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set default' };
    }
  }, [user, fetchSources]);

  const toggleCardAvailability = useCallback(async (cardId: string, available: boolean) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ 
          available,
          linked_status: available ? 'linked' : 'unlinked'
        })
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchSources();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update card' };
    }
  }, [user, fetchSources]);

  // ============================================
  // Return
  // ============================================

  return {
    // All sources
    sources,
    loading,
    error,
    refetch: fetchSources,
    
    // Balance info
    walletBalance,
    totalBalance,
    
    // Grouped sources
    wallets,
    banks,
    
    // Balance/link operations
    updateBalance,
    updateLinkedStatus,
    updatePriorities,
    
    // Card-specific
    cards,
    linkedCards,
    hasLinkedCards,
    defaultCardId,
    addCard,
    removeCard,
    setDefaultCard,
    toggleCardAvailability,
  };
}

// Re-export types for convenience
export type { LinkedCard, CardBrand } from '@/types';
