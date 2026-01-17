/**
 * Tap To Pay Demo
 * 
 * Complete end-to-end demo of the Flow Card tap-to-pay experience.
 * Shows the full resolution flow: tap → resolve → confirm → done.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  Store, 
  Check, 
  X, 
  Wallet, 
  ArrowRight, 
  Shield, 
  Zap,
  Building2,
  CreditCard,
  Sparkles,
  CircleDollarSign,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useOrchestration } from '@/contexts/OrchestrationContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type DemoStep = 'idle' | 'tapping' | 'resolving' | 'confirm' | 'processing' | 'success' | 'declined';

interface PaymentDetails {
  amount: number;
  merchant: string;
  category: string;
  selectedSource: {
    name: string;
    type: string;
    balance: number;
  } | null;
  topUpNeeded: boolean;
  topUpAmount: number;
  topUpSource: string | null;
}

const DEMO_MERCHANTS = [
  { name: 'Coffee Bean', category: 'Food & Beverage', icon: '☕' },
  { name: 'Petronas', category: 'Transport', icon: '⛽' },
  { name: 'AEON', category: 'Retail', icon: '🛒' },
  { name: 'Village Park', category: 'Restaurant', icon: '🍜' },
  { name: 'Grab', category: 'Transport', icon: '🚗' },
];

export function TapToPayDemo() {
  const { toast } = useToast();
  const { sources, resolvePaymentRequest, walletBalance } = useOrchestration();
  const { simulateTerminalTap, isCardActive } = useFlowCard();
  
  const [step, setStep] = useState<DemoStep>('idle');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const getRandomMerchant = () => {
    const merchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
    const amount = parseFloat((Math.random() * 80 + 5).toFixed(2));
    return { ...merchant, amount };
  };

  const startTapDemo = useCallback(async () => {
    if (!isCardActive) {
      toast({
        title: 'Card Not Active',
        description: 'Please activate your Flow Card first',
        variant: 'destructive',
      });
      return;
    }

    const merchant = getRandomMerchant();
    setStep('tapping');
    setPayment({
      amount: merchant.amount,
      merchant: merchant.name,
      category: merchant.category,
      selectedSource: null,
      topUpNeeded: false,
      topUpAmount: 0,
      topUpSource: null,
    });

    // Simulate tap animation delay
    await new Promise(r => setTimeout(r, 1200));

    // Move to resolving
    setStep('resolving');

    // Use resolution engine
    const resolution = resolvePaymentRequest({
      amount: merchant.amount,
      currency: 'MYR',
      intentId: `demo_tap_${Date.now()}`,
      merchantId: merchant.name,
    });

    // Simulate resolution thinking
    await new Promise(r => setTimeout(r, 1500));

    // Find source details
    const primaryStep = resolution.steps[0];
    const selectedSource = primaryStep ? sources.find(s => s.id === primaryStep.sourceId) : null;
    
    // Check for top-up
    const topUpStep = resolution.steps.find(s => s.action === 'top_up');

    setPayment(prev => prev ? {
      ...prev,
      selectedSource: selectedSource ? {
        name: selectedSource.name,
        type: selectedSource.type,
        balance: selectedSource.balance,
      } : null,
      topUpNeeded: !!topUpStep,
      topUpAmount: topUpStep?.amount || 0,
      topUpSource: topUpStep?.sourceId || null,
    } : null);

    // Move to confirm
    setStep('confirm');
  }, [isCardActive, resolvePaymentRequest, sources, toast]);

  const confirmPayment = useCallback(async () => {
    if (!payment) return;

    setStep('processing');

    // Actually create the event in DB
    const result = await simulateTerminalTap(
      payment.amount,
      payment.merchant,
      payment.category
    );

    if (result.success) {
      setEventId(result.eventId || null);
      await new Promise(r => setTimeout(r, 800));
      setStep('success');
    } else {
      setStep('declined');
      toast({
        title: 'Payment Failed',
        description: result.error || 'Transaction could not be completed',
        variant: 'destructive',
      });
    }
  }, [payment, simulateTerminalTap, toast]);

  const declinePayment = useCallback(() => {
    setStep('declined');
    toast({
      title: 'Payment Declined',
      description: 'You declined this transaction',
    });
  }, [toast]);

  const resetDemo = useCallback(() => {
    setStep('idle');
    setPayment(null);
    setEventId(null);
  }, []);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'wallet': return Wallet;
      case 'bank': return Building2;
      case 'card': return CreditCard;
      default: return CircleDollarSign;
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* Idle State - Tap Button */}
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.button
              onClick={startTapDemo}
              disabled={!isCardActive}
              className={cn(
                "relative w-32 h-32 rounded-full flex items-center justify-center",
                "transition-all duration-300",
                isCardActive 
                  ? "bg-gradient-to-br from-aurora-purple via-aurora-blue to-aurora-pink shadow-glow cursor-pointer"
                  : "bg-muted cursor-not-allowed"
              )}
              whileHover={isCardActive ? { scale: 1.05 } : {}}
              whileTap={isCardActive ? { scale: 0.95 } : {}}
            >
              {/* Pulse ring */}
              {isCardActive && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-aurora-blue/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <Wifi size={48} className="text-white rotate-90" />
            </motion.button>
            <div className="text-center">
              <p className="font-semibold text-foreground">Tap to Pay</p>
              <p className="text-sm text-muted-foreground">
                {isCardActive ? 'Simulate a contactless payment' : 'Activate your Flow Card first'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tapping Animation */}
        {step === 'tapping' && (
          <motion.div
            key="tapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <motion.div
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-aurora-purple to-aurora-blue flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {/* NFC waves */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-aurora-blue"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
              <Wifi size={36} className="text-white rotate-90" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">Connecting to terminal...</p>
            <p className="text-sm text-muted-foreground">{payment?.merchant}</p>
          </motion.div>
        )}

        {/* Resolving State */}
        {step === 'resolving' && (
          <motion.div
            key="resolving"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <motion.div 
              className="w-16 h-16 rounded-full bg-aurora-purple/20 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={32} className="text-aurora-purple" />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Finding best payment route</p>
              <p className="text-sm text-muted-foreground">
                FLOW Intelligence resolving...
              </p>
            </div>
            
            {/* Resolution steps visualization */}
            <div className="mt-4 space-y-2 w-full max-w-xs">
              {['Checking wallet balance', 'Evaluating linked accounts', 'Calculating optimal route'].map((text, i) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.4 }}
                  className="flex items-center gap-2 text-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.4 + 0.2 }}
                    className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center"
                  >
                    <Check size={10} className="text-success" />
                  </motion.div>
                  <span className="text-muted-foreground">{text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Confirmation State */}
        {step === 'confirm' && payment && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Merchant & Amount */}
            <div className="glass rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Store size={18} className="text-muted-foreground" />
                <span className="text-muted-foreground">{payment.merchant}</span>
              </div>
              <p className="text-3xl font-bold text-foreground">
                RM {payment.amount.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{payment.category}</p>
            </div>

            {/* Resolution Result */}
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Zap size={16} className="text-aurora-blue" />
                <span>Payment Route</span>
              </div>

              {payment.selectedSource && (
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = getSourceIcon(payment.selectedSource.type);
                      return <Icon size={20} className="text-success" />;
                    })()}
                    <div>
                      <p className="font-medium text-foreground">{payment.selectedSource.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: RM {payment.selectedSource.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Check size={20} className="text-success" />
                </div>
              )}

              {/* Top-up indicator */}
              {payment.topUpNeeded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 p-3 bg-aurora-blue/10 rounded-lg border border-aurora-blue/20"
                >
                  <ArrowUpRight size={18} className="text-aurora-blue" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Auto Top-Up</p>
                    <p className="text-xs text-muted-foreground">
                      +RM {payment.topUpAmount.toFixed(2)} from linked bank
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                <Shield size={14} />
                <span>Protected by FLOW Security</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={declinePayment}
              >
                <X size={18} className="mr-2" />
                Decline
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl aurora-gradient text-white"
                onClick={confirmPayment}
              >
                <Check size={18} className="mr-2" />
                Confirm
              </Button>
            </div>
          </motion.div>
        )}

        {/* Processing State */}
        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-aurora-purple/30 border-t-aurora-purple"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-lg font-semibold text-foreground">Processing payment...</p>
          </motion.div>
        )}

        {/* Success State */}
        {step === 'success' && payment && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
            >
              <Check size={40} className="text-success" />
            </motion.div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">Payment Complete!</p>
              <p className="text-muted-foreground">
                RM {payment.amount.toFixed(2)} at {payment.merchant}
              </p>
            </div>
            
            {/* Transaction details */}
            <div className="glass rounded-xl p-4 w-full max-w-xs text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{payment.selectedSource?.name || 'Flow Wallet'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">Approved</span>
              </div>
              {eventId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{eventId.slice(0, 8)}</span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={resetDemo}
            >
              Try Another Payment
            </Button>
          </motion.div>
        )}

        {/* Declined State */}
        {step === 'declined' && (
          <motion.div
            key="declined"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <X size={40} className="text-destructive" />
            </motion.div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">Payment Declined</p>
              <p className="text-muted-foreground">Transaction was not completed</p>
            </div>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={resetDemo}
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
