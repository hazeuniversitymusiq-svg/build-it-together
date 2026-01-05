/**
 * FLOW Orchestration Context
 * 
 * React integration for the rules engine.
 * Manages funding sources, user state, and payment resolution.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  // Funding sources
  sources: FundingSource[];
  setSources: (sources: FundingSource[]) => void;
  
  // Guardrails
  guardrails: GuardrailConfig;
  updateGuardrails: (config: Partial<GuardrailConfig>) => void;
  
  // Resolution
  resolvePaymentRequest: (request: PaymentRequest) => PaymentResolution;
  
  // State tracking
  userState: UserPaymentState;
  recordPayment: (amount: number) => void;
  
  // Wallet helpers
  walletBalance: number;
  topUpWallet: (amount: number) => void;
}

const OrchestrationContext = createContext<OrchestrationContextValue | null>(null);

// Storage keys
const SOURCES_KEY = 'flow_funding_sources';
const GUARDRAILS_KEY = 'flow_guardrails';
const STATE_KEY = 'flow_user_state';

// Default funding sources based on user's declared stack
function getDefaultSources(): FundingSource[] {
  // Load linked sources from localStorage (set during onboarding)
  const linkedData = localStorage.getItem('flow_linked_sources');
  const linked: string[] = linkedData ? JSON.parse(linkedData) : [];

  return [
    {
      id: 'wallet',
      type: 'wallet',
      name: 'FLOW Wallet',
      balance: 0, // Start empty
      isLinked: true, // Always available
      isAvailable: true,
      priority: 1,
    },
    {
      id: 'bank',
      type: 'bank',
      name: 'Bank Account',
      balance: 10000, // High limit for bank
      isLinked: linked.includes('bank'),
      isAvailable: linked.includes('bank'),
      priority: 2,
    },
    {
      id: 'card',
      type: 'card',
      name: 'Credit Card',
      balance: 5000, // Credit limit
      isLinked: linked.includes('card'),
      isAvailable: linked.includes('card'),
      priority: 3,
    },
  ];
}

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

export function OrchestrationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Initialize state from storage
  const [sources, setSourcesState] = useState<FundingSource[]>(() => 
    loadFromStorage(SOURCES_KEY, getDefaultSources())
  );

  const [guardrails, setGuardrails] = useState<GuardrailConfig>(() =>
    loadFromStorage(GUARDRAILS_KEY, DEFAULT_GUARDRAILS)
  );

  const [userState, setUserState] = useState<UserPaymentState>(() => {
    const stored = loadFromStorage<UserPaymentState>(STATE_KEY, {
      dailyAutoApproved: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
    });
    return getOrResetDailyState(stored);
  });

  // Persist changes
  useEffect(() => {
    saveToStorage(SOURCES_KEY, sources);
  }, [sources]);

  useEffect(() => {
    saveToStorage(GUARDRAILS_KEY, guardrails);
  }, [guardrails]);

  useEffect(() => {
    saveToStorage(STATE_KEY, userState);
  }, [userState]);

  // Reload sources when linked sources change
  useEffect(() => {
    const handleStorageChange = () => {
      const newSources = getDefaultSources();
      setSourcesState(prev => {
        // Preserve balances from previous state
        return newSources.map(ns => {
          const existing = prev.find(p => p.id === ns.id);
          return existing ? { ...ns, balance: existing.balance } : ns;
        });
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Reset state on user change
  useEffect(() => {
    if (!user) {
      setUserState({
        dailyAutoApproved: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [user]);

  const setSources = useCallback((newSources: FundingSource[]) => {
    setSourcesState(newSources);
  }, []);

  const updateGuardrails = useCallback((config: Partial<GuardrailConfig>) => {
    setGuardrails(prev => ({ ...prev, ...config }));
  }, []);

  const resolvePaymentRequest = useCallback((request: PaymentRequest): PaymentResolution => {
    const currentState = getOrResetDailyState(userState);
    return resolvePayment(request, {
      sources,
      config: guardrails,
      userState: currentState,
    });
  }, [sources, guardrails, userState]);

  const recordPayment = useCallback((amount: number) => {
    setUserState(prev => recordAutoApprovedPayment(prev, amount));
  }, []);

  // Calculate current wallet balance
  const walletBalance = sources.find(s => s.type === 'wallet')?.balance ?? 0;

  const topUpWallet = useCallback((amount: number) => {
    setSourcesState(prev => prev.map(s => 
      s.type === 'wallet' 
        ? { ...s, balance: s.balance + amount }
        : s
    ));
  }, []);

  const value: OrchestrationContextValue = {
    sources,
    setSources,
    guardrails,
    updateGuardrails,
    resolvePaymentRequest,
    userState,
    recordPayment,
    walletBalance,
    topUpWallet,
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
