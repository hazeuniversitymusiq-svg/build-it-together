/**
 * FLOW Core Gates
 * 
 * Security gates that must pass before intent creation/resolution.
 * These are the fundamental access control rules.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GateResult {
  passed: boolean;
  blockedReason?: string;
  blockedCode?: 'IDENTITY_BLOCKED' | 'DEVICE_UNTRUSTED' | 'CONSENT_MISSING' | 'CONSENT_REVOKED' | 'CONSENT_EXPIRED';
}

/**
 * Global Identity Gate
 * Block if Users.identity_status ≠ active
 */
export async function checkIdentityGate(userId: string): Promise<GateResult> {
  const { data: user, error } = await supabase
    .from('users')
    .select('identity_status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) {
    return {
      passed: false,
      blockedReason: 'Unable to verify identity',
      blockedCode: 'IDENTITY_BLOCKED',
    };
  }

  if (user.identity_status !== 'active') {
    return {
      passed: false,
      blockedReason: 'Your account is not active',
      blockedCode: 'IDENTITY_BLOCKED',
    };
  }

  return { passed: true };
}

/**
 * Device Trust Gate
 * Block if device_id is not trusted
 */
export async function checkDeviceTrustGate(userId: string, deviceId: string): Promise<GateResult> {
  const { data: device, error } = await supabase
    .from('trusted_devices')
    .select('trusted')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error || !device) {
    return {
      passed: false,
      blockedReason: 'This device is not recognized',
      blockedCode: 'DEVICE_UNTRUSTED',
    };
  }

  if (!device.trusted) {
    return {
      passed: false,
      blockedReason: 'This device is not trusted',
      blockedCode: 'DEVICE_UNTRUSTED',
    };
  }

  // Update last_seen_at
  await supabase
    .from('trusted_devices')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('device_id', deviceId);

  return { passed: true };
}

/**
 * Consent Gate
 * Validate active consent before using any connector
 */
export async function checkConsentGate(userId: string, connectorId: string): Promise<GateResult> {
  const { data: consent, error } = await supabase
    .from('consents')
    .select('status')
    .eq('user_id', userId)
    .eq('connector_id', connectorId)
    .maybeSingle();

  if (error || !consent) {
    return {
      passed: false,
      blockedReason: 'Permission required to use this payment method',
      blockedCode: 'CONSENT_MISSING',
    };
  }

  if (consent.status === 'revoked') {
    return {
      passed: false,
      blockedReason: 'Permission was revoked for this payment method',
      blockedCode: 'CONSENT_REVOKED',
    };
  }

  if (consent.status === 'expired') {
    return {
      passed: false,
      blockedReason: 'Permission has expired for this payment method',
      blockedCode: 'CONSENT_EXPIRED',
    };
  }

  return { passed: true };
}

/**
 * Combined gate check for intent creation
 * Checks identity only (device trust checked at resolution)
 */
export async function checkIntentCreationGates(userId: string): Promise<GateResult> {
  return checkIdentityGate(userId);
}

/**
 * Combined gate check for resolution
 * Checks identity + device trust
 */
export async function checkResolutionGates(userId: string, deviceId: string): Promise<GateResult> {
  const identityResult = await checkIdentityGate(userId);
  if (!identityResult.passed) return identityResult;

  const deviceResult = await checkDeviceTrustGate(userId, deviceId);
  if (!deviceResult.passed) return deviceResult;

  return { passed: true };
}
