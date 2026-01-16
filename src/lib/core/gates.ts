/**
 * FLOW Core Gates
 * 
 * Security gates that must pass before intent creation/resolution.
 * These are the fundamental access control rules.
 * 
 * In Prototype mode, gates are more permissive to allow smooth demos.
 */

import { supabase } from '@/integrations/supabase/client';

export interface GateResult {
  passed: boolean;
  blockedReason?: string;
  blockedCode?: 'IDENTITY_BLOCKED' | 'DEVICE_UNTRUSTED' | 'CONSENT_MISSING' | 'CONSENT_REVOKED' | 'CONSENT_EXPIRED';
}

/**
 * Check if we're in prototype mode
 */
function isPrototypeMode(): boolean {
  try {
    return localStorage.getItem('flow_test_mode') !== 'field_test';
  } catch {
    return true; // Default to prototype if localStorage unavailable
  }
}

/**
 * Global Identity Gate
 * Block if Users.identity_status ≠ active
 * In prototype mode, auto-pass if user exists
 */
export async function checkIdentityGate(userId: string): Promise<GateResult> {
  const { data: user, error } = await supabase
    .from('users')
    .select('identity_status')
    .eq('id', userId)
    .maybeSingle();

  if (error || !user) {
    // In prototype mode, allow if we have a userId
    if (isPrototypeMode()) {
      return { passed: true };
    }
    return {
      passed: false,
      blockedReason: 'Unable to verify identity',
      blockedCode: 'IDENTITY_BLOCKED',
    };
  }

  if (user.identity_status !== 'active') {
    // In prototype mode, auto-pass
    if (isPrototypeMode()) {
      return { passed: true };
    }
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
 * In prototype mode, auto-trust the device
 */
export async function checkDeviceTrustGate(userId: string, deviceId: string): Promise<GateResult> {
  // In prototype mode, always pass and ensure device is trusted
  if (isPrototypeMode()) {
    // Check if device exists first
    const { data: existingDevice } = await supabase
      .from('trusted_devices')
      .select('id')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .maybeSingle();
    
    if (!existingDevice) {
      // Insert new trusted device
      await supabase
        .from('trusted_devices')
        .insert({
          user_id: userId,
          device_id: deviceId,
          trusted: true,
          last_seen_at: new Date().toISOString(),
        });
    } else {
      // Update existing device
      await supabase
        .from('trusted_devices')
        .update({ 
          trusted: true,
          last_seen_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('device_id', deviceId);
    }
    
    return { passed: true };
  }

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
