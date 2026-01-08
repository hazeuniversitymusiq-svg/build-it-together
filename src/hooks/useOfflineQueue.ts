/**
 * Offline Queue Hook - Queue payments when offline, sync when back online
 * 
 * FLOW never loses a transaction. If network fails, we queue and retry.
 */

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { supabase } from '@/integrations/supabase/client';

const QUEUE_STORAGE_KEY = 'flow_offline_queue';

interface QueuedIntent {
  id: string;
  type: 'PayMerchant' | 'SendMoney' | 'PayBill';
  amount: number;
  currency: string;
  payeeName: string;
  payeeIdentifier: string;
  metadata: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

interface OfflineQueueState {
  isOnline: boolean;
  queuedItems: QueuedIntent[];
  isSyncing: boolean;
  lastSyncAt: number | null;
}

export function useOfflineQueue() {
  const [state, setState] = useState<OfflineQueueState>({
    isOnline: navigator.onLine,
    queuedItems: [],
    isSyncing: false,
    lastSyncAt: null,
  });

  // Load queue from storage
  const loadQueue = useCallback((): QueuedIntent[] => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save queue to storage
  const saveQueue = useCallback((queue: QueuedIntent[]) => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }, []);

  // Add item to queue
  const queueIntent = useCallback((intent: Omit<QueuedIntent, 'id' | 'createdAt' | 'retryCount'>): string => {
    const newItem: QueuedIntent = {
      ...intent,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      retryCount: 0,
    };

    setState(prev => {
      const newQueue = [...prev.queuedItems, newItem];
      saveQueue(newQueue);
      return { ...prev, queuedItems: newQueue };
    });

    return newItem.id;
  }, [saveQueue]);

  // Remove item from queue
  const removeFromQueue = useCallback((id: string) => {
    setState(prev => {
      const newQueue = prev.queuedItems.filter(item => item.id !== id);
      saveQueue(newQueue);
      return { ...prev, queuedItems: newQueue };
    });
  }, [saveQueue]);

  // Process a single queued item
  const processQueuedItem = useCallback(async (item: QueuedIntent): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Create the intent in the database
      const { error } = await supabase
        .from('intents')
        .insert({
          user_id: user.id,
          type: item.type,
          amount: item.amount,
          currency: item.currency,
          payee_name: item.payeeName,
          payee_identifier: item.payeeIdentifier,
          metadata: {
            ...item.metadata,
            offline_queued: true,
            queued_at: new Date(item.createdAt).toISOString(),
          },
        });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Failed to process queued item:', error);
      return false;
    }
  }, []);

  // Sync all queued items
  const syncQueue = useCallback(async () => {
    if (state.isSyncing || state.queuedItems.length === 0) return;

    setState(prev => ({ ...prev, isSyncing: true }));

    const results: { id: string; success: boolean }[] = [];

    for (const item of state.queuedItems) {
      const success = await processQueuedItem(item);
      results.push({ id: item.id, success });

      if (success) {
        removeFromQueue(item.id);
      } else {
        // Increment retry count
        setState(prev => ({
          ...prev,
          queuedItems: prev.queuedItems.map(q =>
            q.id === item.id ? { ...q, retryCount: q.retryCount + 1 } : q
          ),
        }));
      }
    }

    setState(prev => ({
      ...prev,
      isSyncing: false,
      lastSyncAt: Date.now(),
    }));

    return results;
  }, [state.isSyncing, state.queuedItems, processQueuedItem, removeFromQueue]);

  // Network status listener
  useEffect(() => {
    // Load initial queue
    const initialQueue = loadQueue();
    setState(prev => ({ ...prev, queuedItems: initialQueue }));

    // Web fallback for network status
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncQueue();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Network plugin
      const setupNetworkListener = async () => {
        // Get initial status
        const status = await Network.getStatus();
        setState(prev => ({ ...prev, isOnline: status.connected }));

        // Listen for changes
        Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
          setState(prev => ({ ...prev, isOnline: status.connected }));
          if (status.connected) {
            syncQueue();
          }
        });
      };

      setupNetworkListener();

      return () => {
        Network.removeAllListeners();
      };
    } else {
      // Web fallback
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [loadQueue, syncQueue]);

  // Clear queue (for testing/reset)
  const clearQueue = useCallback(() => {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
    setState(prev => ({ ...prev, queuedItems: [] }));
  }, []);

  // Get queue count
  const queueCount = state.queuedItems.length;

  return {
    ...state,
    queueCount,
    queueIntent,
    removeFromQueue,
    syncQueue,
    clearQueue,
  };
}
