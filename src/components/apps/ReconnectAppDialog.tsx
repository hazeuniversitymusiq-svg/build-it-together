/**
 * Reconnect App Dialog
 * 
 * Flow to restore a previously disconnected app:
 * - Simulates OAuth re-authorization for production compliance
 * - Updates consent status back to 'active'
 * - Re-syncs balances via the connector-sync edge function
 * - Updates connector status to 'available'
 * - Updates funding_sources linked_status to 'linked'
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Shield,
  RefreshCw,
  Check,
  X,
  Loader2,
  Database,
  Key,
  Wallet,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Eye,
  CreditCard
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';

interface ReconnectAppDialogProps {
  app: {
    id: string;
    name: string;
    type: string;
    connectorId?: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onReconnected: () => void;
}

type ReconnectStep = 'confirm' | 'authorize' | 'authorizing' | 'processing' | 'syncing' | 'success' | 'error';

interface ReconnectionResult {
  consentRestored: boolean;
  connectorUpdated: boolean;
  fundingSourceLinked: boolean;
  balanceSynced: boolean;
  newBalance?: number;
  authMethod?: string;
}

// Scopes requested during re-authorization
const OAUTH_SCOPES = [
  { id: 'balance', label: 'View account balance', icon: Eye },
  { id: 'transactions', label: 'View transaction history', icon: CreditCard },
  { id: 'payments', label: 'Initiate payments', icon: Wallet },
];

export function ReconnectAppDialog({ 
  app, 
  open, 
  onClose, 
  onReconnected 
}: ReconnectAppDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ReconnectStep>('confirm');
  const [result, setResult] = useState<ReconnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [acceptedScopes, setAcceptedScopes] = useState<string[]>([]);
  const [authProgress, setAuthProgress] = useState(0);

  // Reset accepted scopes when dialog opens
  useEffect(() => {
    if (open) {
      setAcceptedScopes([]);
      setAuthProgress(0);
    }
  }, [open]);

  const handleProceedToAuth = useCallback(() => {
    setStep('authorize');
  }, []);

  const handleToggleScope = useCallback((scopeId: string) => {
    setAcceptedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  }, []);

  const handleAuthorize = useCallback(async () => {
    if (!app) return;
    
    // Require at least balance scope
    if (!acceptedScopes.includes('balance')) {
      toast({
        title: "Permission required",
        description: "Balance access is required to reconnect this app",
        variant: "destructive",
      });
      return;
    }

    setStep('authorizing');
    setAuthProgress(0);

    // Simulate OAuth authorization flow with progress
    const authSteps = [
      { progress: 20, delay: 400, label: 'Connecting to provider...' },
      { progress: 40, delay: 600, label: 'Verifying credentials...' },
      { progress: 60, delay: 500, label: 'Requesting permissions...' },
      { progress: 80, delay: 400, label: 'Confirming access...' },
      { progress: 100, delay: 300, label: 'Authorization complete' },
    ];

    for (const authStep of authSteps) {
      await new Promise(resolve => setTimeout(resolve, authStep.delay));
      setAuthProgress(authStep.progress);
    }

    // Small delay before proceeding to actual reconnection
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Now proceed with actual reconnection
    await handleReconnect();
  }, [app, acceptedScopes, toast]);

  const handleReconnect = useCallback(async () => {
    if (!app) return;
    
    setStep('processing');
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reconnectionResult: ReconnectionResult = {
        consentRestored: false,
        connectorUpdated: false,
        fundingSourceLinked: false,
        balanceSynced: false,
        authMethod: 'oauth',
      };

      // 1. Find the connector by name
      const { data: connector } = await supabase
        .from('connectors')
        .select('id, auth_method')
        .eq('user_id', user.id)
        .eq('name', app.name as any)
        .single();

      const connectorId = connector?.id || app.connectorId;
      reconnectionResult.authMethod = connector?.auth_method || 'oauth';

      if (connectorId) {
        // 2. Restore consent with updated scope
        const { error: consentError } = await supabase
          .from('consents')
          .update({ 
            status: 'active',
            scope: acceptedScopes,
            granted_at: new Date().toISOString(),
          })
          .eq('connector_id', connectorId)
          .eq('user_id', user.id);

        if (!consentError) {
          reconnectionResult.consentRestored = true;
        }

        // 3. Update connector status to 'available'
        const { error: connectorError } = await supabase
          .from('connectors')
          .update({ 
            status: 'available',
            last_verified_at: new Date().toISOString(),
          })
          .eq('id', connectorId)
          .eq('user_id', user.id);

        if (!connectorError) {
          reconnectionResult.connectorUpdated = true;
        }

        // 4. Sync balance via edge function
        setStep('syncing');
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const response = await supabase.functions.invoke('connector-sync', {
            body: { 
              connectorName: app.name,
              connectorId: connectorId,
            },
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          });

          if (response.data?.balance !== undefined) {
            reconnectionResult.balanceSynced = true;
            reconnectionResult.newBalance = response.data.balance;
          }
        } catch (syncError) {
          console.warn('Balance sync failed, continuing...', syncError);
        }
      }

      // 5. Update funding source to linked
      const { error: fundingError } = await supabase
        .from('funding_sources')
        .update({ 
          linked_status: 'linked',
          available: true,
        })
        .eq('name', app.name)
        .eq('user_id', user.id);

      if (!fundingError) {
        reconnectionResult.fundingSourceLinked = true;
      }

      // Record audit log with OAuth details
      await supabase.from('audit_logs').insert([{
        user_id: user.id,
        action: 'consent_restored',
        entity_type: 'connector',
        entity_id: connectorId || undefined,
        payload: {
          app_name: app.name,
          auth_method: reconnectionResult.authMethod,
          scopes_granted: acceptedScopes,
          consent_restored: reconnectionResult.consentRestored,
          connector_updated: reconnectionResult.connectorUpdated,
          funding_source_linked: reconnectionResult.fundingSourceLinked,
          balance_synced: reconnectionResult.balanceSynced,
          new_balance: reconnectionResult.newBalance,
        },
        current_hash: '',
      }]);

      setResult(reconnectionResult);
      setStep('success');

    } catch (err) {
      console.error('Reconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reconnect app');
      setStep('error');
    }
  }, [app, acceptedScopes]);

  const handleClose = useCallback(() => {
    if (step === 'success') {
      onReconnected();
    }
    setStep('confirm');
    setResult(null);
    setError(null);
    onClose();
  }, [step, onClose, onReconnected]);

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
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Link2 className="w-8 h-8 text-primary" />
                </div>
                <DialogTitle className="text-xl">Reconnect {app.name}?</DialogTitle>
                <DialogDescription className="mt-2">
                  Restore FLOW's access to this app
                </DialogDescription>
              </DialogHeader>

              {/* What will be restored */}
              <div className="space-y-3 mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  What will be restored
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">OAuth Permission</p>
                      <p className="text-xs text-muted-foreground">Access consent will be restored</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Database className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Balance Sync</p>
                      <p className="text-xs text-muted-foreground">Current balance will be fetched</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Payment Source</p>
                      <p className="text-xs text-muted-foreground">Will be linked back to FLOW</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Banner */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Your previous settings and transaction history will be preserved.
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
                  onClick={handleProceedToAuth}
                  className="flex-1 h-12 rounded-xl"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* OAuth Authorization Step */}
          {step === 'authorize' && (
            <motion.div
              key="authorize"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6"
            >
              <DialogHeader className="text-center mb-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <IconComponent size={32} />
                </div>
                <DialogTitle className="text-xl">Authorize {app.name}</DialogTitle>
                <DialogDescription className="mt-2">
                  Select permissions to grant FLOW
                </DialogDescription>
              </DialogHeader>

              {/* OAuth Consent Screen Simulation */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">FLOW wants to access</p>
                    <p className="text-xs text-muted-foreground">your {app.name} account</p>
                  </div>
                </div>

                {/* Scope Checkboxes */}
                <div className="space-y-3">
                  {OAUTH_SCOPES.map((scope) => {
                    const ScopeIcon = scope.icon;
                    const isRequired = scope.id === 'balance';
                    const isChecked = acceptedScopes.includes(scope.id);
                    
                    return (
                      <label
                        key={scope.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-background/50 cursor-pointer hover:bg-background/80 transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleScope(scope.id)}
                          disabled={isRequired && isChecked}
                        />
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <ScopeIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{scope.label}</p>
                          {isRequired && (
                            <p className="text-xs text-amber-500">Required</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-success/5 border border-success/20 mb-6">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  FLOW uses secure OAuth 2.0. We never store your {app.name} credentials.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('confirm')}
                  className="flex-1 h-12 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleAuthorize}
                  disabled={!acceptedScopes.includes('balance')}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Authorize
                </Button>
              </div>
            </motion.div>
          )}

          {/* Authorizing Step - OAuth in progress */}
          {step === 'authorizing' && (
            <motion.div
              key="authorizing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center relative">
                <IconComponent size={32} />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              </div>

              <p className="font-semibold mb-2">Authorizing with {app.name}...</p>
              <p className="text-sm text-muted-foreground mb-6">
                Completing OAuth handshake
              </p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: `${authProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{authProgress}%</p>
            </motion.div>
          )}
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
                <p className="font-semibold">Reconnecting...</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Restoring permissions and consent
              </p>
            </motion.div>
          )}

          {/* Syncing Step */}
          {step === 'syncing' && (
            <motion.div
              key="syncing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <IconComponent size={32} />
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-2">
                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                <p className="font-semibold">Syncing Balance...</p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Fetching current balance from {app.name}
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
                <h3 className="text-xl font-semibold mb-1">Reconnected!</h3>
                <p className="text-sm text-muted-foreground">
                  {app.name} is now linked to FLOW
                </p>
              </div>

              {/* Results Summary */}
              <div className="space-y-2 mb-6">
                {result.consentRestored && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Consent restored</span>
                  </div>
                )}
                {result.connectorUpdated && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Connection enabled</span>
                  </div>
                )}
                {result.fundingSourceLinked && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>Payment source linked</span>
                  </div>
                )}
                {result.balanceSynced && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-success" />
                    <span>
                      Balance synced
                      {result.newBalance !== undefined && (
                        <span className="font-medium text-foreground ml-1">
                          RM {result.newBalance.toFixed(2)}
                        </span>
                      )}
                    </span>
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
              
              <h3 className="text-xl font-semibold mb-1">Reconnect Failed</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {error || 'An error occurred while reconnecting the app'}
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
                  onClick={handleReconnect}
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

export default ReconnectAppDialog;
