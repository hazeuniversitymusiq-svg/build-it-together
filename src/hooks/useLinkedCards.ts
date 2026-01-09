/**
 * Linked Cards Hook
 * 
 * Manages debit/credit cards stored in Supabase funding_sources.
 * Cards are stored as funding sources with type 'debit_card' or 'credit_card'.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LinkedCard {
  id: string;
  cardNumber: string; // Last 4 digits only
  maskedNumber: string; // e.g., •••• •••• •••• 1234
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: 'visa' | 'mastercard' | 'amex';
  fundingSourceType: 'debit_card' | 'credit_card';
  isDefault: boolean;
  isAvailable: boolean;
  priority: number;
  addedAt: string;
  nickname?: string;
}

// Parse card metadata from funding_sources name field
// Format: "CardType|Last4|CardholderName|MM|YY|Nickname"
function parseCardMetadata(name: string): {
  cardType: 'visa' | 'mastercard' | 'amex';
  last4: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  nickname?: string;
} | null {
  const parts = name.split('|');
  if (parts.length < 5) return null;
  
  return {
    cardType: parts[0] as 'visa' | 'mastercard' | 'amex',
    last4: parts[1],
    cardholderName: parts[2],
    expiryMonth: parts[3],
    expiryYear: parts[4],
    nickname: parts[5] || undefined,
  };
}

// Encode card metadata to name field
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

// Mask card number
function maskCardNumber(last4: string): string {
  return `•••• •••• •••• ${last4}`;
}

export function useLinkedCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<LinkedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultCardId, setDefaultCardIdState] = useState<string | null>(null);

  // Fetch cards from funding_sources
  const fetchCards = useCallback(async () => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('funding_sources')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['debit_card', 'credit_card'])
        .order('priority', { ascending: true });

      if (fetchError) throw fetchError;

      const parsedCards: LinkedCard[] = [];
      let firstCardId: string | null = null;

      for (const row of data || []) {
        const metadata = parseCardMetadata(row.name);
        if (!metadata) continue;

        const card: LinkedCard = {
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

        parsedCards.push(card);
        
        if (row.priority === 1 && !firstCardId) {
          firstCardId = row.id;
        }
      }

      setCards(parsedCards);
      setDefaultCardIdState(firstCardId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Add a new card
  const addCard = useCallback(async (cardData: {
    cardType: 'visa' | 'mastercard' | 'amex';
    last4: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    isDebit: boolean;
    nickname?: string;
  }) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // Get current max priority for cards
      const { data: existing } = await supabase
        .from('funding_sources')
        .select('priority')
        .eq('user_id', user.id)
        .in('type', ['debit_card', 'credit_card'])
        .order('priority', { ascending: false })
        .limit(1);

      const nextPriority = (existing?.[0]?.priority || 0) + 1;
      const isFirstCard = nextPriority === 1;

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
          priority: isFirstCard ? 1 : nextPriority + 10, // Cards after wallets/banks
          linked_status: 'linked',
          available: true,
          balance: 0, // Cards don't have balance in FLOW
          currency: 'MYR',
          max_auto_topup_amount: 500,
          require_extra_confirm_amount: 200,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchCards();
      return { success: true, error: null, cardId: data.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to add card' };
    }
  }, [user, fetchCards]);

  // Remove a card
  const removeCard = useCallback(async (cardId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { error: deleteError } = await supabase
        .from('funding_sources')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      await fetchCards();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove card' };
    }
  }, [user, fetchCards]);

  // Set default card (priority 1)
  const setDefaultCard = useCallback(async (cardId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      // First, reset all card priorities to be > 1
      const { error: resetError } = await supabase
        .from('funding_sources')
        .update({ priority: 99 })
        .eq('user_id', user.id)
        .in('type', ['debit_card', 'credit_card']);

      if (resetError) throw resetError;

      // Then set the selected card to priority 1
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ priority: 1 })
        .eq('id', cardId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      await fetchCards();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to set default' };
    }
  }, [user, fetchCards]);

  // Toggle card availability
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

      await fetchCards();
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update card' };
    }
  }, [user, fetchCards]);

  return {
    cards,
    loading,
    error,
    defaultCardId,
    refetch: fetchCards,
    addCard,
    removeCard,
    setDefaultCard,
    toggleCardAvailability,
  };
}
