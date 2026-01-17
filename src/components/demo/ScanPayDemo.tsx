/**
 * Scan to Pay Demo
 * 
 * End-to-end demo showcasing the full FLOW scan payment journey:
 * 1. QR Code Scan (simulated)
 * 2. Merchant Recognition & History
 * 3. Smart Wallet Selection (5-factor scoring)
 * 4. Auto Balance Top-Up Detection
 * 5. Payment Resolution & Confirmation
 * 6. Execution & Success
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Store, 
  Check, 
  Wallet, 
  Building2,
  CreditCard,
  ArrowRight,
  Shield,
  Zap,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Clock,
  Activity,
  ChevronRight,
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Scan,
  CircleDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOrchestration } from '@/contexts/OrchestrationContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Demo Flow Steps
type DemoStep = 
  | 'idle' 
  | 'scanning' 
  | 'parsed' 
  | 'scoring' 
  | 'scored' 
  | 'topup_check'
  | 'confirm' 
  | 'executing' 
  | 'success';

// Simulated merchant data
interface DemoMerchant {
  name: string;
  category: string;
  icon: string;
  amount: number;
  acceptedRails: string[];
  primaryRail: string;
}

// Scoring result
interface ScoredRail {
  name: string;
  type: 'wallet' | 'bank' | 'card';
  balance: number;
  scores: {
    compatibility: number;
    balance: number;
    priority: number;
    history: number;
    health: number;
  };
  totalScore: number;
  isRecommended: boolean;
  needsTopUp: boolean;
  topUpAmount?: number;
}

// Demo merchants
const DEMO_MERCHANTS: DemoMerchant[] = [
  { 
    name: 'Mamak Corner', 
    category: 'Restaurant', 
    icon: '🍜', 
    amount: 18.50,
    acceptedRails: ['TouchNGo', 'GrabPay', 'Boost', 'DuitNow'],
    primaryRail: 'DuitNow'
  },
  { 
    name: 'Petronas Dagangan', 
    category: 'Fuel', 
    icon: '⛽', 
    amount: 85.00,
    acceptedRails: ['TouchNGo', 'DuitNow'],
    primaryRail: 'TouchNGo'
  },
  { 
    name: 'AEON Mall', 
    category: 'Retail', 
    icon: '🛒', 
    amount: 156.80,
    acceptedRails: ['TouchNGo', 'GrabPay', 'Boost', 'DuitNow', 'Visa', 'Mastercard'],
    primaryRail: 'DuitNow'
  },
  { 
    name: '99 Speedmart', 
    category: 'Convenience', 
    icon: '🏪', 
    amount: 23.40,
    acceptedRails: ['TouchNGo', 'GrabPay', 'DuitNow'],
    primaryRail: 'DuitNow'
  },
];

// Scoring weights (matches smart-resolver.ts)
const WEIGHTS = {
  compatibility: 35,
  balance: 30,
  priority: 15,
  history: 10,
  health: 10,
};

export function ScanPayDemo() {
  const { toast } = useToast();
  const { sources, walletBalance, totalBalance } = useOrchestration();
  
  const [step, setStep] = useState<DemoStep>('idle');
  const [merchant, setMerchant] = useState<DemoMerchant | null>(null);
  const [scoredRails, setScoredRails] = useState<ScoredRail[]>([]);
  const [selectedRail, setSelectedRail] = useState<ScoredRail | null>(null);
  const [scoringProgress, setScoringProgress] = useState(0);
  const [currentScoringFactor, setCurrentScoringFactor] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Start the demo
  const startDemo = useCallback(async () => {
    // Pick random merchant
    const selectedMerchant = DEMO_MERCHANTS[Math.floor(Math.random() * DEMO_MERCHANTS.length)];
    setMerchant(selectedMerchant);
    setStep('scanning');
    setScoringProgress(0);

    // Simulate QR scanning animation
    await new Promise(r => setTimeout(r, 1500));
    setStep('parsed');

    // Brief pause to show parsed data
    await new Promise(r => setTimeout(r, 1200));
    setStep('scoring');

    // Simulate 5-factor scoring with progress
    const factors = [
      { name: 'Checking merchant compatibility...', weight: 35 },
      { name: 'Analyzing wallet balances...', weight: 30 },
      { name: 'Evaluating user preferences...', weight: 15 },
      { name: 'Reviewing payment history...', weight: 10 },
      { name: 'Verifying connector health...', weight: 10 },
    ];

    let progress = 0;
    for (const factor of factors) {
      setCurrentScoringFactor(factor.name);
      await new Promise(r => setTimeout(r, 600));
      progress += factor.weight;
      setScoringProgress(progress);
    }

    // Generate scored rails based on actual funding sources
    const scored = generateScoredRails(selectedMerchant);
    setScoredRails(scored);
    setSelectedRail(scored[0] || null);

    await new Promise(r => setTimeout(r, 400));
    setStep('scored');

    // Check if top-up needed
    if (scored[0]?.needsTopUp) {
      await new Promise(r => setTimeout(r, 1000));
      setStep('topup_check');
      await new Promise(r => setTimeout(r, 1500));
    }

    // Move to confirm
    await new Promise(r => setTimeout(r, 800));
    setStep('confirm');
  }, []);

  // Generate scored rails from funding sources
  const generateScoredRails = (merchant: DemoMerchant): ScoredRail[] => {
    const availableSources = sources.filter(s => s.isLinked && s.isAvailable);
    
    return availableSources.map(source => {
      // Compatibility score - check if merchant accepts this rail
      const isCompatible = merchant.acceptedRails.some(
        rail => source.name.toLowerCase().includes(rail.toLowerCase()) ||
                rail.toLowerCase().includes(source.name.toLowerCase()) ||
                source.type === 'bank' // Banks work via DuitNow
      );
      const compatibilityScore = isCompatible ? 100 : 0;

      // Balance score
      const hasEnough = source.balance >= merchant.amount;
      const balanceScore = hasEnough ? 100 : Math.round((source.balance / merchant.amount) * 60);
      const needsTopUp = !hasEnough && source.balance > 0;
      const topUpAmount = needsTopUp ? merchant.amount - source.balance : 0;

      // Priority score (inverse of priority number)
      const priorityScore = Math.max(0, 100 - (source.priority - 1) * 20);

      // History score (simulate based on type)
      const historyScore = source.type === 'wallet' ? 70 : source.type === 'bank' ? 40 : 30;

      // Health score (assume all healthy for demo)
      const healthScore = 100;

      // Calculate weighted total
      const totalScore = Math.round(
        (compatibilityScore * WEIGHTS.compatibility +
         balanceScore * WEIGHTS.balance +
         priorityScore * WEIGHTS.priority +
         historyScore * WEIGHTS.history +
         healthScore * WEIGHTS.health) / 100
      );

      return {
        name: source.name,
        type: source.type as 'wallet' | 'bank' | 'card',
        balance: source.balance,
        scores: {
          compatibility: compatibilityScore,
          balance: balanceScore,
          priority: priorityScore,
          history: historyScore,
          health: healthScore,
        },
        totalScore,
        isRecommended: false,
        needsTopUp,
        topUpAmount: topUpAmount > 0 ? topUpAmount : undefined,
      };
    })
    .filter(r => r.scores.compatibility > 0) // Only compatible rails
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((r, i) => ({ ...r, isRecommended: i === 0 }));
  };

  // Confirm and execute payment
  const confirmPayment = useCallback(async () => {
    if (!merchant || !selectedRail) return;

    setStep('executing');
    
    // Simulate execution steps
    await new Promise(r => setTimeout(r, 1200));
    
    // Generate transaction ID
    const txId = `TXN-${Date.now().toString(36).toUpperCase()}`;
    setTransactionId(txId);
    
    setStep('success');
    
    toast({
      title: 'Payment Successful',
      description: `RM ${merchant.amount.toFixed(2)} paid to ${merchant.name}`,
    });
  }, [merchant, selectedRail, toast]);

  // Reset demo
  const resetDemo = useCallback(() => {
    setStep('idle');
    setMerchant(null);
    setScoredRails([]);
    setSelectedRail(null);
    setScoringProgress(0);
    setCurrentScoringFactor('');
    setTransactionId(null);
  }, []);

  // Icon helper
  const getRailIcon = (type: string) => {
    switch (type) {
      case 'wallet': return Wallet;
      case 'bank': return Building2;
      case 'card': return CreditCard;
      default: return CircleDollarSign;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 shadow-float">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl aurora-gradient flex items-center justify-center">
            <Scan className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Scan to Pay Demo</h3>
            <p className="text-xs text-muted-foreground">Full payment flow simulation</p>
          </div>
        </div>
        {step !== 'idle' && step !== 'success' && (
          <Badge variant="secondary" className="text-xs">
            Live Demo
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* IDLE STATE */}
        {step === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center py-4"
          >
            <motion.button
              onClick={startDemo}
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-aurora-purple via-aurora-blue to-aurora-pink flex items-center justify-center shadow-glow cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-aurora-blue/50"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <QrCode size={28} className="text-white" />
            </motion.button>
            
            <p className="mt-3 font-medium text-foreground text-sm">Tap to Start Demo</p>
            <p className="text-xs text-muted-foreground">Experience full scan-to-pay flow</p>
          </motion.div>
        )}

        {/* SCANNING STATE */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <motion.div
              className="relative w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden"
            >
              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-aurora-blue to-transparent"
                animate={{ y: [-32, 32, -32] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <QrCode size={32} className="text-muted-foreground" />
            </motion.div>
            <p className="mt-3 font-medium text-foreground text-sm">Scanning...</p>
          </motion.div>
        )}

        {/* PARSED STATE */}
        {step === 'parsed' && merchant && (
          <motion.div
            key="parsed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-3"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center"
              >
                <Check size={14} className="text-success" />
              </motion.div>
              <span className="text-xs font-medium text-success">QR Recognized</span>
            </div>

            <div className="glass rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{merchant.icon}</div>
              <h4 className="font-medium text-foreground text-sm">{merchant.name}</h4>
              <p className="text-lg font-bold text-foreground">
                RM {merchant.amount.toFixed(2)}
              </p>
            </div>
          </motion.div>
        )}

        {/* SCORING STATE */}
        {step === 'scoring' && (
          <motion.div
            key="scoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-3"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 rounded-full bg-aurora-purple/20 flex items-center justify-center"
              >
                <Sparkles size={12} className="text-aurora-purple" />
              </motion.div>
              <span className="text-sm font-medium text-foreground">Smart Scoring</span>
            </div>

            <Progress value={scoringProgress} className="h-1.5 mb-2" />
            <p className="text-[10px] text-muted-foreground text-center">
              {currentScoringFactor}
            </p>
          </motion.div>
        )}

        {/* SCORED STATE */}
        {step === 'scored' && (
          <motion.div
            key="scored"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-2"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-aurora-blue" />
              <span className="text-xs font-medium text-foreground">Best Payment Method</span>
            </div>

            <div className="space-y-1.5">
              {scoredRails.slice(0, 2).map((rail, i) => {
                const Icon = getRailIcon(rail.type);
                return (
                  <motion.div
                    key={rail.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedRail(rail)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all",
                      rail.isRecommended 
                        ? "bg-success/10 border border-success/30" 
                        : "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      rail.isRecommended ? "bg-success/20" : "bg-muted"
                    )}>
                      <Icon size={16} className={rail.isRecommended ? "text-success" : "text-muted-foreground"} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-xs">{rail.name}</span>
                      {rail.needsTopUp && (
                        <span className="text-[10px] text-warning ml-1">+top-up</span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-foreground">{rail.totalScore}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TOP-UP CHECK STATE */}
        {step === 'topup_check' && selectedRail?.needsTopUp && (
          <motion.div
            key="topup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-2"
          >
            <div className="glass rounded-xl p-3 border border-aurora-blue/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpRight size={14} className="text-aurora-blue" />
                  <span className="text-xs font-medium text-foreground">Auto Top-Up</span>
                </div>
                <span className="text-xs font-semibold text-aurora-blue">
                  +RM {selectedRail.topUpAmount?.toFixed(2)}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONFIRM STATE */}
        {step === 'confirm' && merchant && selectedRail && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-2"
          >
            <div className="glass rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{merchant.icon}</span>
                  <span className="font-medium text-foreground text-sm">{merchant.name}</span>
                </div>
                <span className="text-base font-bold text-foreground">
                  RM {merchant.amount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const Icon = getRailIcon(selectedRail.type);
                    return <Icon size={12} className="text-success" />;
                  })()}
                  <span className="text-xs text-muted-foreground">{selectedRail.name}</span>
                </div>
                {selectedRail.needsTopUp && (
                  <span className="text-[10px] text-aurora-blue">+top-up</span>
                )}
              </div>
            </div>

            <Button
              onClick={confirmPayment}
              size="sm"
              className="w-full h-9 rounded-lg aurora-gradient text-white text-sm"
            >
              Confirm Payment
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </motion.div>
        )}

        {/* EXECUTING STATE */}
        {step === 'executing' && (
          <motion.div
            key="executing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4"
          >
            <motion.div
              className="w-10 h-10 rounded-full border-3 border-aurora-purple/30 border-t-aurora-purple"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="mt-2 text-sm font-medium text-foreground">Processing...</p>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {step === 'success' && merchant && selectedRail && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-3"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-2"
              >
                <BadgeCheck size={24} className="text-success" />
              </motion.div>
              
              <p className="font-bold text-foreground">Payment Complete!</p>
              <p className="text-xs text-muted-foreground">
                RM {merchant.amount.toFixed(2)} to {merchant.name}
              </p>
            </div>

            <div className="glass rounded-lg p-2 mt-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{selectedRail.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ref</span>
                <span className="font-mono text-[10px]">{transactionId}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={resetDemo}
              className="w-full mt-3 h-8 rounded-lg text-xs"
            >
              <RefreshCw size={12} className="mr-1" />
              Run Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      {step !== 'idle' && step !== 'success' && (
        <div className="flex justify-center gap-1 mt-3">
          {['scanning', 'parsed', 'scoring', 'scored', 'confirm'].map((s) => {
            const steps = ['scanning', 'parsed', 'scoring', 'scored', 'topup_check', 'confirm'];
            const currentIndex = steps.indexOf(step);
            const thisIndex = ['scanning', 'parsed', 'scoring', 'scored', 'confirm'].indexOf(s);
            const isActive = thisIndex <= currentIndex;
            
            return (
              <div
                key={s}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  isActive ? "bg-aurora-blue" : "bg-muted"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScanPayDemo;
