/**
 * Global Demo Intelligence Context
 * 
 * Manages demo mode state across the entire app.
 * When active, pages show contextual demo triggers.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

// Demo actions available per page
export type DemoAction = {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
};

// Page-specific demo configurations
type PageDemoConfig = {
  pageName: string;
  description: string;
};

const PAGE_DEMO_CONFIG: Record<string, PageDemoConfig> = {
  '/home': {
    pageName: 'Home',
    description: 'View wallet balance and quick actions',
  },
  '/flow-card': {
    pageName: 'Flow Card',
    description: 'Simulate a tap payment at a terminal',
  },
  '/scan': {
    pageName: 'Scan',
    description: 'Scan a merchant QR code to pay',
  },
  '/send': {
    pageName: 'Send',
    description: 'Send money to a contact',
  },
  '/bills': {
    pageName: 'Bills',
    description: 'Pay your bills with Flow',
  },
  '/settings': {
    pageName: 'Settings',
    description: 'Manage your Flow preferences',
  },
};

interface DemoContextType {
  // State
  isDemoMode: boolean;
  currentPageConfig: PageDemoConfig | null;
  
  // Actions
  toggleDemoMode: () => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  
  // Page-specific demo actions (registered by pages)
  pageActions: DemoAction[];
  registerPageAction: (action: DemoAction) => void;
  clearPageActions: () => void;
  triggerPageDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pageActions, setPageActions] = useState<DemoAction[]>([]);

  const currentPageConfig = useMemo(() => {
    return PAGE_DEMO_CONFIG[location.pathname] || null;
  }, [location.pathname]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemoMode(true);
  }, []);

  const disableDemoMode = useCallback(() => {
    setIsDemoMode(false);
  }, []);

  const registerPageAction = useCallback((action: DemoAction) => {
    setPageActions(prev => {
      // Replace if same id exists
      const filtered = prev.filter(a => a.id !== action.id);
      return [...filtered, action];
    });
  }, []);

  const clearPageActions = useCallback(() => {
    setPageActions([]);
  }, []);

  const triggerPageDemo = useCallback(() => {
    // Trigger the first available action for this page
    if (pageActions.length > 0) {
      pageActions[0].action();
    }
  }, [pageActions]);

  const value = useMemo(() => ({
    isDemoMode,
    currentPageConfig,
    toggleDemoMode,
    enableDemoMode,
    disableDemoMode,
    pageActions,
    registerPageAction,
    clearPageActions,
    triggerPageDemo,
  }), [
    isDemoMode,
    currentPageConfig,
    toggleDemoMode,
    enableDemoMode,
    disableDemoMode,
    pageActions,
    registerPageAction,
    clearPageActions,
    triggerPageDemo,
  ]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
