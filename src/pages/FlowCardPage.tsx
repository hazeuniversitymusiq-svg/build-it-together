/**
 * Flow Card Page
 * 
 * Clean, focused card view with credentials and pending events only.
 * Demo actions registered with Global Demo Intelligence.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FlowCardVisual } from '@/components/flowcard/FlowCardVisual';
import { CreateFlowCardFlow } from '@/components/flowcard/CreateFlowCardFlow';
import { FlowCardEventItem } from '@/components/flowcard/FlowCardEventItem';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/contexts/DemoContext';
import { DemoHighlight } from '@/components/demo/DemoHighlight';

export default function FlowCardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFlowCardEnabled } = useFeatureFlags();
  const { registerPageAction, clearPageActions, isDemoMode } = useDemo();
  const {
    profile,
    loading,
    hasCard,
    hasCredentials,
    isCardActive,
    isCardSuspended,
    pendingEvents,
    simulateTerminalTap,
    generateCredentials,
    approveEvent,
    declineEvent,
    suspendCard,
    reactivateCard,
  } = useFlowCard();

  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Register demo action for this page
  useEffect(() => {
    if (isCardActive) {
      registerPageAction({
        id: 'flow-card-simulate-tap',
        label: 'Simulate Tap Payment',
        description: 'Simulate a contactless payment at a terminal',
        action: async () => {
          const amount = Math.floor(Math.random() * 100) + 10;
          const merchants = ['Coffee Shop', 'Grocery Store', 'Restaurant', 'Gas Station'];
          const merchant = merchants[Math.floor(Math.random() * merchants.length)];
          
          const result = await simulateTerminalTap(amount, merchant, 'retail');

          if (result.success) {
            toast({
              title: 'Tap Simulated',
              description: `RM ${amount.toFixed(2)} at ${merchant}`,
            });
          } else {
            toast({
              title: 'Error',
              description: result.error,
              variant: 'destructive',
            });
          }
        },
      });
    }

    return () => {
      clearPageActions();
    };
  }, [isCardActive, registerPageAction, clearPageActions, simulateTerminalTap, toast]);

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
          {/* Subtle suspend/reactivate icon */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleToggleSuspend}
            className="text-muted-foreground hover:text-foreground"
          >
            {isCardSuspended ? <Play size={20} /> : <Pause size={20} />}
          </Button>
        </div>

        {/* Card Visual with Credentials */}
        <DemoHighlight
          id="flow-card-visual"
          title="Your Flow Card"
          description="This is your virtual payment card. Tap to pay at any terminal that accepts contactless payments."
          onTryIt={async () => {
            if (isCardActive) {
              const amount = Math.floor(Math.random() * 50) + 10;
              await simulateTerminalTap(amount, 'Demo Merchant', 'retail');
              toast({ title: 'Tap Simulated', description: `RM ${amount.toFixed(2)} payment` });
            }
          }}
        >
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
        </DemoHighlight>

        {/* Generate Credentials Button (for legacy cards without credentials) */}
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
                    description: 'Your virtual card is ready',
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
                  Generate Credentials
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>

      {/* Pending Events - Only shown when there are pending confirmations */}
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
    </div>
  );
}
