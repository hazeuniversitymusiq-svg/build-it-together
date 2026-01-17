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
    <div className="glass-card rounded-3xl p-5 shadow-float-lg">
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center py-8"
          >
            <motion.button
              onClick={startDemo}
              className="relative w-28 h-28 rounded-full bg-gradient-to-br from-aurora-purple via-aurora-blue to-aurora-pink flex items-center justify-center shadow-glow cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-aurora-blue/50"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <QrCode size={40} className="text-white" />
            </motion.button>
            
            <p className="mt-4 font-semibold text-foreground">Tap to Start Demo</p>
            <p className="text-sm text-muted-foreground">Experience the full scan-to-pay flow</p>
            
            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Smart Routing', 'Auto Top-Up', '5-Factor Scoring'].map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* SCANNING STATE */}
        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <motion.div
              className="relative w-24 h-24 rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden"
            >
              {/* Scan line animation */}
              <motion.div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-aurora-blue to-transparent"
                animate={{ y: [-48, 48, -48] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
              <QrCode size={48} className="text-muted-foreground" />
            </motion.div>
            <p className="mt-4 font-semibold text-foreground">Scanning QR Code...</p>
            <p className="text-sm text-muted-foreground">Detecting merchant payment code</p>
          </motion.div>
        )}

        {/* PARSED STATE */}
        {step === 'parsed' && merchant && (
          <motion.div
            key="parsed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-4"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center"
              >
                <Check size={20} className="text-success" />
              </motion.div>
              <span className="text-sm font-medium text-success">QR Code Recognized</span>
            </div>

            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{merchant.icon}</div>
              <h4 className="font-semibold text-foreground">{merchant.name}</h4>
              <p className="text-xs text-muted-foreground">{merchant.category}</p>
              <p className="text-2xl font-bold text-foreground mt-2">
                RM {merchant.amount.toFixed(2)}
              </p>
              
              {/* Accepted rails */}
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {merchant.acceptedRails.slice(0, 4).map((rail) => (
                  <Badge key={rail} variant="secondary" className="text-xs">
                    {rail}
                  </Badge>
                ))}
              </div>
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
            className="py-6"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 rounded-full bg-aurora-purple/20 flex items-center justify-center"
              >
                <Sparkles size={16} className="text-aurora-purple" />
              </motion.div>
              <span className="font-semibold text-foreground">FLOW Intelligence Active</span>
            </div>

            {/* Progress */}
            <div className="space-y-2 mb-4">
              <Progress value={scoringProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {currentScoringFactor}
              </p>
            </div>

            {/* Scoring factors visualization */}
            <div className="grid grid-cols-5 gap-1">
              {[
                { icon: Store, label: 'Compat', weight: 35, active: scoringProgress >= 35 },
                { icon: Wallet, label: 'Balance', weight: 30, active: scoringProgress >= 65 },
                { icon: TrendingUp, label: 'Priority', weight: 15, active: scoringProgress >= 80 },
                { icon: Clock, label: 'History', weight: 10, active: scoringProgress >= 90 },
                { icon: Activity, label: 'Health', weight: 10, active: scoringProgress >= 100 },
              ].map((factor, i) => (
                <motion.div
                  key={factor.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-lg transition-colors",
                    factor.active ? "bg-success/10" : "bg-muted/30"
                  )}
                >
                  <factor.icon size={14} className={factor.active ? "text-success" : "text-muted-foreground"} />
                  <span className="text-[10px] text-muted-foreground mt-1">{factor.label}</span>
                  <span className="text-[10px] font-medium">{factor.weight}%</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* SCORED STATE */}
        {step === 'scored' && (
          <motion.div
            key="scored"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-aurora-blue" />
              <span className="text-sm font-medium text-foreground">Smart Recommendation</span>
            </div>

            <div className="space-y-2">
              {scoredRails.slice(0, 3).map((rail, i) => {
                const Icon = getRailIcon(rail.type);
                return (
                  <motion.div
                    key={rail.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    onClick={() => setSelectedRail(rail)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                      rail.isRecommended 
                        ? "bg-success/10 border border-success/30" 
                        : selectedRail?.name === rail.name
                          ? "bg-aurora-blue/10 border border-aurora-blue/30"
                          : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      rail.isRecommended ? "bg-success/20" : "bg-muted"
                    )}>
                      <Icon size={20} className={rail.isRecommended ? "text-success" : "text-muted-foreground"} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{rail.name}</span>
                        {rail.isRecommended && (
                          <Badge className="bg-success/20 text-success text-[10px] px-1.5">
                            Best Match
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Balance: RM {rail.balance.toFixed(2)}
                        {rail.needsTopUp && (
                          <span className="text-warning ml-1">• Needs top-up</span>
                        )}
                      </p>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{rail.totalScore}</p>
                      <p className="text-[10px] text-muted-foreground">score</p>
                    </div>
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-6"
          >
            <div className="glass rounded-2xl p-4 border border-aurora-blue/30">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight size={18} className="text-aurora-blue" />
                <span className="font-semibold text-foreground">Auto Top-Up Detected</span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                Your {selectedRail.name} balance is insufficient. FLOW will automatically top up from your linked bank.
              </p>

              <div className="flex items-center justify-between p-3 bg-aurora-blue/10 rounded-xl">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-aurora-blue" />
                  <span className="text-sm">Maybank</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    +RM {selectedRail.topUpAmount?.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Auto top-up</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                <Shield size={12} />
                <span>Secured by FLOW</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* CONFIRM STATE */}
        {step === 'confirm' && merchant && selectedRail && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-4"
          >
            {/* Summary */}
            <div className="glass rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{merchant.icon}</span>
                  <div>
                    <p className="font-medium text-foreground">{merchant.name}</p>
                    <p className="text-xs text-muted-foreground">{merchant.category}</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">
                  RM {merchant.amount.toFixed(2)}
                </p>
              </div>

              <div className="border-t border-border/50 pt-3">
                <p className="text-xs text-muted-foreground mb-2">Paying with</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getRailIcon(selectedRail.type);
                      return <Icon size={16} className="text-success" />;
                    })()}
                    <span className="font-medium text-foreground">{selectedRail.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Score: {selectedRail.totalScore}
                  </Badge>
                </div>

                {selectedRail.needsTopUp && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-aurora-blue">
                    <ArrowUpRight size={12} />
                    <span>+RM {selectedRail.topUpAmount?.toFixed(2)} auto top-up from bank</span>
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Button */}
            <Button
              onClick={confirmPayment}
              className="w-full h-12 rounded-xl aurora-gradient text-white font-medium"
            >
              Confirm Payment
              <ChevronRight size={18} className="ml-2" />
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
            className="flex flex-col items-center py-8"
          >
            <motion.div
              className="w-16 h-16 rounded-full border-4 border-aurora-purple/30 border-t-aurora-purple"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="mt-4 font-semibold text-foreground">Processing Payment...</p>
            <p className="text-sm text-muted-foreground">Executing transaction securely</p>
          </motion.div>
        )}

        {/* SUCCESS STATE */}
        {step === 'success' && merchant && selectedRail && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-6"
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-3"
              >
                <BadgeCheck size={32} className="text-success" />
              </motion.div>
              
              <p className="text-lg font-bold text-foreground">Payment Complete!</p>
              <p className="text-sm text-muted-foreground">
                RM {merchant.amount.toFixed(2)} to {merchant.name}
              </p>
            </div>

            {/* Receipt */}
            <div className="glass rounded-2xl p-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span className="font-medium">{selectedRail.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium">FLOW Smart Routing</span>
              </div>
              {selectedRail.needsTopUp && (
                <div className="flex justify-between text-aurora-blue">
                  <span>Auto Top-Up</span>
                  <span>+RM {selectedRail.topUpAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-success font-medium">Approved</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={resetDemo}
              className="w-full mt-4 h-10 rounded-xl"
            >
              <RefreshCw size={16} className="mr-2" />
              Run Demo Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      {step !== 'idle' && step !== 'success' && (
        <div className="flex justify-center gap-1.5 mt-4">
          {['scanning', 'parsed', 'scoring', 'scored', 'confirm'].map((s, i) => {
            const steps = ['scanning', 'parsed', 'scoring', 'scored', 'topup_check', 'confirm'];
            const currentIndex = steps.indexOf(step);
            const thisIndex = ['scanning', 'parsed', 'scoring', 'scored', 'confirm'].indexOf(s);
            const isActive = thisIndex <= currentIndex;
            
            return (
              <motion.div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  isActive ? "bg-aurora-blue" : "bg-muted"
                )}
                animate={{ scale: step === s ? 1.2 : 1 }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScanPayDemo;
