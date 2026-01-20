/**
 * Real-time Activity Feed Hook
 * 
 * Subscribes to transaction_logs for live activity updates.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityItem {
  id: string;
  type: 'PAY_MERCHANT' | 'SEND_MONEY' | 'RECEIVE_MONEY';
  name: string;
  amount: number;
  currency: string;
  status: string;
  railUsed: string | null;
  timestamp: Date;
  isNew?: boolean;
}

export function useRealtimeActivityFeed(limit = 5) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Transform DB row to ActivityItem
  const transformLog = useCallback((log: any): ActivityItem => ({
    id: log.id,
    type: log.intent_type,
    name: log.merchant_name || log.recipient_name || 'Unknown',
    amount: log.amount,
    currency: log.currency,
    status: log.status,
    railUsed: log.rail_used,
    timestamp: new Date(log.created_at),
    isNew: false,
  }), []);

  // Initial fetch
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('transaction_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setActivities((data || []).map(transformLog));
      } catch (err) {
        console.error('[ActivityFeed] Failed to fetch:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user, limit, transformLog]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transaction_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ActivityFeed] New transaction:', payload);
          const newItem = { ...transformLog(payload.new), isNew: true };
          
          setActivities(prev => {
            // Add to front, keep within limit
            const updated = [newItem, ...prev].slice(0, limit);
            return updated;
          });

          // Clear "new" flag after animation
          setTimeout(() => {
            setActivities(prev => 
              prev.map(item => 
                item.id === newItem.id ? { ...item, isNew: false } : item
              )
            );
          }, 3000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transaction_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[ActivityFeed] Transaction updated:', payload);
          setActivities(prev => 
            prev.map(item => 
              item.id === payload.new.id 
                ? { ...transformLog(payload.new), isNew: true }
                : item
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('[ActivityFeed] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit, transformLog]);

  return {
    activities,
    isLoading,
    isConnected,
  };
}
