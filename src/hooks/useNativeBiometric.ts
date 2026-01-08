/**
 * Native Biometric Hook - Uses Capacitor native FaceID/TouchID
 * 
 * Falls back to WebAuthn on web.
 * FLOW Security: Every payment requires biometric confirmation.
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Dynamic import to avoid errors on web
let NativeBiometric: typeof import('@capgo/capacitor-native-biometric').NativeBiometric | null = null;

if (Capacitor.isNativePlatform()) {
  import('@capgo/capacitor-native-biometric').then(module => {
    NativeBiometric = module.NativeBiometric;
  });
}

interface NativeBiometricState {
  isAvailable: boolean;
  biometryType: 'touchId' | 'faceId' | 'fingerprintAuthentication' | 'irisAuthentication' | 'none';
  isAuthenticating: boolean;
  error: string | null;
}

export function useNativeBiometric() {
  const [state, setState] = useState<NativeBiometricState>({
    isAvailable: false,
    biometryType: 'none',
    isAuthenticating: false,
    error: null,
  });

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      if (!Capacitor.isNativePlatform()) {
        // On web, not available - will fall back to WebAuthn
        setState(prev => ({ ...prev, isAvailable: false, biometryType: 'none' }));
        return;
      }

      try {
        // Wait for dynamic import
        const { NativeBiometric: NB } = await import('@capgo/capacitor-native-biometric');
        const result = await NB.isAvailable();
        
        setState(prev => ({
          ...prev,
          isAvailable: result.isAvailable,
          biometryType: (result.biometryType as unknown) as NativeBiometricState['biometryType'],
        }));
      } catch (error) {
        console.error('Native biometric check failed:', error);
        setState(prev => ({ ...prev, isAvailable: false }));
      }
    };

    checkAvailability();
  }, []);

  // Authenticate using native biometrics
  const authenticate = useCallback(async (reason?: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, error: 'Native biometrics not available on web' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

      const { NativeBiometric: NB } = await import('@capgo/capacitor-native-biometric');
      
      await NB.verifyIdentity({
        reason: reason || 'Confirm payment with FLOW',
        title: 'FLOW Security',
        subtitle: 'Authenticate to continue',
        description: 'Use biometrics to confirm this action',
        maxAttempts: 3,
        useFallback: false, // Don't fall back to device passcode
      });

      setState(prev => ({ ...prev, isAuthenticating: false }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Biometric authentication failed';
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // Store credentials securely (for future use with server verification)
  const storeCredentials = useCallback(async (
    server: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const { NativeBiometric: NB } = await import('@capgo/capacitor-native-biometric');
      await NB.setCredentials({
        server,
        username,
        password,
      });
      return true;
    } catch (error) {
      console.error('Failed to store credentials:', error);
      return false;
    }
  }, []);

  // Get stored credentials
  const getCredentials = useCallback(async (server: string): Promise<{ username: string; password: string } | null> => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const { NativeBiometric: NB } = await import('@capgo/capacitor-native-biometric');
      const credentials = await NB.getCredentials({ server });
      return credentials;
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }, []);

  // Delete stored credentials
  const deleteCredentials = useCallback(async (server: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const { NativeBiometric: NB } = await import('@capgo/capacitor-native-biometric');
      await NB.deleteCredentials({ server });
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    isNative: Capacitor.isNativePlatform(),
    authenticate,
    storeCredentials,
    getCredentials,
    deleteCredentials,
  };
}
