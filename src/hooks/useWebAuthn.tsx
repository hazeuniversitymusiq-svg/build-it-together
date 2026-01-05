import { useState, useCallback } from 'react';

// WebAuthn credential storage key
const CREDENTIAL_KEY = 'flow_webauthn_credential';

interface WebAuthnState {
  isSupported: boolean;
  isRegistered: boolean;
  isAuthenticating: boolean;
  error: string | null;
}

export function useWebAuthn() {
  const [state, setState] = useState<WebAuthnState>({
    isSupported: typeof window !== 'undefined' && 
      !!window.PublicKeyCredential &&
      typeof window.PublicKeyCredential === 'function',
    isRegistered: typeof window !== 'undefined' && 
      !!localStorage.getItem(CREDENTIAL_KEY),
    isAuthenticating: false,
    error: null,
  });

  // Generate a random challenge
  const generateChallenge = useCallback(() => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array;
  }, []);

  // Register a new credential (called once during onboarding)
  const register = useCallback(async (userId: string): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'WebAuthn is not supported on this device' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

      const challenge = generateChallenge();
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'FLOW',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: `flow-user-${userId.slice(0, 8)}`,
          displayName: 'FLOW User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Use device biometrics
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        // Store credential ID for future authentication
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(CREDENTIAL_KEY, credentialId);
        
        setState(prev => ({ 
          ...prev, 
          isRegistered: true, 
          isAuthenticating: false 
        }));
        return true;
      }

      setState(prev => ({ ...prev, isAuthenticating: false }));
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Biometric registration failed';
      setState(prev => ({ 
        ...prev, 
        isAuthenticating: false, 
        error: message 
      }));
      return false;
    }
  }, [state.isSupported, generateChallenge]);

  // Authenticate using stored credential (called for payment confirmation)
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'WebAuthn is not supported on this device' }));
      return false;
    }

    const storedCredentialId = localStorage.getItem(CREDENTIAL_KEY);
    
    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

      const challenge = generateChallenge();

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'required',
        allowCredentials: storedCredentialId ? [{
          id: Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        }] : [],
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        setState(prev => ({ ...prev, isAuthenticating: false }));
        return true;
      }

      setState(prev => ({ ...prev, isAuthenticating: false }));
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Biometric authentication failed';
      setState(prev => ({ 
        ...prev, 
        isAuthenticating: false, 
        error: message 
      }));
      return false;
    }
  }, [state.isSupported, generateChallenge]);

  // Clear stored credentials
  const clearCredentials = useCallback(() => {
    localStorage.removeItem(CREDENTIAL_KEY);
    setState(prev => ({ ...prev, isRegistered: false }));
  }, []);

  return {
    ...state,
    register,
    authenticate,
    clearCredentials,
  };
}
