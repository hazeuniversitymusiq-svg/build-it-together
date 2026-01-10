/**
 * FLOW Orchestration Context
 * 
 * React integration for the rules engine.
 * NOW USING SUPABASE - Real data, no localStorage simulation.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFundingSources, RealFundingSource } from '@/hooks/useFundingSources';
import { useFallbackPreference, type FallbackPreference } from '@/hooks/useFallbackPreference';
import {
  FundingSource,
  PaymentRequest,
  PaymentResolution,
  GuardrailConfig,
  UserPaymentState,
  DEFAULT_GUARDRAILS,
  resolvePayment,
  getOrResetDailyState,
  recordAutoApprovedPayment,
} from '@/lib/orchestration';

interface OrchestrationContextValue {
  // Funding sources (from Supabase)
  sources: FundingSource[];
  realSources: RealFundingSource[];
  loading: boolean;
  refetchSources: () => Promise<void>;
  
  // Balance updates
  updateBalance: (sourceId: string, balance: number) => Promise<{ success: boolean; error: string | null }>;
  updateLinkedStatus: (sourceId: string, linked: boolean) => Promise<{ success: boolean; error: string | null }>;
  
  // Guardrails
  guardrails: GuardrailConfig;
  updateGuardrails: (config: Partial<GuardrailConfig>) => void;
  
  // Fallback preference
  fallbackPreference: FallbackPreference;
  updateFallbackPreference: (pref: FallbackPreference) => Promise<{ success: boolean; error: string | null }>;
  
  // Resolution
  resolvePaymentRequest: (request: PaymentRequest) => PaymentResolution;
  
  // State tracking
  userState: UserPaymentState;
  recordPayment: (amount: number) => void;
  
  // Wallet helpers
  walletBalance: number;
  totalBalance: number;
}

const OrchestrationContext = createContext<OrchestrationContextValue | null>(null);

// Storage key for user state (still local - daily limits)
const STATE_KEY = 'flow_user_state';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('Failed to save to storage:', key);
  }
}

// Convert RealFundingSource to orchestration FundingSource
function toOrchestrationSource(source: RealFundingSource): FundingSource {
  // Map funding_source_type to FundingRailType
  const typeMap: Record<string, 'wallet' | 'bank' | 'card'> = {
    wallet: 'wallet',
    bank: 'bank',
    debit_card: 'card',
    credit_card: 'card',
  };

  return {
    id: source.id,
    type: typeMap[source.type] || 'wallet',
    name: source.name,
    balance: source.balance,
    isLinked: source.isLinked,
    isAvailable: source.isAvailable,
    priority: source.priority,
  };
}

export function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // Use Supabase-backed funding sources
  const {
    sources: realSources,
    loading,
    walletBalance,
    totalBalance,
    refetch: refetchSources,
    updateBalance,
    updateLinkedStatus,
  } = useFundingSources();

  // Fallback preference from Supabase
  const { 
    preference: fallbackPreference, 
    updatePreference: updateFallbackPreference 
  } = useFallbackPreference();

  // Convert to orchestration format
  const sources = realSources.map(toOrchestrationSource);

  // Guardrails from first linked source (they all have same limits)
  const [guardrails, setGuardrails] = useState<GuardrailConfig>(() => {
    const firstSource = realSources.find(s => s.isLinked);
    if (firstSource) {
      return {
        ...DEFAULT_GUARDRAILS,
        maxAutoTopUpAmount: firstSource.maxAutoTopUp,
        requireConfirmationAbove: firstSource.requireConfirmAbove,
      };
    }
    return DEFAULT_GUARDRAILS;
  });

  // Update guardrails when sources change
  useEffect(() => {
    const firstSource = realSources.find(s => s.isLinked);
    if (firstSource) {
      setGuardrails(prev => ({
        ...prev,
        maxAutoTopUpAmount: firstSource.maxAutoTopUp,
        requireConfirmationAbove: firstSource.requireConfirmAbove,
      }));
    }
  }, [realSources]);

  const [userState, setUserState] = useState<UserPaymentState>(() => {
    const stored = loadFromStorage<UserPaymentState>(STATE_KEY, {
      dailyAutoApproved: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    });
    return getOrResetDailyState(stored);
  });

  // Persist user state
  useEffect(() => {
    saveToStorage(STATE_KEY, userState);
  }, [userState]);

  // Reset state on user change
  useEffect(() => {
    if (!user) {
      setUserState({
        dailyAutoApproved: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [user]);

  const updateGuardrails = useCallback((config: Partial<GuardrailConfig>) => {
    setGuardrails(prev => ({ ...prev, ...config }));
  }, []);

  const resolvePaymentRequest = useCallback((request: PaymentRequest): PaymentResolution => {
    const currentState = getOrResetDailyState(userState);
    return resolvePayment(request, {
      sources,
      config: guardrails,
      userState: currentState,
      fallbackPreference,
    });
  }, [sources, guardrails, userState, fallbackPreference]);

  const recordPayment = useCallback((amount: number) => {
    setUserState(prev => recordAutoApprovedPayment(prev, amount));
  }, []);

  const value: OrchestrationContextValue = {
    sources,
    realSources,
    loading,
    refetchSources,
    updateBalance,
    updateLinkedStatus,
    guardrails,
    updateGuardrails,
    fallbackPreference,
    updateFallbackPreference,
    resolvePaymentRequest,
    userState,
    recordPayment,
    walletBalance,
    totalBalance,
  };

  return (
    <OrchestrationContext.Provider value={value}>
      {children}
    </OrchestrationContext.Provider>
  );
}

export function useOrchestration() {
  const context = useContext(OrchestrationContext);
  if (!context) {
    throw new Error('useOrchestration must be used within OrchestrationProvider');
  }
  return context;
}
