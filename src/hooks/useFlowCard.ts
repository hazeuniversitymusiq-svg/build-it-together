/**
 * Flow Card Hook
 * 
 * Manages Flow Card profile, events, and provisioning.
 * Integrates with existing resolution engine for payment decisions.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrchestration } from '@/contexts/OrchestrationContext';

// Types
export type FlowCardStatus = 'not_created' | 'created' | 'suspended' | 'terminated';
export type FlowCardMode = 'in_app' | 'network_placeholder' | 'network_live';
export type DeviceBindingStatus = 'unbound' | 'bound' | 'rotated';
export type ProvisioningStatus = 'not_available' | 'ready' | 'pending' | 'verified' | 'provisioned' | 'failed';
export type CardEventType = 'simulate_authorisation' | 'simulate_settlement' | 'online_checkout' | 'terminal_tap';
export type CardEventStatus = 'received' | 'evaluating' | 'approved' | 'declined';

export type FlowCardTier = 'lite' | 'full';

export interface FlowCardProfile {
  id: string;
  user_id: string;
  status: FlowCardStatus;
  mode: FlowCardMode;
  device_binding_status: DeviceBindingStatus;
  last_device_id: string | null;
  card_number: string | null;
  card_cvv: string | null;
  card_expiry: string | null;
  card_last_four: string | null;
  card_brand: 'visa' | 'mastercard' | null;
  tier: FlowCardTier;
  created_at: string;
  updated_at: string;
}

// Card credential generation utilities
function generateCardNumber(): string {
  // Visa prefix: 4, generate remaining 15 digits
  const prefix = '4';
  let number = prefix;
  for (let i = 0; i < 14; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  // Luhn checksum
  let sum = 0;
  let isEven = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return number + checkDigit.toString();
}

function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generateExpiry(): string {
  const now = new Date();
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const year = String((now.getFullYear() + 3) % 100).padStart(2, '0');
  return `${month}/${year}`;
}

export interface CardPaymentEvent {
  id: string;
  user_id: string;
  event_type: CardEventType;
  event_status: CardEventStatus;
  amount: number;
  currency: string;
  merchant_name: string | null;
  merchant_category: string | null;
  device_id: string | null;
  intent_id: string | null;
  decision_json: Record<string, unknown>;
  result_json: Record<string, unknown>;
  explainability_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface CardProvisioning {
  id: string;
  user_id: string;
  apple_status: ProvisioningStatus;
  google_status: ProvisioningStatus;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export function useFlowCard() {
  const { user } = useAuth();
  const { sources, resolvePaymentRequest } = useOrchestration();
  
  const [profile, setProfile] = useState<FlowCardProfile | null>(null);
  const [provisioning, setProvisioning] = useState<CardProvisioning | null>(null);
  const [events, setEvents] = useState<CardPaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate a device ID (in real app, would use native device ID)
  const deviceId = useMemo(() => {
    const stored = localStorage.getItem('flow_device_id');
    if (stored) return stored;
    const newId = `device_${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem('flow_device_id', newId);
    return newId;
  }, []);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('flow_card_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProfile(data as FlowCardProfile | null);
    } catch (err) {
      console.error('Error fetching flow card profile:', err);
    }
  }, [user?.id]);

  // Fetch provisioning
  const fetchProvisioning = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('card_provisioning')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setProvisioning(data as CardProvisioning | null);
    } catch (err) {
      console.error('Error fetching provisioning:', err);
    }
  }, [user?.id]);

  // Fetch events
  const fetchEvents = useCallback(async (limit = 20) => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('card_payment_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      setEvents((data as CardPaymentEvent[]) || []);
    } catch (err) {
      console.error('Error fetching card events:', err);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchProvisioning(), fetchEvents()]);
      setLoading(false);
    };
    init();
  }, [fetchProfile, fetchProvisioning, fetchEvents]);

  // Create Flow Card with tier support
  const createFlowCard = useCallback(async (tier: 'lite' | 'full' = 'lite'): Promise<boolean> => {
    if (!user?.id) {
      setError('User not authenticated');
      return false;
    }

    try {
      setError(null);

      // Generate virtual card credentials
      const cardNumber = generateCardNumber();
      const cardCvv = generateCVV();
      const cardExpiry = generateExpiry();
      const cardLastFour = cardNumber.slice(-4);

      // Create profile with credentials and tier
      const { data: profileData, error: profileError } = await supabase
        .from('flow_card_profiles')
        .insert({
          user_id: user.id,
          status: 'created',
          mode: 'in_app',
          device_binding_status: 'bound',
          last_device_id: deviceId,
          card_number: cardNumber,
          card_cvv: cardCvv,
          card_expiry: cardExpiry,
          card_last_four: cardLastFour,
          card_brand: 'visa',
          tier: tier,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      setProfile(profileData as FlowCardProfile);

      // Create provisioning stub (ready for wallet linking)
      const { data: provData, error: provError } = await supabase
        .from('card_provisioning')
        .insert({
          user_id: user.id,
          apple_status: 'ready',
          google_status: 'ready',
        })
        .select()
        .single();

      if (provError) throw provError;
      setProvisioning(provData as CardProvisioning);

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create Flow Card';
      setError(message);
      console.error('Error creating Flow Card:', err);
      return false;
    }
  }, [user?.id, deviceId]);

  // Simulate terminal tap (uses existing resolution engine)
  const simulateTerminalTap = useCallback(async (
    amount: number,
    merchantName: string,
    merchantCategory?: string
  ): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    if (!user?.id || !profile || profile.status !== 'created') {
      return { success: false, error: 'Flow Card not active' };
    }

    try {
      // Create event in 'received' status
      const { data: eventData, error: eventError } = await supabase
        .from('card_payment_events')
        .insert({
          user_id: user.id,
          event_type: 'terminal_tap',
          event_status: 'received',
          amount,
          currency: 'MYR',
          merchant_name: merchantName,
          merchant_category: merchantCategory || null,
          device_id: deviceId,
        })
        .select()
        .single();

      if (eventError) throw eventError;

      const eventId = (eventData as CardPaymentEvent).id;

      // Update to evaluating
      await supabase
        .from('card_payment_events')
        .update({ event_status: 'evaluating' })
        .eq('id', eventId);

      // Use existing resolution engine with Flow Card priority chain
      const resolution = resolvePaymentRequest({
        amount,
        currency: 'MYR',
        intentId: `card_event_${eventId}`,
        merchantId: merchantName,
      }, true); // Enable Flow Card priority

      // Build decision object
      const decisionJson = {
        selected_source_id: resolution.steps[0]?.sourceId || null,
        selected_source_type: resolution.steps[0]?.sourceType || null,
        fallback_chain: resolution.steps.slice(1).map(s => s.sourceId),
        requires_confirmation: resolution.requiresConfirmation,
        action: resolution.action,
      };

      // Generate explainability
      const sourceName = resolution.steps[0]?.description || 'available source';
      const explainability = `Paid with ${sourceName}. ${resolution.confirmationReason || ''}`.trim();

      // Update event with decision (stays in evaluating - needs user confirmation)
      await supabase
        .from('card_payment_events')
        .update({
          decision_json: decisionJson,
          explainability_summary: explainability,
        })
        .eq('id', eventId);

      await fetchEvents();

      return { success: true, eventId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process tap';
      console.error('Error simulating terminal tap:', err);
      return { success: false, error: message };
    }
  }, [user?.id, profile, deviceId, resolvePaymentRequest, fetchEvents]);

  // Approve card event
  const approveEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error: updateError } = await supabase
        .from('card_payment_events')
        .update({
          event_status: 'approved',
          result_json: { approved_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Error approving event:', err);
      return false;
    }
  }, [user?.id, fetchEvents]);

  // Decline card event
  const declineEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error: updateError } = await supabase
        .from('card_payment_events')
        .update({
          event_status: 'declined',
          result_json: { declined_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;
      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Error declining event:', err);
      return false;
    }
  }, [user?.id, fetchEvents]);

  // Suspend card
  const suspendCard = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !profile) return false;

    try {
      const { error: updateError } = await supabase
        .from('flow_card_profiles')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Error suspending card:', err);
      return false;
    }
  }, [user?.id, profile, fetchProfile]);

  // Reactivate card
  const reactivateCard = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !profile || profile.status !== 'suspended') return false;

    try {
      const { error: updateError } = await supabase
        .from('flow_card_profiles')
        .update({ status: 'created', updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Error reactivating card:', err);
      return false;
    }
  }, [user?.id, profile, fetchProfile]);

  // Generate/regenerate card credentials
  const generateCredentials = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !profile) return false;

    try {
      const cardNumber = generateCardNumber();
      const cardCvv = generateCVV();
      const cardExpiry = generateExpiry();
      const cardLastFour = cardNumber.slice(-4);

      const { error: updateError } = await supabase
        .from('flow_card_profiles')
        .update({
          card_number: cardNumber,
          card_cvv: cardCvv,
          card_expiry: cardExpiry,
          card_last_four: cardLastFour,
          card_brand: 'visa',
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      await fetchProfile();
      return true;
    } catch (err) {
      console.error('Error generating credentials:', err);
      return false;
    }
  }, [user?.id, profile, fetchProfile]);

  // Computed values
  const isCardActive = profile?.status === 'created';
  const isCardSuspended = profile?.status === 'suspended';
  const hasCard = !!profile && profile.status !== 'not_created';
  const hasCredentials = !!(profile?.card_number && profile?.card_cvv && profile?.card_expiry);
  const pendingEvents = events.filter(e => e.event_status === 'evaluating');
  const recentApproved = events.filter(e => e.event_status === 'approved').slice(0, 5);

  return {
    // State
    profile,
    provisioning,
    events,
    loading,
    error,
    deviceId,
    
    // Computed
    isCardActive,
    isCardSuspended,
    hasCard,
    hasCredentials,
    pendingEvents,
    recentApproved,
    eligibleSources: sources.filter(s => s.isAvailable && s.isLinked),
    
    // Actions
    createFlowCard,
    generateCredentials,
    simulateTerminalTap,
    approveEvent,
    declineEvent,
    suspendCard,
    reactivateCard,
    refetch: () => Promise.all([fetchProfile(), fetchProvisioning(), fetchEvents()]),
  };
}
