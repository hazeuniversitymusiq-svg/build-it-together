/**
 * FLOW Test Mode Hook
 * 
 * Manages the toggle between Field Test Mode (real wallet handoff) 
 * and Prototype Mode (simulated execution).
 */

import { useState, useEffect, useCallback } from 'react';

export type FlowTestMode = 'field_test' | 'prototype';

const STORAGE_KEY = 'flow_test_mode';

export function useTestMode() {
  const [mode, setModeState] = useState<FlowTestMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default to prototype for demo purposes
    return (stored as FlowTestMode) || 'prototype';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((newMode: FlowTestMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState(prev => prev === 'field_test' ? 'prototype' : 'field_test');
  }, []);

  const isFieldTest = mode === 'field_test';
  const isPrototype = mode === 'prototype';

  return {
    mode,
    setMode,
    toggleMode,
    isFieldTest,
    isPrototype,
  };
}

/**
 * Get the confirm route based on test mode
 */
export function getConfirmRoute(planId: string, mode: FlowTestMode): string {
  return mode === 'field_test' 
    ? `/handoff/${planId}` 
    : `/confirm/${planId}`;
}
