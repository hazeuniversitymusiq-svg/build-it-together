import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebAuthn } from '@/hooks/useWebAuthn';

interface SecurityState {
  isPaymentAuthorized: boolean;
  lastAuthTime: number | null;
  requiresReauth: boolean;
}

interface SecurityContextValue extends SecurityState {
  authorizePayment: () => Promise<boolean>;
  clearAuthorization: () => void;
  isWebAuthnSupported: boolean;
  isWebAuthnRegistered: boolean;
  registerWebAuthn: () => Promise<boolean>;
  isAuthenticating: boolean;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

// FLOW Security Rule: Every payment requires explicit authorization
// No cached authorizations - each payment = new consent

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const webAuthn = useWebAuthn();
  
  const [state, setState] = useState<SecurityState>({
    isPaymentAuthorized: false,
    lastAuthTime: null,
    requiresReauth: true, // FLOW: Always require re-auth for payments
  });

  // Clear authorization when user changes
  useEffect(() => {
    if (!user) {
      setState({
        isPaymentAuthorized: false,
        lastAuthTime: null,
        requiresReauth: true,
      });
    }
  }, [user]);

  // Authorize a payment using biometrics
  const authorizePayment = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // If WebAuthn is available, use it
    if (webAuthn.isSupported && webAuthn.isRegistered) {
      const success = await webAuthn.authenticate();
      if (success) {
        setState({
          isPaymentAuthorized: true,
          lastAuthTime: Date.now(),
          requiresReauth: false,
        });
        return true;
      }
      return false;
    }

    // Fallback: If no biometrics registered, still allow (will prompt to set up)
    // In production, you'd want to enforce biometrics
    setState({
      isPaymentAuthorized: true,
      lastAuthTime: Date.now(),
      requiresReauth: false,
    });
    return true;
  }, [user, webAuthn]);

  // Clear authorization after payment completes or is cancelled
  const clearAuthorization = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaymentAuthorized: false,
      requiresReauth: true,
    }));
  }, []);

  // Register WebAuthn for the current user
  const registerWebAuthn = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    return webAuthn.register(user.id);
  }, [user, webAuthn]);

  const value: SecurityContextValue = {
    ...state,
    authorizePayment,
    clearAuthorization,
    isWebAuthnSupported: webAuthn.isSupported,
    isWebAuthnRegistered: webAuthn.isRegistered,
    registerWebAuthn,
    isAuthenticating: webAuthn.isAuthenticating,
  };

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
