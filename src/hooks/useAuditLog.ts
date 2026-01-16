/**
 * Audit Logging Hook
 * 
 * Client-side interface for creating audit log entries.
 * Ensures all significant actions are recorded for compliance.
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AuditAction = 
  | 'intent.created'
  | 'intent.authorized'
  | 'plan.resolved'
  | 'payment.executed'
  | 'payment.failed'
  | 'payment.cancelled'
  | 'auth.login'
  | 'auth.logout'
  | 'biometric.registered'
  | 'biometric.verified'
  | 'settings.changed'
  | 'funding.linked'
  | 'funding.unlinked';

type EntityType = 
  | 'intent'
  | 'plan'
  | 'transaction'
  | 'user'
  | 'funding_source'
  | 'connector';

interface AuditLogEntry {
  auditAction: AuditAction;
  entityType: EntityType;
  entityId?: string;
  payload?: Record<string, unknown>;
  riskScore?: number;
}

export function useAuditLog() {
  // Log an action
  const log = useCallback(async (entry: AuditLogEntry): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('audit-log', {
        body: {
          action: 'log',
          ...entry,
        },
      });

      if (error) {
        // Audit logging is non-critical - log silently and don't block user flows
        console.warn('[FLOW] Audit log skipped:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      // Network errors in native apps are common - fail silently
      console.warn('[FLOW] Audit log unavailable');
      return false;
    }
  }, []);

  // Query audit logs
  const query = useCallback(async (options: {
    entityType?: EntityType;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: {
          action: 'query',
          ...options,
        },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Audit log query error:', err);
      return { logs: [], total: 0 };
    }
  }, []);

  // Verify chain integrity
  const verifyChain = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('audit-log', {
        body: { action: 'verify_chain' },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Chain verification error:', err);
      return { valid: false, error: 'Verification failed' };
    }
  }, []);

  return {
    log,
    query,
    verifyChain,
  };
}
