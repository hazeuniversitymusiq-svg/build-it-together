/**
 * FLOW Connection Intelligence Engine
 * 
 * The brain behind FLOW's core promise:
 * "Connect to your existing wallets, banks, and bill apps"
 * 
 * This engine handles:
 * 1. App Discovery - Detect installed payment apps
 * 2. Seamless Connection - One-tap linking without friction
 * 3. Balance Sync - Keep balances current
 * 4. Health Monitoring - Track connection status
 * 5. Smart Defaults - Pre-configure optimal settings
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ConnectorName = Database['public']['Enums']['connector_name'];
type ConnectorType = Database['public']['Enums']['connector_type'];
type ConnectorStatus = Database['public']['Enums']['connector_status'];

// ============================================
// Types
// ============================================

export interface AppDefinition {
  name: ConnectorName;
  displayName: string;
  type: ConnectorType;
  category: 'wallet' | 'bank' | 'bnpl' | 'biller';
  icon: string;
  color: string;
  capabilities: string[];
  defaultBalance?: number;
  defaultLimit?: number;
  priority: number;
  detectionSignals: string[]; // How we detect if user has this app
  popular: boolean;
}

export interface ConnectionStatus {
  appName: ConnectorName;
  isConnected: boolean;
  isDetected: boolean;
  status: ConnectorStatus;
  balance?: number;
  lastSyncAt?: string;
  error?: string;
}

export interface ConnectionResult {
  success: boolean;
  appName: ConnectorName;
  connectorId?: string;
  fundingSourceId?: string;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  results: ConnectionStatus[];
}

// ============================================
// App Catalog - All supported apps
// ============================================

export const APP_CATALOG: AppDefinition[] = [
  // === WALLETS ===
  {
    name: 'TouchNGo',
    displayName: "Touch 'n Go",
    type: 'wallet',
    category: 'wallet',
    icon: 'wallet',
    color: '#0066CC',
    capabilities: ['can_pay_qr', 'can_p2p', 'can_receive', 'can_topup'],
    defaultBalance: 85.50,
    priority: 1,
    detectionSignals: ['my.touchngo.com', 'touchngo'],
    popular: true,
  },
  {
    name: 'GrabPay',
    displayName: 'GrabPay',
    type: 'wallet',
    category: 'wallet',
    icon: 'wallet',
    color: '#00B14F',
    capabilities: ['can_pay_qr', 'can_p2p', 'can_receive', 'can_topup'],
    defaultBalance: 42.00,
    priority: 2,
    detectionSignals: ['grab.com', 'grabpay'],
    popular: true,
  },
  {
    name: 'Boost',
    displayName: 'Boost',
    type: 'wallet',
    category: 'wallet',
    icon: 'wallet',
    color: '#FF6B00',
    capabilities: ['can_pay_qr', 'can_p2p', 'can_receive', 'can_topup'],
    defaultBalance: 25.00,
    priority: 3,
    detectionSignals: ['myboost.com.my', 'boost'],
    popular: true,
  },
  {
    name: 'DuitNow',
    displayName: 'DuitNow',
    type: 'wallet',
    category: 'wallet',
    icon: 'wallet',
    color: '#E91E63',
    capabilities: ['can_pay_qr', 'can_p2p', 'can_receive'],
    defaultBalance: 0,
    priority: 4,
    detectionSignals: ['duitnow'],
    popular: true,
  },
  
  // === BANKS ===
  {
    name: 'Maybank',
    displayName: 'Maybank',
    type: 'bank',
    category: 'bank',
    icon: 'landmark',
    color: '#FFCC00',
    capabilities: ['can_transfer', 'can_fund_topup', 'can_pay'],
    defaultBalance: 1250.00,
    priority: 5,
    detectionSignals: ['maybank2u', 'maybank'],
    popular: true,
  },
  {
    name: 'BankTransfer',
    displayName: 'Bank Transfer',
    type: 'bank',
    category: 'bank',
    icon: 'landmark',
    color: '#6366F1',
    capabilities: ['can_transfer', 'can_fund_topup'],
    defaultBalance: 500.00,
    priority: 6,
    detectionSignals: [],
    popular: false,
  },
  
  // === BNPL ===
  {
    name: 'Atome',
    displayName: 'Atome',
    type: 'bnpl',
    category: 'bnpl',
    icon: 'credit-card',
    color: '#14B8A6',
    capabilities: ['can_pay_qr', 'can_pay', 'can_installment'],
    defaultLimit: 1500.00,
    priority: 10,
    detectionSignals: ['atome.sg', 'atome'],
    popular: true,
  },
  {
    name: 'SPayLater',
    displayName: 'SPayLater',
    type: 'bnpl',
    category: 'bnpl',
    icon: 'credit-card',
    color: '#F97316',
    capabilities: ['can_pay_qr', 'can_pay', 'can_installment'],
    defaultLimit: 1000.00,
    priority: 11,
    detectionSignals: ['shopee', 'spaylater'],
    popular: true,
  },
  
  // === CARDS ===
  {
    name: 'VisaMastercard',
    displayName: 'Card',
    type: 'card',
    category: 'wallet',
    icon: 'credit-card',
    color: '#8B5CF6',
    capabilities: ['can_pay_qr', 'can_topup', 'can_pay'],
    priority: 7,
    detectionSignals: [],
    popular: false,
  },
  
  // === BILLERS ===
  {
    name: 'TNB',
    displayName: 'TNB (Electricity)',
    type: 'biller',
    category: 'biller',
    icon: 'zap',
    color: '#FACC15',
    capabilities: ['can_fetch_due', 'can_pay'],
    priority: 20,
    detectionSignals: ['tnb.com.my'],
    popular: true,
  },
  {
    name: 'Unifi',
    displayName: 'Unifi (Internet)',
    type: 'biller',
    category: 'biller',
    icon: 'wifi',
    color: '#06B6D4',
    capabilities: ['can_fetch_due', 'can_pay'],
    priority: 21,
    detectionSignals: ['unifi.com.my'],
    popular: true,
  },
  {
    name: 'Maxis',
    displayName: 'Maxis (Mobile)',
    type: 'biller',
    category: 'biller',
    icon: 'smartphone',
    color: '#22C55E',
    capabilities: ['can_fetch_due', 'can_pay'],
    priority: 22,
    detectionSignals: ['maxis.com.my'],
    popular: true,
  },
];

// ============================================
// Helper Functions
// ============================================

export function getAppByName(name: string): AppDefinition | undefined {
  return APP_CATALOG.find(app => app.name === name);
}

export function getAppsByCategory(category: AppDefinition['category']): AppDefinition[] {
  return APP_CATALOG.filter(app => app.category === category);
}

export function getPopularApps(): AppDefinition[] {
  return APP_CATALOG.filter(app => app.popular);
}

// ============================================
// Connection Engine Class
// ============================================

export class ConnectionEngine {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Detect which apps the user likely has installed
   * In prototype mode, simulates detection
   * In production, would use native app detection APIs
   */
  async detectInstalledApps(): Promise<AppDefinition[]> {
    // Simulate app detection - in production this would use native APIs
    // For now, return popular apps as "detected"
    const detected: AppDefinition[] = [];
    
    // Check discovered_apps table for any native/manual detections
    const { data: discoveries } = await supabase
      .from('discovered_apps')
      .select('*')
      .eq('user_id', this.userId)
      .eq('detected', true);

    const discoveredNames = new Set(discoveries?.map(d => d.app_name) || []);

    // Add discovered apps
    for (const app of APP_CATALOG) {
      if (discoveredNames.has(app.name)) {
        detected.push(app);
      }
    }

    // Check user's app_mode, but default to Prototype behavior if no user record
    const { data: user } = await supabase
      .from('users')
      .select('app_mode')
      .eq('id', this.userId)
      .maybeSingle();

    // In prototype mode OR if no user record (default behavior), simulate detecting popular wallets
    // This ensures the Quick Connect flow works immediately after signup
    const isPrototypeMode = !user || user.app_mode === 'Prototype' || user.app_mode === 'Pilot';
    
    if (isPrototypeMode) {
      // Simulate that user has popular apps installed
      for (const app of APP_CATALOG) {
        if (app.popular && !detected.find(d => d.name === app.name)) {
          detected.push(app);
        }
      }
    }

    return detected.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get current connection status for all apps
   */
  async getConnectionStatuses(): Promise<ConnectionStatus[]> {
    const [{ data: connectors }, { data: fundingSources }] = await Promise.all([
      supabase
        .from('connectors')
        .select('*')
        .eq('user_id', this.userId),
      supabase
        .from('funding_sources')
        .select('*')
        .eq('user_id', this.userId),
    ]);

    const connectorMap = new Map(connectors?.map(c => [c.name, c]) || []);
    const sourceMap = new Map(fundingSources?.map(s => [s.name, s]) || []);

    const statuses: ConnectionStatus[] = [];

    for (const app of APP_CATALOG) {
      const connector = connectorMap.get(app.name);
      const source = sourceMap.get(app.name);

      statuses.push({
        appName: app.name,
        isConnected: connector?.status === 'available',
        isDetected: connector !== undefined,
        status: connector?.status || 'unavailable',
        balance: source ? Number(source.balance) : undefined,
        lastSyncAt: connector?.last_sync_at || undefined,
        error: connector?.error_code || undefined,
      });
    }

    return statuses;
  }

  /**
   * Ensure user record exists in users table
   * Required because connectors has a foreign key to users
   */
  private async ensureUserExists(): Promise<boolean> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', this.userId)
        .maybeSingle();

      if (existingUser) {
        return true;
      }

      // Create user record with default prototype settings
      const { error } = await supabase
        .from('users')
        .insert({
          id: this.userId,
          phone: '+60000000000', // Placeholder - required field
          app_mode: 'Prototype',
          identity_status: 'active',
          biometric_enabled: false,
          paused: false,
        });

      if (error) {
        console.error('Failed to create user record:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error ensuring user exists:', err);
      return false;
    }
  }

  /**
   * Connect a single app - creates connector and funding source
   */
  async connectApp(appName: ConnectorName): Promise<ConnectionResult> {
    const app = getAppByName(appName);
    if (!app) {
      return { success: false, appName, error: 'Unknown app' };
    }

    // Ensure user exists before creating connections
    const userExists = await this.ensureUserExists();
    if (!userExists) {
      return { success: false, appName, error: 'Failed to initialize user profile' };
    }

    try {
      // Build capabilities object
      const capabilities: Record<string, boolean> = {};
      for (const cap of app.capabilities) {
        capabilities[cap] = true;
      }

      // Create or update connector
      const { data: connector, error: connectorError } = await supabase
        .from('connectors')
        .upsert([{
          user_id: this.userId,
          name: app.name,
          type: app.type,
          status: 'available' as const,
          mode: 'Prototype' as const,
          capabilities,
          last_sync_at: new Date().toISOString(),
        }], { onConflict: 'user_id,name' })
        .select()
        .single();

      if (connectorError) throw connectorError;

      // Create funding source for payment apps (not billers)
      let fundingSourceId: string | undefined;
      
      if (app.category !== 'biller') {
        const balance = app.category === 'bnpl' 
          ? (app.defaultLimit || 500)
          : (app.defaultBalance || 0);

        const fundingType = app.type === 'bnpl' ? 'bnpl' : 
                            app.type === 'card' ? 'debit_card' : 
                            app.type as 'wallet' | 'bank';

        const { data: source, error: sourceError } = await supabase
          .from('funding_sources')
          .upsert([{
            user_id: this.userId,
            name: app.name,
            type: fundingType,
            balance,
            currency: 'MYR',
            priority: app.priority,
            linked_status: 'linked' as const,
            available: true,
            max_auto_topup_amount: app.category === 'wallet' ? 200 : 
                                    app.category === 'bank' ? 500 : 0,
            require_extra_confirm_amount: app.category === 'wallet' ? 300 : 
                                          app.category === 'bank' ? 1000 : 200,
          }], { onConflict: 'user_id,name' })
          .select()
          .single();

        if (sourceError) throw sourceError;
        fundingSourceId = source?.id;
      }

      // For billers, create biller account
      if (app.category === 'biller') {
        await supabase
          .from('biller_accounts')
          .upsert([{
            user_id: this.userId,
            biller_name: app.name,
            account_reference: `ACC-${Date.now()}`,
            status: 'linked' as const,
          }], { onConflict: 'user_id,biller_name' });
      }

      return {
        success: true,
        appName,
        connectorId: connector?.id,
        fundingSourceId,
      };
    } catch (error) {
      console.error('Connection error:', error);
      return {
        success: false,
        appName,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Connect multiple apps at once
   */
  async connectApps(appNames: ConnectorName[]): Promise<ConnectionResult[]> {
    const results = await Promise.all(
      appNames.map(name => this.connectApp(name))
    );
    return results;
  }

  /**
   * Quick connect - auto-detect and connect all detected apps
   */
  async quickConnect(): Promise<SyncResult> {
    // Ensure user exists upfront for efficiency
    const userExists = await this.ensureUserExists();
    if (!userExists) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        results: [],
      };
    }

    const detected = await this.detectInstalledApps();
    const results = await this.connectApps(detected.map(a => a.name));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    const statuses = await this.getConnectionStatuses();

    return {
      success: failCount === 0,
      synced: successCount,
      failed: failCount,
      results: statuses,
    };
  }

  /**
   * Sync balances for all connected apps
   * In production, this would call actual APIs
   */
  async syncBalances(): Promise<SyncResult> {
    const statuses = await this.getConnectionStatuses();
    const connected = statuses.filter(s => s.isConnected);

    // Update last_sync_at for all connectors
    await supabase
      .from('connectors')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', this.userId)
      .eq('status', 'available');

    return {
      success: true,
      synced: connected.length,
      failed: 0,
      results: statuses,
    };
  }

  /**
   * Disconnect an app
   */
  async disconnectApp(appName: ConnectorName): Promise<boolean> {
    try {
      await Promise.all([
        supabase
          .from('connectors')
          .update({ status: 'unavailable' })
          .eq('user_id', this.userId)
          .eq('name', appName),
        supabase
          .from('funding_sources')
          .update({ linked_status: 'unlinked', available: false })
          .eq('user_id', this.userId)
          .eq('name', appName),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get recommended apps based on what user has connected
   */
  async getRecommendedApps(): Promise<AppDefinition[]> {
    const statuses = await this.getConnectionStatuses();
    const connected = new Set(statuses.filter(s => s.isConnected).map(s => s.appName));

    // Recommend apps the user hasn't connected yet
    return APP_CATALOG
      .filter(app => app.popular && !connected.has(app.name))
      .slice(0, 3);
  }

  /**
   * Check connection health and mark degraded connectors
   */
  async checkHealth(): Promise<Map<ConnectorName, ConnectorStatus>> {
    const { data: connectors } = await supabase
      .from('connectors')
      .select('name, status, last_sync_at')
      .eq('user_id', this.userId);

    const health = new Map<ConnectorName, ConnectorStatus>();

    for (const connector of connectors || []) {
      let status: ConnectorStatus = connector.status;

      // Check if stale (no sync in 24 hours)
      if (connector.last_sync_at) {
        const lastSync = new Date(connector.last_sync_at);
        const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSync > 24 && status === 'available') {
          status = 'degraded';
          // Update in database
          await supabase
            .from('connectors')
            .update({ status: 'degraded' })
            .eq('user_id', this.userId)
            .eq('name', connector.name);
        }
      }

      health.set(connector.name as ConnectorName, status);
    }

    return health;
  }
}

// ============================================
// Factory function
// ============================================

export function createConnectionEngine(userId: string): ConnectionEngine {
  return new ConnectionEngine(userId);
}
