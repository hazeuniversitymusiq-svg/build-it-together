/**
 * Fallback Preference Hook
 * 
 * Manages user's preferred fallback behavior when wallet balance is insufficient.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type FallbackPreference = 'use_card' | 'top_up_wallet' | 'ask_each_time';

export const FALLBACK_OPTIONS: { value: FallbackPreference; label: string; description: string }[] = [
  {
    value: 'use_card',
    label: 'Use default card',
    description: 'Automatically pay with your default card when wallet is low',
  },
  {
    value: 'top_up_wallet',
    label: 'Top up wallet',
    description: 'Always top up your wallet from linked bank account',
  },
  {
    value: 'ask_each_time',
    label: 'Ask each time',
    description: 'Let me choose the fallback method for each payment',
  },
];

export function useFallbackPreference() {
  const { user } = useAuth();
  const [preference, setPreference] = useState<FallbackPreference>('use_card');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preference from user_settings
  const fetchPreference = useCallback(async () => {
    if (!user) {
      setPreference('use_card');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('fallback_preference')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data?.fallback_preference) {
        setPreference(data.fallback_preference as FallbackPreference);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch preference');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPreference();
  }, [fetchPreference]);

  // Update preference
  const updatePreference = useCallback(async (newPreference: FallbackPreference) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      setSaving(true);
      
      // Upsert to handle case where user_settings row doesn't exist
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          fallback_preference: newPreference,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) throw upsertError;

      setPreference(newPreference);
      setError(null);
      return { success: true, error: null };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update preference';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setSaving(false);
    }
  }, [user]);

  return {
    preference,
    loading,
    saving,
    error,
    updatePreference,
    refetch: fetchPreference,
  };
}
