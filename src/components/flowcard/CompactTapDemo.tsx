/**
 * Compact Tap-to-Pay Demo
 * 
 * A minimal, uncluttered demo trigger that expands into the full
 * tap → resolve → confirm → success flow.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  Store, 
  Check, 
  X, 
  Wallet, 
  Shield, 
  Zap,
  Building2,
  CreditCard,
  Sparkles,
  CircleDollarSign,
  ArrowUpRight,
  Play,
  ChevronDown
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

export function CompactTapDemo() {
  const { toast } = useToast();
  const { sources, resolvePaymentRequest } = useOrchestration();
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

    await new Promise(r => setTimeout(r, 1200));
    setStep('resolving');

    const resolution = resolvePaymentRequest({
      amount: merchant.amount,
      currency: 'MYR',
      intentId: `demo_tap_${Date.now()}`,
      merchantId: merchant.name,
    });

    await new Promise(r => setTimeout(r, 1500));

    const primaryStep = resolution.steps[0];
    const selectedSource = primaryStep ? sources.find(s => s.id === primaryStep.sourceId) : null;
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

    setStep('confirm');
  }, [isCardActive, resolvePaymentRequest, sources, toast]);

  const confirmPayment = useCallback(async () => {
    if (!payment) return;
    setStep('processing');

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

  // Compact idle state - just a subtle trigger
  if (step === 'idle') {
    return (
      <motion.button
        onClick={startTapDemo}
        disabled={!isCardActive}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 rounded-xl",
          "bg-muted/50 border border-border/50",
          "transition-all duration-200",
          isCardActive 
            ? "hover:bg-muted hover:border-primary/30 cursor-pointer" 
            : "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isCardActive ? "bg-primary/10" : "bg-muted"
          )}>
            <Play size={14} className={isCardActive ? "text-primary" : "text-muted-foreground"} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Try Demo</p>
            <p className="text-xs text-muted-foreground">Simulate tap-to-pay</p>
          </div>
        </div>
        <Wifi size={16} className={cn(
          "rotate-90",
          isCardActive ? "text-primary" : "text-muted-foreground"
        )} />
      </motion.button>
    );
  }

  // Expanded demo states
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="rounded-xl bg-muted/30 border border-border/50 overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {/* Tapping Animation */}
        {step === 'tapping' && (
          <motion.div
            key="tapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6 px-4"
          >
            <motion.div
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
              <Wifi size={24} className="text-primary-foreground rotate-90" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">Connecting...</p>
            <p className="text-xs text-muted-foreground">{payment?.merchant}</p>
          </motion.div>
        )}

        {/* Resolving State */}
        {step === 'resolving' && (
          <motion.div
            key="resolving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-6 px-4"
          >
            <motion.div 
              className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles size={20} className="text-primary" />
            </motion.div>
            <p className="text-sm font-medium text-foreground">Finding best route...</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Confirmation State */}
        {step === 'confirm' && payment && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-3"
          >
            {/* Amount & Merchant */}
            <div className="text-center py-2">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-1">
                <Store size={12} />
                <span>{payment.merchant}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                RM {payment.amount.toFixed(2)}
              </p>
            </div>

            {/* Payment Route */}
            {payment.selectedSource && (
              <div className="flex items-center gap-2 p-2.5 bg-success/10 rounded-lg border border-success/20">
                {(() => {
                  const Icon = getSourceIcon(payment.selectedSource.type);
                  return <Icon size={16} className="text-success" />;
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{payment.selectedSource.name}</p>
                </div>
                <Check size={14} className="text-success" />
              </div>
            )}

            {/* Top-up indicator */}
            {payment.topUpNeeded && (
              <div className="flex items-center gap-2 p-2.5 bg-primary/10 rounded-lg border border-primary/20">
                <ArrowUpRight size={14} className="text-primary" />
                <span className="text-xs text-foreground">
                  Auto top-up +RM {payment.topUpAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs"
                onClick={declinePayment}
              >
                <X size={14} className="mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1 h-9 rounded-lg text-xs bg-primary text-primary-foreground"
                onClick={confirmPayment}
              >
                <Check size={14} className="mr-1" />
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
            className="flex flex-col items-center gap-3 py-6 px-4"
          >
            <motion.div
              className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm font-medium text-foreground">Processing...</p>
          </motion.div>
        )}

        {/* Success State */}
        {step === 'success' && payment && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-5 px-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center"
            >
              <Check size={24} className="text-success" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">Payment Complete</p>
              <p className="text-xs text-muted-foreground">
                RM {payment.amount.toFixed(2)} • {payment.merchant}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={resetDemo}
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Declined State */}
        {step === 'declined' && (
          <motion.div
            key="declined"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-5 px-4"
          >
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <X size={24} className="text-destructive" />
            </div>
            <p className="text-sm font-medium text-foreground">Declined</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={resetDemo}
            >
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
