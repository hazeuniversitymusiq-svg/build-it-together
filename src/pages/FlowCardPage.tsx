/**
 * Flow Card Page
 * 
 * Clean, minimal interface focused on the Flow Card visual.
 * All secondary elements are tucked away or shown only when relevant.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pause, Play, Settings, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useFlowCardEligibility } from '@/hooks/useFlowCardEligibility';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { FlowCardVisual } from '@/components/flowcard/FlowCardVisual';
import { CreateFlowCardFlow } from '@/components/flowcard/CreateFlowCardFlow';
import { FlowCardEventItem } from '@/components/flowcard/FlowCardEventItem';
import { CompactTapDemo } from '@/components/flowcard/CompactTapDemo';
import { useToast } from '@/hooks/use-toast';
import { useDemo } from '@/contexts/DemoContext';

export default function FlowCardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFlowCardEnabled } = useFeatureFlags();
  const { registerPageAction, clearPageActions } = useDemo();
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
  const eligibility = useFlowCardEligibility();

  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPendingEvents, setShowPendingEvents] = useState(true);

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
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
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
    <div className="min-h-screen bg-background pb-32 safe-area-top">
      {/* Minimal Header */}
      <div className="p-6 pt-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Flow Card</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleToggleSuspend}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            {isCardSuspended ? <Play size={18} /> : <Pause size={18} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/settings')}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>

      {/* Value Proposition */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 mb-6"
      >
        <div className="flex items-center justify-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles size={14} className="text-primary" />
          </motion.div>
          <p className="text-muted-foreground text-sm text-center leading-relaxed">
            Smart Tap-to-Pay — one card, all your wallets
          </p>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Sparkles size={14} className="text-primary" />
          </motion.div>
        </div>
      </motion.div>

      {/* Card Visual - Hero Element */}
      <div className="px-6">
        <FlowCardVisual
          status={profile?.status || 'not_created'}
          mode={profile?.mode || 'in_app'}
          lastFourDigits={profile?.card_last_four || undefined}
          cardNumber={profile?.card_number}
          cardCvv={profile?.card_cvv}
          cardExpiry={profile?.card_expiry}
          cardBrand={profile?.card_brand}
          showCredentials={true}
          isCompact={false}
        />
      </div>

      {/* Compact Demo - Only show when card is active */}
      {isCardActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 mt-4"
        >
          <CompactTapDemo />
        </motion.div>
      )}

      {/* Generate Credentials Button (for legacy cards without credentials) */}
      {hasCard && !hasCredentials && isCardActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 mt-6"
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

      {/* Pending Events - Collapsible, only when present */}
      <AnimatePresence>
        {pendingEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="px-6 mt-6"
          >
            <button
              onClick={() => setShowPendingEvents(!showPendingEvents)}
              className="w-full flex items-center justify-between py-2 text-sm font-medium text-foreground"
            >
              <span className="flex items-center gap-2">
                Pending ({pendingEvents.length})
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              </span>
              {showPendingEvents ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <AnimatePresence>
              {showPendingEvents && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {pendingEvents.map((event) => (
                    <FlowCardEventItem
                      key={event.id}
                      event={event}
                      onApprove={() => handleApprove(event.id)}
                      onDecline={() => handleDecline(event.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
