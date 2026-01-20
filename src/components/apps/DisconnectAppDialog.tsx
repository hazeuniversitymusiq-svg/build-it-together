/**
 * Disconnect App Dialog
 * 
 * Consent revocation flow that:
 * - Shows what data will be removed
 * - Updates consents.status to 'revoked'
 * - Removes cached_balances for the connector
 * - Updates connector status to 'unavailable'
 * - Updates funding_sources linked_status to 'unlinked'
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Shield,
  Trash2,
  X,
  Check,
  Loader2,
  Unlink,
  Database,
  Key,
  Wallet
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';

interface DisconnectAppDialogProps {
  app: {
    id: string;
    name: string;
    type: string;
    connectorId?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onDisconnected: () => void;
}

type DisconnectStep = 'confirm' | 'processing' | 'success' | 'error';

interface RevocationResult {
  consentRevoked: boolean;
  cachedBalancesRemoved: number;
  connectorUpdated: boolean;
  fundingSourceUnlinked: boolean;
}

export function DisconnectAppDialog({ 
  app, 
  open, 
  onClose, 
  onDisconnected 
}: DisconnectAppDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<DisconnectStep>('confirm');
  const [result, setResult] = useState<RevocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = useCallback(async () => {
    if (!app) return;
    
    setStep('processing');
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const revocationResult: RevocationResult = {
        consentRevoked: false,
        cachedBalancesRemoved: 0,
        connectorUpdated: false,
        fundingSourceUnlinked: false,
      };

      // 1. Find the connector by name (cast to any for dynamic name lookup)
      const { data: connector } = await supabase
        .from('connectors')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', app.name as any)
        .single();

      const connectorId = connector?.id || app.connectorId;

      if (connectorId) {
        // 2. Revoke consent - update status to 'revoked'
        const { error: consentError } = await supabase
          .from('consents')
          .update({ status: 'revoked' })
          .eq('connector_id', connectorId)
          .eq('user_id', user.id);

        if (!consentError) {
          revocationResult.consentRevoked = true;
        }

        // 3. Remove cached balances for this connector
        const { data: deletedBalances } = await supabase
          .from('cached_balances')
          .delete()
          .eq('connector_id', connectorId)
          .eq('user_id', user.id)
          .select('id');

        revocationResult.cachedBalancesRemoved = deletedBalances?.length || 0;

        // 4. Update connector status to 'unavailable'
        const { error: connectorError } = await supabase
          .from('connectors')
          .update({ 
            status: 'unavailable',
            last_sync_at: null,
            last_verified_at: null,
          })
          .eq('id', connectorId)
          .eq('user_id', user.id);

        if (!connectorError) {
          revocationResult.connectorUpdated = true;
        }
      }

      // 5. Update funding source to unlinked
      const { error: fundingError } = await supabase
        .from('funding_sources')
        .update({ 
          linked_status: 'unlinked',
          available: false,
        })
        .eq('name', app.name)
        .eq('user_id', user.id);

      if (!fundingError) {
        revocationResult.fundingSourceUnlinked = true;
      }

      // Record audit log
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'consent_revoked',
        entity_type: 'connector',
        entity_id: connectorId || undefined,
        payload: {
          app_name: app.name,
          consent_revoked: revocationResult.consentRevoked,
          cached_balances_removed: revocationResult.cachedBalancesRemoved,
          connector_updated: revocationResult.connectorUpdated,
          funding_source_unlinked: revocationResult.fundingSourceUnlinked,
        },
        current_hash: '', // Will be computed by trigger
      }]);

      setResult(revocationResult);
      setStep('success');

    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect app');
      setStep('error');
    }
  }, [app]);

  const handleClose = useCallback(() => {
    if (step === 'success') {
      onDisconnected();
    }
    setStep('confirm');
    setResult(null);
    setError(null);
    onClose();
  }, [step, onClose, onDisconnected]);

  if (!app) return null;

  const IconComponent = getBrandedIcon(app.name, app.type);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-3xl max-w-sm p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Confirm Step */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <Unlink className="w-8 h-8 text-destructive" />
                </div>
                <DialogTitle className="text-xl">Disconnect {app.name}?</DialogTitle>
                <DialogDescription className="mt-2">
                  This will revoke FLOW's access to this app
                </DialogDescription>
              </DialogHeader>

              {/* What will be removed */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  What will be removed
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Key className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">OAuth Permission</p>
                      <p className="text-xs text-muted-foreground">Access consent will be revoked</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Database className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Cached Balance</p>
                      <p className="text-xs text-muted-foreground">Stored balance data will be deleted</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment Source</p>
                      <p className="text-xs text-muted-foreground">Will be unlinked from FLOW</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    You can reconnect anytime from the Apps page. Your transaction history will be preserved.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="flex-1 h-12 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <IconComponent size={32} />
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <p className="font-semibold">Disconnecting...</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Revoking permissions and cleaning up data
              </p>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && result && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-success" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-1">Disconnected</h3>
                <p className="text-sm text-muted-foreground">
                  {app.name} has been unlinked from FLOW
                </p>
              </div>

              {/* Results Summary */}
              <div className="space-y-2 mb-6">
                {result.consentRevoked && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Consent revoked</span>
                  </div>
                )}
                {result.cachedBalancesRemoved > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Cached balance removed</span>
                  </div>
                )}
                {result.connectorUpdated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Connection disabled</span>
                  </div>
                )}
                {result.fundingSourceUnlinked && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Payment source unlinked</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleClose}
                className="w-full h-12 rounded-xl"
              >
                Done
              </Button>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="w-8 h-8 text-destructive" />
              </div>
              
              <h3 className="text-xl font-semibold mb-1">Disconnect Failed</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {error || 'An error occurred while disconnecting the app'}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-12 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDisconnect}
                  className="flex-1 h-12 rounded-xl"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default DisconnectAppDialog;
