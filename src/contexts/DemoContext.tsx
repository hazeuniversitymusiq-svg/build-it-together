/**
 * Global Demo Intelligence Context
 * 
 * Manages demo mode state across the entire app.
 * When active, pages show contextual demo triggers.
 * Also manages guided tour functionality.
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
  // Demo Mode State
  isDemoMode: boolean;
  currentPageConfig: PageDemoConfig | null;
  
  // Demo Mode Actions
  toggleDemoMode: () => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  
  // Page-specific demo actions (registered by pages)
  pageActions: DemoAction[];
  registerPageAction: (action: DemoAction) => void;
  clearPageActions: () => void;
  triggerPageDemo: () => void;

  // Guided Tour State
  isTourActive: boolean;
  currentTourStep: number;
  
  // Guided Tour Actions
  startTour: () => void;
  endTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  goToTourStep: (step: number) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const TOTAL_TOUR_STEPS = 7; // Welcome + 5 pages + Complete

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [pageActions, setPageActions] = useState<DemoAction[]>([]);
  
  // Tour state
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);

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

  // Tour controls
  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentTourStep(0);
    setIsDemoMode(true); // Enable demo mode during tour
  }, []);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentTourStep(0);
  }, []);

  const nextTourStep = useCallback(() => {
    setCurrentTourStep(prev => Math.min(prev + 1, TOTAL_TOUR_STEPS - 1));
  }, []);

  const prevTourStep = useCallback(() => {
    setCurrentTourStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToTourStep = useCallback((step: number) => {
    setCurrentTourStep(Math.max(0, Math.min(step, TOTAL_TOUR_STEPS - 1)));
  }, []);

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
    // Tour
    isTourActive,
    currentTourStep,
    startTour,
    endTour,
    nextTourStep,
    prevTourStep,
    goToTourStep,
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
    isTourActive,
    currentTourStep,
    startTour,
    endTour,
    nextTourStep,
    prevTourStep,
    goToTourStep,
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
