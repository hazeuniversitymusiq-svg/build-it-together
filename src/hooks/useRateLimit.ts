/**
 * Rate Limiting Hook
 * 
 * Client-side rate limit checking and recording.
 * Prevents abuse and protects the system.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ActionType = 
  | 'intent.create'
  | 'payment.execute'
  | 'auth.attempt'
  | 'api.call';

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: string;
}

export function useRateLimit() {
  // Check if an action is allowed
  const checkLimit = useCallback(async (actionType: ActionType): Promise<RateLimitStatus> => {
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit', {
        body: {
          action: 'check',
          actionType,
        },
      });

      if (error) throw error;
      return data as RateLimitStatus;
    } catch (err) {
      console.error('Rate limit check error:', err);
      // Default to allowing on error (fail open for UX)
      return {
        allowed: true,
        remaining: 999,
        limit: 999,
        resetAt: new Date().toISOString(),
      };
    }
  }, []);

  // Record an action
  const recordAction = useCallback(async (actionType: ActionType): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('rate-limit', {
        body: {
          action: 'record',
          actionType,
        },
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Rate limit record error:', err);
      return false;
    }
  }, []);

  // Combined check and record
  const checkAndRecord = useCallback(async (actionType: ActionType): Promise<RateLimitStatus> => {
    const status = await checkLimit(actionType);
    
    if (status.allowed) {
      await recordAction(actionType);
    }
    
    return status;
  }, [checkLimit, recordAction]);

  return {
    checkLimit,
    recordAction,
    checkAndRecord,
  };
}
