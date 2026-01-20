/**
 * FLOW Real-time Balance Streaming Hook
 * 
 * Subscribes to cached_balances changes via Supabase Realtime
 * to provide live balance updates across the app.
 * 
 * Features:
 * - Real-time balance streaming from cached_balances
 * - Visual update indicators (flash animations)
 * - Confidence level tracking
 * - Connector health correlation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface RealtimeBalance {
  connectorId: string;
  connectorName: string;
  amount: number;
  currency: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdatedAt: Date;
  expiresAt: Date | null;
  isStale: boolean;
}

export interface BalanceUpdate {
  connectorId: string;
  oldAmount: number;
  newAmount: number;
  timestamp: Date;
  direction: 'increase' | 'decrease' | 'unchanged';
}

interface UseRealtimeBalancesReturn {
  balances: RealtimeBalance[];
  totalBalance: number;
  isConnected: boolean;
  lastUpdate: BalanceUpdate | null;
  recentUpdates: BalanceUpdate[];
  hasLowConfidence: boolean;
  reconnect: () => void;
}

export function useRealtimeBalances(): UseRealtimeBalancesReturn {
  const { user } = useAuth();
  const [balances, setBalances] = useState<RealtimeBalance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<BalanceUpdate | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<BalanceUpdate[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initial fetch of cached_balances with connector names
  const fetchBalances = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cached_balances')
      .select(`
        id,
        connector_id,
        amount,
        currency,
        confidence_level,
        last_updated_at,
        expires_at,
        connectors!inner(name)
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Realtime] Failed to fetch balances:', error);
      return;
    }

    const now = new Date();
    const mapped: RealtimeBalance[] = (data || []).map((b: any) => ({
      connectorId: b.connector_id,
      connectorName: b.connectors?.name || 'Unknown',
      amount: Number(b.amount),
      currency: b.currency,
      confidenceLevel: b.confidence_level,
      lastUpdatedAt: new Date(b.last_updated_at),
      expiresAt: b.expires_at ? new Date(b.expires_at) : null,
      isStale: b.expires_at ? new Date(b.expires_at) < now : true,
    }));

    setBalances(mapped);
  }, [user]);

  // Subscribe to realtime changes
  const subscribe = useCallback(() => {
    if (!user) return;

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`cached_balances_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cached_balances',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[Realtime] Balance update:', payload.eventType);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newData = payload.new as any;
            
            // Fetch connector name for this balance
            const { data: connector } = await supabase
              .from('connectors')
              .select('name')
              .eq('id', newData.connector_id)
              .single();

            const now = new Date();
            const newBalance: RealtimeBalance = {
              connectorId: newData.connector_id,
              connectorName: connector?.name || 'Unknown',
              amount: Number(newData.amount),
              currency: newData.currency,
              confidenceLevel: newData.confidence_level,
              lastUpdatedAt: new Date(newData.last_updated_at),
              expiresAt: newData.expires_at ? new Date(newData.expires_at) : null,
              isStale: newData.expires_at ? new Date(newData.expires_at) < now : true,
            };

            setBalances(prev => {
              const existing = prev.find(b => b.connectorId === newBalance.connectorId);
              const oldAmount = existing?.amount || 0;
              
              // Track update for visual feedback
              if (existing && oldAmount !== newBalance.amount) {
                const update: BalanceUpdate = {
                  connectorId: newBalance.connectorId,
                  oldAmount,
                  newAmount: newBalance.amount,
                  timestamp: new Date(),
                  direction: newBalance.amount > oldAmount ? 'increase' : 'decrease',
                };
                
                setLastUpdate(update);
                setRecentUpdates(prevUpdates => [update, ...prevUpdates].slice(0, 10));
                
                console.log(
                  `[Realtime] ${newBalance.connectorName}: RM${oldAmount.toFixed(2)} → RM${newBalance.amount.toFixed(2)} (${update.direction})`
                );
              }

              if (existing) {
                return prev.map(b => 
                  b.connectorId === newBalance.connectorId ? newBalance : b
                );
              } else {
                return [...prev, newBalance];
              }
            });
          } else if (payload.eventType === 'DELETE') {
            const oldData = payload.old as any;
            setBalances(prev => prev.filter(b => b.connectorId !== oldData.connector_id));
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [user]);

  // Initial setup
  useEffect(() => {
    fetchBalances();
    subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchBalances, subscribe]);

  // Reconnect function for manual recovery
  const reconnect = useCallback(() => {
    console.log('[Realtime] Manually reconnecting...');
    subscribe();
  }, [subscribe]);

  // Computed values
  const totalBalance = balances.reduce((sum, b) => sum + b.amount, 0);
  const hasLowConfidence = balances.some(b => b.confidenceLevel === 'low');

  return {
    balances,
    totalBalance,
    isConnected,
    lastUpdate,
    recentUpdates,
    hasLowConfidence,
    reconnect,
  };
}
