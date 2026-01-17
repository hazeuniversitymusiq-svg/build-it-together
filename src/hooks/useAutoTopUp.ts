/**
 * FLOW Auto Top-Up Intelligence Hook
 * 
 * Core functionality for automatic balance management:
 * - Monitors wallet balances in real-time
 * - Triggers auto top-up when below threshold
 * - Respects user preferences and limits
 * - Logs all auto-funding decisions
 */

import { useEffect, useCallback, useState } from 'react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Default thresholds
const LOW_BALANCE_THRESHOLD = 20; // RM 20
const DEFAULT_TOPUP_AMOUNT = 50; // RM 50
const MAX_AUTO_TOPUP = 200; // RM 200 per transaction

export interface AutoTopUpConfig {
  enabled: boolean;
  threshold: number;
  defaultAmount: number;
  maxAmount: number;
  preferredFundingSourceId?: string;
}

export interface TopUpEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  amount: number;
  triggeredAt: Date;
  status: 'pending' | 'success' | 'failed';
  fundedFrom: string;
}

export function useAutoTopUp() {
  const { user } = useAuth();
  const { sources, wallets, banks, updateBalance } = useFundingSources();
  const { toast } = useToast();
  
  const [config, setConfig] = useState<AutoTopUpConfig>({
    enabled: true,
    threshold: LOW_BALANCE_THRESHOLD,
    defaultAmount: DEFAULT_TOPUP_AMOUNT,
    maxAmount: MAX_AUTO_TOPUP,
  });
  
  const [pendingTopUps, setPendingTopUps] = useState<TopUpEvent[]>([]);
  const [recentTopUps, setRecentTopUps] = useState<TopUpEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get wallets that need top-up
  const walletsNeedingTopUp = wallets.filter(
    w => w.isLinked && w.balance < config.threshold
  );

  // Get preferred funding source (bank with highest balance)
  const preferredFundingSource = banks
    .filter(b => b.isLinked && b.balance > config.defaultAmount)
    .sort((a, b) => b.balance - a.balance)[0];

  // Check if auto top-up is possible
  const canAutoTopUp = config.enabled && 
    walletsNeedingTopUp.length > 0 && 
    !!preferredFundingSource;

  // Execute auto top-up for a single wallet
  const executeTopUp = useCallback(async (
    walletId: string,
    amount: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !preferredFundingSource) {
      return { success: false, error: 'No funding source available' };
    }

    if (amount > config.maxAmount) {
      return { success: false, error: 'Amount exceeds maximum auto-top-up limit' };
    }

    if (preferredFundingSource.balance < amount) {
      return { success: false, error: 'Insufficient funds in funding source' };
    }

    const wallet = sources.find(s => s.id === walletId);
    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    try {
      setIsProcessing(true);

      // Create pending event
      const topUpEvent: TopUpEvent = {
        id: `topup_${Date.now()}`,
        sourceId: walletId,
        sourceName: wallet.name,
        amount,
        triggeredAt: new Date(),
        status: 'pending',
        fundedFrom: preferredFundingSource.name,
      };
      
      setPendingTopUps(prev => [...prev, topUpEvent]);

      // Simulate processing delay (real implementation would call bank API)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update balances
      const newWalletBalance = wallet.balance + amount;
      const newBankBalance = preferredFundingSource.balance - amount;

      await updateBalance(walletId, newWalletBalance);
      await updateBalance(preferredFundingSource.id, newBankBalance);

      // Log the transaction
      await supabase.from('transaction_logs').insert({
        user_id: user.id,
        intent_id: `auto_topup_${Date.now()}`,
        intent_type: 'PayMerchant', // Using existing type
        amount,
        currency: 'MYR',
        status: 'success',
        trigger: 'auto_topup',
        note: `Auto top-up from ${preferredFundingSource.name} to ${wallet.name}`,
        merchant_name: wallet.name,
        rail_used: preferredFundingSource.name,
      });

      // Update event status
      const successEvent: TopUpEvent = { ...topUpEvent, status: 'success' };
      setPendingTopUps(prev => prev.filter(e => e.id !== topUpEvent.id));
      setRecentTopUps(prev => [successEvent, ...prev].slice(0, 10));

      toast({
        title: 'Auto Top-Up Complete',
        description: `RM ${amount.toFixed(2)} added to ${wallet.name}`,
      });

      return { success: true };
    } catch (error) {
      const failedEvent: TopUpEvent = {
        id: `topup_${Date.now()}`,
        sourceId: walletId,
        sourceName: wallet.name,
        amount,
        triggeredAt: new Date(),
        status: 'failed',
        fundedFrom: preferredFundingSource.name,
      };
      
      setPendingTopUps(prev => prev.filter(e => e.sourceId !== walletId));
      setRecentTopUps(prev => [failedEvent, ...prev].slice(0, 10));

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Top-up failed' 
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user, preferredFundingSource, sources, config.maxAmount, updateBalance, toast]);

  // Process all wallets needing top-up
  const processAutoTopUps = useCallback(async () => {
    if (!canAutoTopUp || isProcessing) return;

    for (const wallet of walletsNeedingTopUp) {
      // Calculate optimal top-up amount
      const deficit = config.threshold - wallet.balance;
      const optimalAmount = Math.max(deficit + config.defaultAmount, config.defaultAmount);
      const cappedAmount = Math.min(optimalAmount, config.maxAmount);

      await executeTopUp(wallet.id, cappedAmount);
    }
  }, [canAutoTopUp, isProcessing, walletsNeedingTopUp, config, executeTopUp]);

  // Auto-trigger when low balance detected
  useEffect(() => {
    if (config.enabled && walletsNeedingTopUp.length > 0 && !isProcessing) {
      // Delay to avoid rapid re-triggers
      const timeout = setTimeout(() => {
        console.log('[FLOW] Auto top-up triggered for', walletsNeedingTopUp.length, 'wallets');
        processAutoTopUps();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [config.enabled, walletsNeedingTopUp.length, isProcessing, processAutoTopUps]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AutoTopUpConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Manual trigger
  const triggerTopUp = useCallback((walletId: string, amount?: number) => {
    return executeTopUp(walletId, amount || config.defaultAmount);
  }, [executeTopUp, config.defaultAmount]);

  return {
    // Configuration
    config,
    updateConfig,
    
    // Status
    isEnabled: config.enabled,
    isProcessing,
    canAutoTopUp,
    
    // Data
    walletsNeedingTopUp,
    preferredFundingSource,
    pendingTopUps,
    recentTopUps,
    
    // Actions
    triggerTopUp,
    processAutoTopUps,
  };
}
