/**
 * FLOW Connection Engine Hook
 * 
 * React hook wrapper for the Connection Intelligence Engine.
 * Provides seamless app connection functionality to UI components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { 
  ConnectionEngine, 
  createConnectionEngine,
  APP_CATALOG,
  getAppsByCategory,
  getPopularApps,
  type AppDefinition,
  type ConnectionStatus,
  type ConnectionResult,
  type SyncResult,
} from '@/lib/connection/connection-engine';
import type { Database } from '@/integrations/supabase/types';

type ConnectorName = Database['public']['Enums']['connector_name'];

interface UseConnectionEngineReturn {
  // State
  isLoading: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  
  // Data
  detectedApps: AppDefinition[];
  connectionStatuses: ConnectionStatus[];
  connectedApps: ConnectionStatus[];
  disconnectedApps: AppDefinition[];
  recommendedApps: AppDefinition[];
  
  // Categorized apps
  wallets: AppDefinition[];
  banks: AppDefinition[];
  bnplApps: AppDefinition[];
  billers: AppDefinition[];
  
  // Stats
  totalConnected: number;
  totalBalance: number;
  
  // Actions
  detectApps: () => Promise<void>;
  connectApp: (appName: ConnectorName) => Promise<ConnectionResult>;
  connectApps: (appNames: ConnectorName[]) => Promise<ConnectionResult[]>;
  quickConnect: () => Promise<SyncResult>;
  disconnectApp: (appName: ConnectorName) => Promise<boolean>;
  syncBalances: () => Promise<SyncResult>;
  refreshStatuses: () => Promise<void>;
  
  // Helpers
  isAppConnected: (appName: string) => boolean;
  getAppStatus: (appName: string) => ConnectionStatus | undefined;
  getAppDefinition: (appName: string) => AppDefinition | undefined;
}

export function useConnectionEngine(): UseConnectionEngineReturn {
  const { user } = useAuth();
  const [engine, setEngine] = useState<ConnectionEngine | null>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Data
  const [detectedApps, setDetectedApps] = useState<AppDefinition[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
  const [recommendedApps, setRecommendedApps] = useState<AppDefinition[]>([]);

  // Initialize engine when user is available
  useEffect(() => {
    if (user?.id) {
      setEngine(createConnectionEngine(user.id));
    } else {
      setEngine(null);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    if (engine) {
      loadData();
    }
  }, [engine]);

  const loadData = useCallback(async () => {
    if (!engine) return;
    
    setIsLoading(true);
    try {
      const [detected, statuses, recommended] = await Promise.all([
        engine.detectInstalledApps(),
        engine.getConnectionStatuses(),
        engine.getRecommendedApps(),
      ]);
      
      setDetectedApps(detected);
      setConnectionStatuses(statuses);
      setRecommendedApps(recommended);
    } catch (error) {
      console.error('Failed to load connection data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  // Derived data
  const connectedApps = useMemo(() => 
    connectionStatuses.filter(s => s.isConnected),
    [connectionStatuses]
  );

  const disconnectedApps = useMemo(() => 
    APP_CATALOG.filter(app => 
      !connectionStatuses.find(s => s.appName === app.name && s.isConnected)
    ),
    [connectionStatuses]
  );

  const wallets = useMemo(() => getAppsByCategory('wallet'), []);
  const banks = useMemo(() => getAppsByCategory('bank'), []);
  const bnplApps = useMemo(() => getAppsByCategory('bnpl'), []);
  const billers = useMemo(() => getAppsByCategory('biller'), []);

  const totalConnected = connectedApps.length;
  
  const totalBalance = useMemo(() => 
    connectedApps.reduce((sum, app) => sum + (app.balance || 0), 0),
    [connectedApps]
  );

  // Actions
  const detectApps = useCallback(async () => {
    if (!engine) return;
    const detected = await engine.detectInstalledApps();
    setDetectedApps(detected);
  }, [engine]);

  const connectApp = useCallback(async (appName: ConnectorName): Promise<ConnectionResult> => {
    if (!engine) return { success: false, appName, error: 'Not initialized' };
    
    setIsConnecting(true);
    try {
      const result = await engine.connectApp(appName);
      await loadData(); // Refresh statuses
      return result;
    } finally {
      setIsConnecting(false);
    }
  }, [engine, loadData]);

  const connectApps = useCallback(async (appNames: ConnectorName[]): Promise<ConnectionResult[]> => {
    if (!engine) return appNames.map(name => ({ success: false, appName: name, error: 'Not initialized' }));
    
    setIsConnecting(true);
    try {
      const results = await engine.connectApps(appNames);
      await loadData();
      return results;
    } finally {
      setIsConnecting(false);
    }
  }, [engine, loadData]);

  const quickConnect = useCallback(async (): Promise<SyncResult> => {
    if (!engine) {
      return { success: false, synced: 0, failed: 0, results: [] };
    }
    
    setIsConnecting(true);
    try {
      const result = await engine.quickConnect();
      await loadData();
      return result;
    } finally {
      setIsConnecting(false);
    }
  }, [engine, loadData]);

  const disconnectApp = useCallback(async (appName: ConnectorName): Promise<boolean> => {
    if (!engine) return false;
    
    const result = await engine.disconnectApp(appName);
    await loadData();
    return result;
  }, [engine, loadData]);

  const syncBalances = useCallback(async (): Promise<SyncResult> => {
    if (!engine) {
      return { success: false, synced: 0, failed: 0, results: [] };
    }
    
    setIsSyncing(true);
    try {
      const result = await engine.syncBalances();
      await loadData();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [engine, loadData]);

  const refreshStatuses = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Helpers
  const isAppConnected = useCallback((appName: string): boolean => {
    return connectionStatuses.some(s => s.appName === appName && s.isConnected);
  }, [connectionStatuses]);

  const getAppStatus = useCallback((appName: string): ConnectionStatus | undefined => {
    return connectionStatuses.find(s => s.appName === appName);
  }, [connectionStatuses]);

  const getAppDefinition = useCallback((appName: string): AppDefinition | undefined => {
    return APP_CATALOG.find(a => a.name === appName);
  }, []);

  return {
    // State
    isLoading,
    isConnecting,
    isSyncing,
    
    // Data
    detectedApps,
    connectionStatuses,
    connectedApps,
    disconnectedApps,
    recommendedApps,
    
    // Categorized
    wallets,
    banks,
    bnplApps,
    billers,
    
    // Stats
    totalConnected,
    totalBalance,
    
    // Actions
    detectApps,
    connectApp,
    connectApps,
    quickConnect,
    disconnectApp,
    syncBalances,
    refreshStatuses,
    
    // Helpers
    isAppConnected,
    getAppStatus,
    getAppDefinition,
  };
}
