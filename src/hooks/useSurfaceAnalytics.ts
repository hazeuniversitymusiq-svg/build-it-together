/**
 * Surface Analytics Hook
 * 
 * Centralized logging for payment surface invocations.
 * Records surface_type and updates last_used_at.
 * Does NOT affect resolution logic - surfaces are for insight only.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PaymentSurfaceType = Database['public']['Enums']['payment_surface_type'];

interface SurfaceLogResult {
  success: boolean;
  error?: string;
}

/**
 * Log a surface invocation without affecting any business logic
 */
export const logSurfaceUsage = async (
  userId: string,
  surfaceType: PaymentSurfaceType
): Promise<SurfaceLogResult> => {
  try {
    // Check if surface record exists
    const { data: existing } = await supabase
      .from('payment_surfaces')
      .select('id')
      .eq('user_id', userId)
      .eq('surface_type', surfaceType)
      .maybeSingle();

    if (existing) {
      // Update last_used_at
      const { error } = await supabase
        .from('payment_surfaces')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) {
        console.warn('Failed to update surface usage:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new surface record
      const { error } = await supabase
        .from('payment_surfaces')
        .insert({
          user_id: userId,
          surface_type: surfaceType,
          enabled: true,
          last_used_at: new Date().toISOString(),
        });

      if (error) {
        console.warn('Failed to log surface usage:', error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    // Logging failures should never block user flow
    console.warn('Surface analytics error:', error);
    return { success: false, error: 'Unexpected error' };
  }
};

/**
 * Hook for surface analytics
 * Provides a memoized function to log surface usage
 */
export const useSurfaceAnalytics = () => {
  const logUsage = useCallback(async (surfaceType: PaymentSurfaceType) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Silent fail - user not logged in
      return { success: false, error: 'User not authenticated' };
    }

    return logSurfaceUsage(user.id, surfaceType);
  }, []);

  return { logUsage };
};

export default useSurfaceAnalytics;
