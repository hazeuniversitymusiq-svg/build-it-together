import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebAuthn } from '@/hooks/useWebAuthn';
import { useNativeBiometric } from '@/hooks/useNativeBiometric';
import { Capacitor } from '@capacitor/core';

interface SecurityState {
  isPaymentAuthorized: boolean;
  lastAuthTime: number | null;
  requiresReauth: boolean;
  biometricMethod: 'native' | 'webauthn' | 'none';
}

interface SecurityContextValue extends SecurityState {
  authorizePayment: (reason?: string) => Promise<boolean>;
  clearAuthorization: () => void;
  isWebAuthnSupported: boolean;
  isWebAuthnRegistered: boolean;
  isNativeBiometricAvailable: boolean;
  biometryType: string;
  registerWebAuthn: () => Promise<boolean>;
  isAuthenticating: boolean;
  requiresBiometricSetup: boolean;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

// FLOW Security Rule: Every payment requires explicit authorization
// No cached authorizations - each payment = new consent
// Native biometrics preferred over WebAuthn

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const webAuthn = useWebAuthn();
  const nativeBiometric = useNativeBiometric();
  
  const [state, setState] = useState<SecurityState>({
    isPaymentAuthorized: false,
    lastAuthTime: null,
    requiresReauth: true, // FLOW: Always require re-auth for payments
    biometricMethod: 'none',
  });

  // Determine which biometric method to use
  useEffect(() => {
    if (Capacitor.isNativePlatform() && nativeBiometric.isAvailable) {
      setState(prev => ({ ...prev, biometricMethod: 'native' }));
    } else if (webAuthn.isSupported && webAuthn.isRegistered) {
      setState(prev => ({ ...prev, biometricMethod: 'webauthn' }));
    } else {
      setState(prev => ({ ...prev, biometricMethod: 'none' }));
    }
  }, [nativeBiometric.isAvailable, webAuthn.isSupported, webAuthn.isRegistered]);

  // Clear authorization when user changes
  useEffect(() => {
    if (!user) {
      setState({
        isPaymentAuthorized: false,
        lastAuthTime: null,
        requiresReauth: true,
        biometricMethod: 'none',
      });
    }
  }, [user]);

  // Check if biometric setup is required
  const requiresBiometricSetup = !Capacitor.isNativePlatform() && 
    webAuthn.isSupported && 
    !webAuthn.isRegistered;

  // Authorize a payment using biometrics (native preferred)
  const authorizePayment = useCallback(async (reason?: string): Promise<boolean> => {
    if (!user) return false;

    // FLOW Security: Require biometrics on native platforms
    if (Capacitor.isNativePlatform()) {
      if (!nativeBiometric.isAvailable) {
        // On native without biometrics, block payment
        console.warn('FLOW Security: Native biometrics required but not available');
        return false;
      }
      
      const success = await nativeBiometric.authenticate(reason || 'Confirm payment with FLOW');
      if (success) {
        setState({
          isPaymentAuthorized: true,
          lastAuthTime: Date.now(),
          requiresReauth: false,
          biometricMethod: 'native',
        });
        return true;
      }
      return false;
    }

    // Web platform: Use WebAuthn
    if (webAuthn.isSupported && webAuthn.isRegistered) {
      const success = await webAuthn.authenticate();
      if (success) {
        setState({
          isPaymentAuthorized: true,
          lastAuthTime: Date.now(),
          requiresReauth: false,
          biometricMethod: 'webauthn',
        });
        return true;
      }
      return false;
    }
    // FLOW Security: Block payments without biometrics
    // Only allow dev bypass if BOTH NODE_ENV is development AND we're on localhost
    const isLocalhost = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.local')
    );
    
    const isDevelopment = process.env.NODE_ENV === 'development' && isLocalhost;
    
    if (isDevelopment) {
      console.warn('FLOW Security: Allowing payment without biometrics (localhost development only)');
      setState({
        isPaymentAuthorized: true,
        lastAuthTime: Date.now(),
        requiresReauth: false,
        biometricMethod: 'none',
      });
      return true;
    }

    // Production or non-localhost: Require biometrics
    console.error('FLOW Security: Biometric authentication required');
    return false;
  }, [user, nativeBiometric, webAuthn]);

  // Clear authorization after payment completes or is cancelled
  const clearAuthorization = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaymentAuthorized: false,
      requiresReauth: true,
    }));
  }, []);

  // Register WebAuthn for the current user (web only)
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
    isNativeBiometricAvailable: nativeBiometric.isAvailable,
    biometryType: nativeBiometric.biometryType,
    registerWebAuthn,
    isAuthenticating: webAuthn.isAuthenticating || nativeBiometric.isAuthenticating,
    requiresBiometricSetup,
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
