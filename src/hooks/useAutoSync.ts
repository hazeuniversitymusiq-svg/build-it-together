/**
 * FLOW Auto Sync Hook
 * 
 * Provides background sync capabilities for:
 * - Balance caching with confidence levels
 * - Connector health tracking
 * - Feeding Smart Resolution Engine
 * 
 * Works in both Prototype and Production modes
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// ============================================
// Types
// ============================================

export interface CachedBalance {
  connector_id: string;
  connector_name: string;
  amount: number;
  currency: string;
  confidence_level: 'high' | 'medium' | 'low';
  last_updated_at: string;
  expires_at: string | null;
  is_stale: boolean;
}

export interface ConnectorHealth {
  connector_id: string;
  connector_name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  last_checked_at: string;
  latency_ms: number | null;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  results: Array<{
    connector_id: string;
    name: string;
    success: boolean;
    balance: number | null;
    latency_ms: number;
  }>;
}

interface UseAutoSyncReturn {
  // State
  isLoading: boolean;
  isSyncing: boolean;
  balances: CachedBalance[];
  health: ConnectorHealth[];
  lastSyncAt: Date | null;
  
  // Actions
  syncAll: () => Promise<SyncResult | null>;
  syncConnector: (connectorId: string) => Promise<boolean>;
  checkHealth: (connectorId: string) => Promise<ConnectorHealth | null>;
  refreshBalances: () => Promise<void>;
  
  // Computed
  totalBalance: number;
  lowConfidenceCount: number;
  unhealthyCount: number;
}

// ============================================
// Hook Implementation
// ============================================

export function useAutoSync(): UseAutoSyncReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [balances, setBalances] = useState<CachedBalance[]>([]);
  const [health, setHealth] = useState<ConnectorHealth[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // ========================================
  // Load cached data from database
  // ========================================
  const loadCachedData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch cached balances with connector names
      const { data: balanceData } = await supabase
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

      if (balanceData) {
        const now = new Date();
        setBalances(balanceData.map((b: any) => ({
          connector_id: b.connector_id,
          connector_name: b.connectors.name,
          amount: Number(b.amount),
          currency: b.currency,
          confidence_level: b.confidence_level,
          last_updated_at: b.last_updated_at,
          expires_at: b.expires_at,
          is_stale: b.expires_at ? new Date(b.expires_at) < now : true,
        })));
      }

      // Fetch latest health status for each connector
      const { data: healthData } = await supabase
        .from('connector_health')
        .select(`
          connector_id,
          status,
          latency_ms,
          checked_at,
          connectors!inner(name)
        `)
        .eq('user_id', user.id)
        .order('checked_at', { ascending: false });

      if (healthData) {
        // Get latest health per connector
        const latestHealth = new Map<string, ConnectorHealth>();
        for (const h of healthData as any[]) {
          if (!latestHealth.has(h.connector_id)) {
            latestHealth.set(h.connector_id, {
              connector_id: h.connector_id,
              connector_name: h.connectors.name,
              status: h.status,
              last_checked_at: h.checked_at,
              latency_ms: h.latency_ms,
            });
          }
        }
        setHealth(Array.from(latestHealth.values()));
      }

    } catch (error) {
      console.error('Failed to load cached sync data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // ========================================
  // Sync All Connectors
  // ========================================
  const syncAll = useCallback(async (): Promise<SyncResult | null> => {
    if (!user || isSyncing) return null;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('connector-sync/sync-all', {
        method: 'POST',
      });

      if (error) {
        console.error('Sync all failed:', error);
        return null;
      }

      setLastSyncAt(new Date());
      
      // Refresh cached data
      await loadCachedData();

      return data as SyncResult;
    } catch (error) {
      console.error('Sync all error:', error);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, loadCachedData]);

  // ========================================
  // Sync Single Connector
  // ========================================
  const syncConnector = useCallback(async (connectorId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.functions.invoke('connector-sync/sync-balance', {
        method: 'POST',
        body: { connector_id: connectorId },
      });

      if (error) {
        console.error('Sync connector failed:', error);
        return false;
      }

      // Refresh cached data
      await loadCachedData();

      return data?.success ?? false;
    } catch (error) {
      console.error('Sync connector error:', error);
      return false;
    }
  }, [user, loadCachedData]);

  // ========================================
  // Check Connector Health
  // ========================================
  const checkHealth = useCallback(async (connectorId: string): Promise<ConnectorHealth | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('connector-sync/health-check', {
        method: 'POST',
        body: { connector_id: connectorId, check_type: 'auth' },
      });

      if (error) {
        console.error('Health check failed:', error);
        return null;
      }

      // Refresh health data
      await loadCachedData();

      // Return the result
      const connector = health.find(h => h.connector_id === connectorId);
      return connector ?? null;
    } catch (error) {
      console.error('Health check error:', error);
      return null;
    }
  }, [user, health, loadCachedData]);

  // ========================================
  // Refresh Balances (from cache)
  // ========================================
  const refreshBalances = useCallback(async () => {
    await loadCachedData();
  }, [loadCachedData]);

  // ========================================
  // Computed Values
  // ========================================
  const totalBalance = balances.reduce((sum, b) => sum + b.amount, 0);
  const lowConfidenceCount = balances.filter(b => b.confidence_level === 'low').length;
  const unhealthyCount = health.filter(h => h.status === 'unhealthy').length;

  return {
    isLoading,
    isSyncing,
    balances,
    health,
    lastSyncAt,
    syncAll,
    syncConnector,
    checkHealth,
    refreshBalances,
    totalBalance,
    lowConfidenceCount,
    unhealthyCount,
  };
}
