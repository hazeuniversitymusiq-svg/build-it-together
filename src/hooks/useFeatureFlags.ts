/**
 * Feature Flags Hook
 * 
 * Simple per-user feature flag management.
 * Used to gate Flow Card and other future features.
 * 
 * Supports both authenticated users (database) and
 * unauthenticated/test mode (localStorage).
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Known feature flags
export type FeatureFlagName = 
  | 'flow_card_enabled'
  | 'flow_card_network_enabled'
  | 'flow_card_push_provisioning_enabled';

interface FeatureFlags {
  flow_card_enabled: boolean;
  flow_card_network_enabled: boolean;
  flow_card_push_provisioning_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  flow_card_enabled: false,
  flow_card_network_enabled: false,
  flow_card_push_provisioning_enabled: false,
};

const LOCAL_STORAGE_KEY = 'flow_feature_flags';

// Helper to read from localStorage
function getLocalFlags(): FeatureFlags {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_FLAGS;
}

// Helper to write to localStorage
function setLocalFlags(flags: FeatureFlags): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // Ignore storage errors
  }
}

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(() => getLocalFlags());
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    // If no authenticated user, use localStorage
    if (!user?.id) {
      setFlags(getLocalFlags());
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('flag_name, enabled')
        .eq('user_id', user.id);

      if (error) throw error;

      const fetchedFlags = { ...DEFAULT_FLAGS };
      data?.forEach((row) => {
        if (row.flag_name in fetchedFlags) {
          fetchedFlags[row.flag_name as FeatureFlagName] = row.enabled;
        }
      });

      setFlags(fetchedFlags);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      // Fallback to localStorage on error
      setFlags(getLocalFlags());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const setFlag = useCallback(async (flagName: FeatureFlagName, enabled: boolean) => {
    // Optimistically update state
    const newFlags = { ...flags, [flagName]: enabled };
    setFlags(newFlags);
    
    // Always persist to localStorage (for test mode)
    setLocalFlags(newFlags);

    // If authenticated, also persist to database
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('feature_flags')
          .upsert({
            user_id: user.id,
            flag_name: flagName,
            enabled,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,flag_name',
          });

        if (error) throw error;
        return true;
      } catch (err) {
        console.error('Error setting feature flag:', err);
        return false;
      }
    }
    
    return true;
  }, [user?.id, flags]);

  const isEnabled = useCallback((flagName: FeatureFlagName): boolean => {
    return flags[flagName] ?? false;
  }, [flags]);

  return {
    flags,
    loading,
    setFlag,
    isEnabled,
    refetch: fetchFlags,
    // Convenience accessors
    isFlowCardEnabled: flags.flow_card_enabled,
    isNetworkEnabled: flags.flow_card_network_enabled,
    isProvisioningEnabled: flags.flow_card_push_provisioning_enabled,
  };
}
