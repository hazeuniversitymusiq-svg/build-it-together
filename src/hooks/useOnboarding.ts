/**
 * Onboarding Hook
 * 
 * Tracks first-time user state and onboarding progress.
 * Uses localStorage for persistence.
 */

import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_KEY = 'flow_onboarding_completed';
const ONBOARDING_STEP_KEY = 'flow_onboarding_step';

// Check if URL contains recovery/auth tokens that should bypass onboarding
function isAuthFlowUrl(): boolean {
  if (typeof window === 'undefined') return false;
  
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const search = window.location.search;
  const fullUrl = hash + search + pathname;
  
  // Skip onboarding for:
  // 1. User is on /auth page
  // 2. Password recovery, magic links, etc.
  return (
    pathname === '/auth' ||
    fullUrl.includes('type=recovery') ||
    fullUrl.includes('type%3Drecovery') ||
    fullUrl.includes('type=signup') ||
    fullUrl.includes('type=magiclink') ||
    fullUrl.includes('access_token=') ||
    fullUrl.includes('token_hash=') ||
    fullUrl.includes('error_code=') ||
    fullUrl.includes('error_description=')
  );
}

export function useOnboarding() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Always skip onboarding for auth flow URLs (password reset, magic links, etc.)
    if (isAuthFlowUrl()) {
      setHasCompleted(true);
      setIsFirstTime(false);
      setIsLoading(false);
      return;
    }

    const completed = localStorage.getItem(ONBOARDING_KEY);
    const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
    
    if (!completed) {
      setIsFirstTime(true);
      setHasCompleted(false);
      setCurrentStep(savedStep ? parseInt(savedStep, 10) : 0);
    } else {
      setIsFirstTime(false);
      setHasCompleted(true);
    }
    setIsLoading(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(true);
    setIsFirstTime(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
    setHasCompleted(false);
    setIsFirstTime(true);
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
    localStorage.setItem(ONBOARDING_STEP_KEY, step.toString());
  }, []);

  const nextStep = useCallback(() => {
    const next = currentStep + 1;
    setCurrentStep(next);
    localStorage.setItem(ONBOARDING_STEP_KEY, next.toString());
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const prev = Math.max(0, currentStep - 1);
    setCurrentStep(prev);
    localStorage.setItem(ONBOARDING_STEP_KEY, prev.toString());
  }, [currentStep]);

  return {
    isFirstTime,
    hasCompleted,
    currentStep,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    goToStep,
    nextStep,
    prevStep,
  };
}
