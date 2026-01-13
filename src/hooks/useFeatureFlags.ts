/**
 * Feature Flags Hook
 * 
 * Simple per-user feature flag management.
 * Used to gate Flow Card and other future features.
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

export function useFeatureFlags() {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    if (!user?.id) {
      setFlags(DEFAULT_FLAGS);
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
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const setFlag = useCallback(async (flagName: FeatureFlagName, enabled: boolean) => {
    if (!user?.id) return false;

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

      setFlags((prev) => ({ ...prev, [flagName]: enabled }));
      return true;
    } catch (err) {
      console.error('Error setting feature flag:', err);
      return false;
    }
  }, [user?.id]);

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
