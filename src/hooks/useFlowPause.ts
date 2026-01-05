/**
 * FLOW Pause Hook (Kill Switch)
 * 
 * Manages the user's ability to pause all FLOW payment functionality.
 * Persists to database for cross-device sync.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useFlowPause() {
  const { user } = useAuth();
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pause state from database
  const fetchPauseState = useCallback(async () => {
    if (!user) {
      setIsPaused(false);
      setPausedAt(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('flow_paused, paused_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsPaused(data.flow_paused);
        setPausedAt(data.paused_at ? new Date(data.paused_at) : null);
      } else {
        // No settings yet, create default
        await supabase.from('user_settings').insert({
          user_id: user.id,
          flow_paused: false,
        });
        setIsPaused(false);
        setPausedAt(null);
      }
    } catch (err) {
      console.error('Failed to fetch pause state:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem(`flow_paused_${user.id}`);
      setIsPaused(stored === 'true');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Toggle pause state
  const togglePause = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    const newPausedState = !isPaused;
    const newPausedAt = newPausedState ? new Date() : null;

    // Optimistic update
    setIsPaused(newPausedState);
    setPausedAt(newPausedAt);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          flow_paused: newPausedState,
          paused_at: newPausedAt?.toISOString() || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Also store in localStorage as backup
      localStorage.setItem(`flow_paused_${user.id}`, String(newPausedState));

      return true;
    } catch (err) {
      console.error('Failed to toggle pause:', err);
      // Revert on error
      setIsPaused(!newPausedState);
      setPausedAt(newPausedState ? null : pausedAt);
      return false;
    }
  }, [user, isPaused, pausedAt]);

  // Initial fetch
  useEffect(() => {
    fetchPauseState();
  }, [fetchPauseState]);

  return {
    isPaused,
    pausedAt,
    isLoading,
    togglePause,
    refreshPauseState: fetchPauseState,
  };
}
