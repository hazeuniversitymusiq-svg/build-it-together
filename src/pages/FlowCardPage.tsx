/**
 * Flow Card Page
 * 
 * Main Flow Card home screen with card preview, status, and quick actions.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  History, 
  Smartphone, 
  Pause, 
  Play,
  Zap,
  Shield,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FlowCardVisual } from '@/components/flowcard/FlowCardVisual';
import { CreateFlowCardFlow } from '@/components/flowcard/CreateFlowCardFlow';
import { FlowCardEventItem } from '@/components/flowcard/FlowCardEventItem';
import { useToast } from '@/hooks/use-toast';

export default function FlowCardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFlowCardEnabled, isNetworkEnabled } = useFeatureFlags();
  const {
    profile,
    provisioning,
    loading,
    hasCard,
    hasCredentials,
    isCardActive,
    isCardSuspended,
    pendingEvents,
    recentApproved,
    eligibleSources,
    simulateTerminalTap,
    generateCredentials,
    approveEvent,
    declineEvent,
    suspendCard,
    reactivateCard,
  } = useFlowCard();

  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Feature flag check
  if (!isFlowCardEnabled && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Flow Card is not enabled</p>
          <Button 
            variant="link" 
            onClick={() => navigate('/settings')}
            className="mt-2"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  // Show create flow
  if (showCreateFlow || (!hasCard && !loading)) {
    return (
      <CreateFlowCardFlow
        onComplete={() => setShowCreateFlow(false)}
        onCancel={() => {
          setShowCreateFlow(false);
          navigate('/home');
        }}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-aurora-blue/30 border-t-aurora-blue rounded-full"
        />
      </div>
    );
  }

  const handleSimulateTap = async () => {
    setIsSimulating(true);
    const amount = Math.floor(Math.random() * 100) + 10;
    const merchant = ['Coffee Shop', 'Grocery Store', 'Restaurant', 'Gas Station'][Math.floor(Math.random() * 4)];
    
    const result = await simulateTerminalTap(amount, merchant, 'retail');
    setIsSimulating(false);

    if (result.success) {
      toast({
        title: 'Bank Auth Request Received',
        description: `RM ${amount.toFixed(2)} at ${merchant} - Confirm below`,
      });
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (eventId: string) => {
    const success = await approveEvent(eventId);
    if (success) {
      toast({
        title: 'Payment Approved',
        description: 'Transaction completed successfully',
      });
    }
  };

  const handleDecline = async (eventId: string) => {
    const success = await declineEvent(eventId);
    if (success) {
      toast({
        title: 'Payment Declined',
        description: 'Transaction was declined',
      });
    }
  };

  const handleToggleSuspend = async () => {
    if (isCardSuspended) {
      const success = await reactivateCard();
      if (success) {
        toast({ title: 'Flow Card Reactivated' });
      }
    } else {
      const success = await suspendCard();
      if (success) {
        toast({ title: 'Flow Card Suspended' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="p-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Flow Card</h1>
            <p className="text-sm text-muted-foreground">
              Your payment identity
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/flow-card/activity')}
          >
            <History size={20} />
          </Button>
        </div>

        {/* Card Visual with Credentials */}
        <FlowCardVisual
          status={profile?.status || 'not_created'}
          mode={profile?.mode || 'in_app'}
          lastFourDigits={profile?.card_last_four || undefined}
          cardNumber={profile?.card_number}
          cardCvv={profile?.card_cvv}
          cardExpiry={profile?.card_expiry}
          cardBrand={profile?.card_brand}
          showCredentials={true}
        />

        {/* Generate Credentials Button (for legacy cards) */}
        {hasCard && !hasCredentials && isCardActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <Button
              className="w-full h-12 rounded-xl aurora-gradient text-white"
              onClick={async () => {
                setIsGenerating(true);
                const success = await generateCredentials();
                setIsGenerating(false);
                if (success) {
                  toast({
                    title: 'Card Credentials Generated',
                    description: 'Your virtual card is ready for Apple Pay / Google Pay',
                  });
                }
              }}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Plus size={18} className="mr-2" />
                  Generate Card Credentials
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={handleToggleSuspend}
          >
            {isCardSuspended ? (
              <>
                <Play size={18} className="mr-2" />
                Reactivate
              </>
            ) : (
              <>
                <Pause size={18} className="mr-2" />
                Suspend
              </>
            )}
          </Button>
          
          <Button
            className="flex-1 h-12 rounded-xl aurora-gradient text-white"
            onClick={handleSimulateTap}
            disabled={!isCardActive || isSimulating}
          >
            {isSimulating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              <>
                <Building2 size={18} className="mr-2" />
                Bank Auth Demo
              </>
            )}
          </Button>
        </div>

        {/* Demo Explainer */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Demo Mode:</strong> Simulates bank partner sending auth request → Flow decides funding source → Approve/Decline
          </p>
        </div>
      </div>

      {/* Pending Events */}
      {pendingEvents.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Pending Confirmation
          </h2>
          <div className="space-y-3">
            {pendingEvents.map((event) => (
              <FlowCardEventItem
                key={event.id}
                event={event}
                onApprove={() => handleApprove(event.id)}
                onDecline={() => handleDecline(event.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentApproved.length > 0 && (
        <div className="px-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Recent Activity
            </h2>
            <Button 
              variant="link" 
              size="sm" 
              className="text-xs"
              onClick={() => navigate('/flow-card/activity')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentApproved.slice(0, 3).map((event) => (
              <FlowCardEventItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Linked Sources */}
      <div className="px-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Linked Sources ({eligibleSources.length})
        </h2>
        <div className="glass-card rounded-xl divide-y divide-border">
          {eligibleSources.length > 0 ? (
            eligibleSources.map((source, idx) => (
              <div key={source.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{source.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                </div>
                <span className="text-sm text-muted-foreground">
                  RM {source.balance.toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No linked sources</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                Link a source
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bank Partnership Status */}
      {isNetworkEnabled && provisioning && (
        <div className="px-6 mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Tap-to-Pay Status
          </h2>
          <div className="glass-card rounded-xl p-4">
            {/* Partnership Notice */}
            <div className="flex items-start gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-aurora-blue/20 flex items-center justify-center flex-shrink-0">
                <Shield size={16} className="text-aurora-blue" />
              </div>
              <div>
                <p className="text-sm font-medium">Bank Partner Required</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap-to-pay requires a bank partner to issue card credentials and handle Apple/Google Pay verification.
                </p>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Apple Pay</p>
                  <p className="text-xs text-muted-foreground">
                    {provisioning.apple_status === 'ready' 
                      ? 'Awaiting Partner Activation' 
                      : provisioning.apple_status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Partner Required
              </span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Google Pay</p>
                  <p className="text-xs text-muted-foreground">
                    {provisioning.google_status === 'ready' 
                      ? 'Awaiting Partner Activation' 
                      : provisioning.google_status.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Partner Required
              </span>
            </div>

            {/* How it works */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                With a bank partner, Flow Card becomes a tap-to-pay card that routes payments through your preferred sources automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
