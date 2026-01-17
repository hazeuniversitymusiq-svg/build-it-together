/**
 * Compact Tap-to-Pay Demo
 * 
 * A minimal, uncluttered demo trigger that expands into the full
 * tap → resolve → confirm → success flow with receipt history.
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
  Receipt,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw
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

interface DemoReceipt {
  id: string;
  amount: number;
  merchant: string;
  category: string;
  source: string;
  status: 'success' | 'declined';
  timestamp: Date;
  reference: string;
}

const DEMO_MERCHANTS = [
  { name: 'Coffee Bean', category: 'Food & Beverage', icon: '☕' },
  { name: 'Petronas', category: 'Transport', icon: '⛽' },
  { name: 'AEON', category: 'Retail', icon: '🛒' },
  { name: 'Village Park', category: 'Restaurant', icon: '🍜' },
  { name: 'Grab', category: 'Transport', icon: '🚗' },
  { name: 'Starbucks', category: 'Food & Beverage', icon: '☕' },
  { name: 'Shell', category: 'Transport', icon: '⛽' },
  { name: 'Uniqlo', category: 'Retail', icon: '👕' },
];

// Demo sources to rotate through for varied payment experience
const DEMO_SOURCES = [
  { name: 'Touch \'n Go', type: 'wallet', balance: 245.80 },
  { name: 'GrabPay', type: 'wallet', balance: 128.50 },
  { name: 'Boost', type: 'wallet', balance: 89.20 },
  { name: 'Maybank', type: 'bank', balance: 3450.00 },
  { name: 'CIMB Debit', type: 'card', balance: 1280.00 },
  { name: 'DuitNow', type: 'bank', balance: 520.00 },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Beverage': '☕',
  'Transport': '🚗',
  'Retail': '🛒',
  'Restaurant': '🍜',
};

// Track last used source index to ensure variety
let lastSourceIndex = -1;

export function CompactTapDemo() {
  const { toast } = useToast();
  const { sources, resolvePaymentRequest } = useOrchestration();
  const { simulateTerminalTap, isCardActive } = useFlowCard();
  
  const [step, setStep] = useState<DemoStep>('idle');
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<DemoReceipt[]>([]);
  const [showReceipts, setShowReceipts] = useState(true);

  const getRandomMerchant = () => {
    const merchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
    const amount = parseFloat((Math.random() * 80 + 5).toFixed(2));
    return { ...merchant, amount };
  };

  // Get a different source each time for demo variety
  const getNextDemoSource = useCallback(() => {
    // Cycle through sources, avoiding the last used one
    let nextIndex = Math.floor(Math.random() * DEMO_SOURCES.length);
    while (nextIndex === lastSourceIndex && DEMO_SOURCES.length > 1) {
      nextIndex = Math.floor(Math.random() * DEMO_SOURCES.length);
    }
    lastSourceIndex = nextIndex;
    return DEMO_SOURCES[nextIndex];
  }, []);

  const addReceipt = useCallback((
    paymentDetails: PaymentDetails,
    status: 'success' | 'declined',
    reference: string
  ) => {
    const newReceipt: DemoReceipt = {
      id: `receipt_${Date.now()}`,
      amount: paymentDetails.amount,
      merchant: paymentDetails.merchant,
      category: paymentDetails.category,
      source: paymentDetails.selectedSource?.name || 'Flow Wallet',
      status,
      timestamp: new Date(),
      reference,
    };
    setReceipts(prev => [newReceipt, ...prev].slice(0, 5)); // Keep last 5
  }, []);

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

    // Get a varied demo source for this payment
    const demoSource = getNextDemoSource();
    
    // Determine if top-up is needed based on amount vs balance
    const needsTopUp = merchant.amount > demoSource.balance;
    const topUpAmount = needsTopUp ? merchant.amount - demoSource.balance + 10 : 0;

    await new Promise(r => setTimeout(r, 1500));

    setPayment(prev => prev ? {
      ...prev,
      selectedSource: {
        name: demoSource.name,
        type: demoSource.type,
        balance: demoSource.balance,
      },
      topUpNeeded: needsTopUp,
      topUpAmount: topUpAmount,
      topUpSource: needsTopUp ? 'Maybank' : null,
    } : null);

    setStep('confirm');
  }, [isCardActive, toast, getNextDemoSource]);

  const confirmPayment = useCallback(async () => {
    if (!payment) return;
    setStep('processing');

    const result = await simulateTerminalTap(
      payment.amount,
      payment.merchant,
      payment.category
    );

    if (result.success) {
      const ref = result.eventId?.slice(0, 8) || `TXN${Date.now().toString(36).toUpperCase()}`;
      setEventId(result.eventId || null);
      addReceipt(payment, 'success', ref);
      await new Promise(r => setTimeout(r, 800));
      setStep('success');
    } else {
      addReceipt(payment, 'declined', 'DECLINED');
      setStep('declined');
      toast({
        title: 'Payment Failed',
        description: result.error || 'Transaction could not be completed',
        variant: 'destructive',
      });
    }
  }, [payment, simulateTerminalTap, toast, addReceipt]);

  const declinePayment = useCallback(() => {
    if (payment) {
      addReceipt(payment, 'declined', 'USER_DECLINED');
    }
    setStep('declined');
    toast({
      title: 'Payment Declined',
      description: 'You declined this transaction',
    });
  }, [toast, payment, addReceipt]);

  const resetDemo = useCallback(() => {
    setStep('idle');
    setPayment(null);
    setEventId(null);
  }, []);

  const clearReceipts = useCallback(() => {
    setReceipts([]);
  }, []);

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'wallet': return Wallet;
      case 'bank': return Building2;
      case 'card': return CreditCard;
      default: return CircleDollarSign;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-3">
      {/* Main Demo Card */}
      <motion.div
        layout
        className="rounded-xl bg-muted/30 border border-border/50 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {/* Idle State - Tap Button */}
          {step === 'idle' && (
            <motion.button
              key="idle"
              onClick={startTapDemo}
              disabled={!isCardActive}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3",
                "transition-all duration-200",
                isCardActive 
                  ? "hover:bg-muted/50 cursor-pointer" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isCardActive 
                    ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30" 
                    : "bg-muted"
                )}>
                  <Play size={16} className={isCardActive ? "text-primary ml-0.5" : "text-muted-foreground"} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Try Tap-to-Pay Demo</p>
                  <p className="text-xs text-muted-foreground">Simulate a contactless payment</p>
                </div>
              </div>
              <motion.div
                animate={isCardActive ? { 
                  rotate: [0, 15, -15, 0],
                  transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
                } : {}}
              >
                <Wifi size={18} className={cn(
                  "rotate-90",
                  isCardActive ? "text-primary" : "text-muted-foreground"
                )} />
              </motion.div>
            </motion.button>
          )}

          {/* Tapping Animation */}
          {step === 'tapping' && (
            <motion.div
              key="tapping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-8 px-4"
            >
              <motion.div
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-primary/50"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.5 + i * 0.25, opacity: 0 }}
                    transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
                <Wifi size={32} className="text-primary-foreground rotate-90" />
              </motion.div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground">Connecting to terminal...</p>
                <p className="text-sm text-muted-foreground mt-1">{payment?.merchant}</p>
              </div>
            </motion.div>
          )}

          {/* Resolving State */}
          {step === 'resolving' && (
            <motion.div
              key="resolving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8 px-4"
            >
              <motion.div 
                className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={24} className="text-primary" />
              </motion.div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground">Finding best route</p>
                <p className="text-sm text-muted-foreground mt-1">FLOW Intelligence analyzing...</p>
              </div>
              {/* Resolution steps */}
              <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
                {['Checking balances', 'Evaluating sources', 'Optimizing route'].map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.4 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.4 + 0.2 }}
                      className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center"
                    >
                      <Check size={8} className="text-success" />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 space-y-4"
            >
              {/* Merchant & Amount */}
              <div className="text-center py-3 bg-muted/30 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                  <Store size={14} />
                  <span>{payment.merchant}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{payment.category}</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  RM {payment.amount.toFixed(2)}
                </p>
              </div>

              {/* Payment Route */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Zap size={12} className="text-primary" />
                  <span>OPTIMAL ROUTE</span>
                </div>
                
                {payment.selectedSource && (
                  <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl border border-success/20">
                    {(() => {
                      const Icon = getSourceIcon(payment.selectedSource.type);
                      return <Icon size={18} className="text-success" />;
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{payment.selectedSource.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Balance: RM {payment.selectedSource.balance.toFixed(2)}
                      </p>
                    </div>
                    <Check size={16} className="text-success" />
                  </div>
                )}

                {/* Top-up indicator */}
                {payment.topUpNeeded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20"
                  >
                    <ArrowUpRight size={16} className="text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Auto Top-Up</p>
                      <p className="text-xs text-muted-foreground">
                        +RM {payment.topUpAmount.toFixed(2)} from bank
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
                <Shield size={12} />
                <span>Protected by FLOW Security</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 rounded-xl"
                  onClick={declinePayment}
                >
                  <X size={16} className="mr-1.5" />
                  Decline
                </Button>
                <Button
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground"
                  onClick={confirmPayment}
                >
                  <Check size={16} className="mr-1.5" />
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
              className="flex flex-col items-center gap-4 py-10 px-4"
            >
              <motion.div
                className="w-12 h-12 rounded-full border-3 border-primary/30 border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-base font-medium text-foreground">Processing payment...</p>
            </motion.div>
          )}

          {/* Success State */}
          {step === 'success' && payment && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-6 px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center"
              >
                <Check size={32} className="text-success" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">Payment Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  RM {payment.amount.toFixed(2)} at {payment.merchant}
                </p>
              </div>
              
              {/* Mini receipt */}
              <div className="w-full bg-muted/30 rounded-xl p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-medium text-foreground">{payment.selectedSource?.name || 'Flow Wallet'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-success font-medium">Approved</span>
                </div>
                {eventId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono text-xs text-foreground">{eventId.slice(0, 8).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="rounded-xl mt-2"
                onClick={resetDemo}
              >
                <RotateCcw size={14} className="mr-1.5" />
                Try Another
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
              className="flex flex-col items-center gap-4 py-6 px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center"
              >
                <X size={32} className="text-destructive" />
              </motion.div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">Payment Declined</p>
                <p className="text-sm text-muted-foreground mt-1">Transaction was not completed</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl mt-2"
                onClick={resetDemo}
              >
                <RotateCcw size={14} className="mr-1.5" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Receipt History */}
      <AnimatePresence>
        {receipts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl bg-muted/20 border border-border/30 overflow-hidden"
          >
            {/* Header */}
            <button
              onClick={() => setShowReceipts(!showReceipts)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Receipt size={14} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Demo Receipts</span>
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                  {receipts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearReceipts();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                {showReceipts ? (
                  <ChevronUp size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={14} className="text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Receipts List */}
            <AnimatePresence>
              {showReceipts && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="divide-y divide-border/20">
                    {receipts.map((receipt, index) => (
                      <motion.div
                        key={receipt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        {/* Icon */}
                        <div className={cn(
                          "w-9 h-9 rounded-lg flex items-center justify-center text-sm",
                          receipt.status === 'success' 
                            ? "bg-success/10" 
                            : "bg-destructive/10"
                        )}>
                          {CATEGORY_ICONS[receipt.category] || '💳'}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">
                              {receipt.merchant}
                            </span>
                            {receipt.status === 'success' ? (
                              <Check size={12} className="text-success shrink-0" />
                            ) : (
                              <X size={12} className="text-destructive shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{receipt.source}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(receipt.timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-medium",
                            receipt.status === 'success' ? "text-foreground" : "text-muted-foreground line-through"
                          )}>
                            RM {receipt.amount.toFixed(2)}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {receipt.reference}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
