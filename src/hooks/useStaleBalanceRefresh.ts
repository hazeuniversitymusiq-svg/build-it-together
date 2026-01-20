/**
 * FLOW Stale Balance Auto-Refresh Hook
 * 
 * Monitors cached_balances.expires_at and automatically
 * triggers a refresh when balances become stale.
 * 
 * Works alongside the backend scheduler for redundancy.
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface StaleBalanceRefreshOptions {
  /** Polling interval in ms (default: 30 seconds) */
  pollInterval?: number;
  /** Whether to show toast notifications */
  showNotifications?: boolean;
  /** Callback when balances are refreshed */
  onRefresh?: (count: number) => void;
}

export function useStaleBalanceRefresh(options: StaleBalanceRefreshOptions = {}) {
  const { user } = useAuth();
  const { 
    pollInterval = 30000, 
    showNotifications = false,
    onRefresh,
  } = options;
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Refresh stale balances
  const refreshStaleBalances = useCallback(async () => {
    if (!user || isRefreshingRef.current) return;
    
    isRefreshingRef.current = true;

    try {
      // Find stale balances for this user
      const now = new Date().toISOString();
      
      const { data: staleBalances, error } = await supabase
        .from('cached_balances')
        .select(`
          id,
          connector_id,
          connectors!inner(id, name, status)
        `)
        .eq('user_id', user.id)
        .lt('expires_at', now);

      if (error || !staleBalances?.length) {
        isRefreshingRef.current = false;
        return;
      }

      console.log(`[StaleRefresh] Found ${staleBalances.length} stale balances to refresh`);

      let refreshedCount = 0;

      for (const stale of staleBalances) {
        const connector = stale.connectors as any;
        
        if (connector.status !== 'available') continue;

        try {
          // Call sync endpoint for this connector
          const { data, error: syncError } = await supabase.functions.invoke('connector-sync/sync-balance', {
            method: 'POST',
            body: { connector_id: connector.id },
          });

          if (!syncError && data?.success) {
            refreshedCount++;
            console.log(`[StaleRefresh] Refreshed ${connector.name}: RM${data.balance}`);
          }
        } catch (err) {
          console.error(`[StaleRefresh] Failed to refresh ${connector.name}:`, err);
        }
      }

      if (refreshedCount > 0) {
        onRefresh?.(refreshedCount);
        
        if (showNotifications) {
          toast.success(`Refreshed ${refreshedCount} balance${refreshedCount > 1 ? 's' : ''}`);
        }
      }

    } catch (error) {
      console.error('[StaleRefresh] Error:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user, onRefresh, showNotifications]);

  // Start polling when component mounts
  useEffect(() => {
    if (!user) return;

    // Initial check
    refreshStaleBalances();

    // Set up polling
    intervalRef.current = setInterval(refreshStaleBalances, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user, pollInterval, refreshStaleBalances]);

  // Manual refresh trigger
  const forceRefresh = useCallback(async () => {
    await refreshStaleBalances();
  }, [refreshStaleBalances]);

  return {
    forceRefresh,
    isRefreshing: isRefreshingRef.current,
  };
}
