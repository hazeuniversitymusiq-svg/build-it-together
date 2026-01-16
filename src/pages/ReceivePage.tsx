/**
 * FLOW Receive Page - Universal Receive Architecture
 *
 * PROTOCOL:
 * 1. Receiver selects destination wallet (where money lands)
 * 2. FLOW generates DuitNow-interoperable QR
 * 3. Payer scans with ANY DuitNow-enabled wallet/bank (T&G, Maybank, GrabPay, CIMB, etc.)
 * 4. FLOW receives via DuitNow rails → Routes to receiver's chosen destination wallet
 *
 * PROTOTYPE: Auto-simulates payment received after 5 seconds
 *
 * iOS 26 Liquid Glass design
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  QrCode,
  ChevronLeft,
  Loader2,
  Check,
  Copy,
  Share2,
  Wallet,
  ArrowDown,
  Zap,
  RefreshCw,
  Smartphone,
  ArrowRight,
  Building2,
  CreditCard,
  CheckCircle2,
  PartyPopper,
  Receipt,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { SuccessCircle, SyncSpinner, PulsingDot } from "@/components/ui/micro-animations";
import flowIcon from "@/assets/flow-icon.png";

// Destination wallet options (where receiver wants money to land)
const DESTINATION_WALLETS = [
  { id: 'TouchNGo', name: 'Touch\'n Go', shortName: 'TNG', color: 'from-blue-500 to-blue-600', icon: Wallet },
  { id: 'GrabPay', name: 'GrabPay', shortName: 'Grab', color: 'from-green-500 to-emerald-600', icon: Wallet },
  { id: 'Boost', name: 'Boost', shortName: 'Boost', color: 'from-orange-500 to-red-500', icon: Wallet },
  { id: 'Maybank', name: 'Maybank Account', shortName: 'Maybank', color: 'from-yellow-500 to-amber-600', icon: Building2 },
] as const;

// Payer can use ANY of these (shown for info)
const COMPATIBLE_PAYER_APPS = [
  'Touch\'n Go', 'Maybank', 'CIMB', 'Public Bank', 'RHB', 
  'Hong Leong', 'AmBank', 'Bank Islam', 'GrabPay', 'Boost', 'ShopeePay'
];

// Simulated payer names for prototype
const SIMULATED_PAYERS = ['Ahmad', 'Sarah', 'Wei Ming', 'Nurul', 'Jason'];
const SIMULATED_PAYER_APPS = ['Maybank', 'Touch\'n Go', 'CIMB', 'GrabPay'];

type DestinationWalletId = typeof DESTINATION_WALLETS[number]['id'];

// Amount presets
const AMOUNT_PRESETS = [10, 20, 50, 100];

const ReceivePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { success: hapticSuccess } = useHaptics();

  // Flow state: 'setup' → 'display-qr' → 'received'
  const [flowStep, setFlowStep] = useState<'setup' | 'display-qr' | 'received'>('setup');
  
  // Setup state
  const [amount, setAmount] = useState("");
  const [destinationWallet, setDestinationWallet] = useState<DestinationWalletId>('TouchNGo');
  
  // User data
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // QR display state
  const [copied, setCopied] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  
  // Received state (prototype simulation)
  const [receivedData, setReceivedData] = useState<{
    payerName: string;
    payerApp: string;
    amount: number;
    transactionId: string;
    timestamp: Date;
  } | null>(null);

  // Prototype simulation (native-safe timers - use number for browser compatibility)
  const simulationTimerRef = useRef<number | null>(null);
  const simulationRafRef = useRef<number | null>(null);
  const simulationStartedAtRef = useRef<number | null>(null);
  const simulationCompletedRef = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user phone from users table
      const { data: userData } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user.id)
        .single();
      
      if (userData?.phone) {
        setUserPhone(userData.phone);
      }
      
      // Get user name from auth metadata
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');
      
      setIsLoading(false);
    };

    loadUser();

    // Cleanup prototype simulation on unmount
    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
      if (simulationRafRef.current != null) {
        cancelAnimationFrame(simulationRafRef.current);
        simulationRafRef.current = null;
      }
    };
  }, [navigate]);

  const handlePresetAmount = useCallback((preset: number) => {
    setAmount(preset.toString());
  }, []);

  const runPrototypeSimulation = useCallback(() => {
    if (simulationCompletedRef.current) return;
    simulationCompletedRef.current = true;

    const payerName = SIMULATED_PAYERS[Math.floor(Math.random() * SIMULATED_PAYERS.length)];
    const payerApp = SIMULATED_PAYER_APPS[Math.floor(Math.random() * SIMULATED_PAYER_APPS.length)];
    const receivedAmount = amount ? parseFloat(amount) : 20;

    setReceivedData({
      payerName,
      payerApp,
      amount: receivedAmount,
      transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date(),
    });

    setIsWaiting(false);
    setFlowStep('received');

    // Haptic feedback (best-effort)
    try {
      void hapticSuccess();
    } catch {
      // ignore
    }

    toast({
      title: "Payment received! 🎉",
      description: `RM ${receivedAmount.toFixed(2)} from ${payerName} via ${payerApp}`,
    });
  }, [amount, toast, hapticSuccess]);

  const handleShowQR = useCallback(() => {
    // Reset any previous simulation loops
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (simulationRafRef.current != null) {
      cancelAnimationFrame(simulationRafRef.current);
      simulationRafRef.current = null;
    }

    simulationCompletedRef.current = false;
    simulationStartedAtRef.current = Date.now();

    setFlowStep('display-qr');
    setIsWaiting(true);
  }, []);

  // PROTOTYPE: Auto-simulate payment received after ~5 seconds (RAF + timeout fallback)
  useEffect(() => {
    if (flowStep !== 'display-qr' || !isWaiting) return;

    const start = simulationStartedAtRef.current ?? Date.now();
    simulationStartedAtRef.current = start;

    const tick = () => {
      if (simulationCompletedRef.current) return;
      if (Date.now() - start >= 5000) {
        runPrototypeSimulation();
        return;
      }
      simulationRafRef.current = requestAnimationFrame(tick);
    };

    simulationRafRef.current = requestAnimationFrame(tick);
    simulationTimerRef.current = window.setTimeout(() => {
      runPrototypeSimulation();
    }, 5200);

    return () => {
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
      if (simulationRafRef.current != null) {
        cancelAnimationFrame(simulationRafRef.current);
        simulationRafRef.current = null;
      }
    };
  }, [flowStep, isWaiting, runPrototypeSimulation]);

  const handleCopy = useCallback(async () => {
    const textToCopy = userPhone || 'FLOW Payment';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({ title: "Copied!", description: "DuitNow ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [userPhone, toast]);

  const handleShare = useCallback(async () => {
    const amountText = amount ? `RM ${parseFloat(amount).toFixed(2)}` : 'any amount';
    const shareData = {
      title: 'Pay me via DuitNow',
      text: `Pay me ${amountText}. Scan my DuitNow QR or use ID: ${userPhone || 'FLOW User'}. I'll receive it in my ${destinationWallet} wallet.`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
      }
    } catch {
      // User cancelled
    }
  }, [amount, destinationWallet, userPhone, handleCopy]);

  const handleReset = useCallback(() => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (simulationRafRef.current != null) {
      cancelAnimationFrame(simulationRafRef.current);
      simulationRafRef.current = null;
    }

    simulationStartedAtRef.current = null;
    simulationCompletedRef.current = false;

    setFlowStep('setup');
    setAmount('');
    setIsWaiting(false);
    setReceivedData(null);
  }, []);

  const handleDone = useCallback(() => {
    navigate('/home');
  }, [navigate]);

  const handleReceiveAnother = useCallback(() => {
    setFlowStep('setup');
    setAmount('');
    setReceivedData(null);
  }, []);

  // Generate DuitNow-style QR pattern
  const generateQRPattern = useCallback(() => {
    const size = 200;
    const cells = 11;
    const cellSize = size / cells;
    const pattern: JSX.Element[] = [];

    const seed = (userPhone || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0) + 
                 (amount ? parseFloat(amount) : 0) +
                 destinationWallet.charCodeAt(0);
    
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const isCorner = (
          (x < 3 && y < 3) ||
          (x >= cells - 3 && y < 3) ||
          (x < 3 && y >= cells - 3)
        );
        
        const isCornerOuter = isCorner && (
          x === 0 || x === 2 || x === cells - 1 || x === cells - 3 || 
          y === 0 || y === 2 || y === cells - 1 || y === cells - 3
        );
        const isCornerInner = isCorner && (
          (x === 1 && y === 1) || 
          (x === cells - 2 && y === 1) || 
          (x === 1 && y === cells - 2)
        );
        
        const shouldFill = isCornerOuter || isCornerInner || 
                          ((seed + x * y + x + y) % 3 === 0 && !isCorner);
        
        if (shouldFill) {
          pattern.push(
            <rect
              key={`${x}-${y}`}
              x={x * cellSize + 2}
              y={y * cellSize + 2}
              width={cellSize - 3}
              height={cellSize - 3}
              className="fill-foreground"
              rx={3}
            />
          );
        }
      }
    }
    
    return pattern;
  }, [userPhone, amount, destinationWallet]);

  const selectedWalletData = DESTINATION_WALLETS.find(w => w.id === destinationWallet);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => flowStep === 'setup' ? navigate("/home") : handleReset()}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-muted-foreground text-sm">Universal receive</p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Receive
            </h1>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Setup - Amount & Destination Wallet */}
        {flowStep === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col px-6"
          >
            {/* Architecture Explanation */}
            <div className="glass-card rounded-2xl p-4 mb-6 shadow-float">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">Universal Receive</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Payer uses <span className="font-medium text-foreground">any wallet</span> → 
                    FLOW routes to <span className="font-medium text-foreground">your chosen wallet</span>
                  </p>
                </div>
              </div>
              
              {/* Visual Flow */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Smartphone className="w-4 h-4" />
                  <span>Any app</span>
                </div>
                <ArrowRight className="w-4 h-4 text-aurora-purple" />
                <div className="px-2 py-1 rounded-lg bg-aurora-purple/10 text-aurora-purple font-medium">
                  DuitNow
                </div>
                <ArrowRight className="w-4 h-4 text-aurora-purple" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Wallet className="w-4 h-4" />
                  <span>Your wallet</span>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Amount (optional)
              </label>
              
              {/* Quick Presets */}
              <div className="flex gap-2 mb-3">
                {AMOUNT_PRESETS.map((preset) => (
                  <motion.button
                    key={preset}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePresetAmount(preset)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      amount === preset.toString()
                        ? 'aurora-gradient text-white shadow-glow-blue'
                        : 'glass-card hover:bg-white/60 dark:hover:bg-white/10 text-foreground'
                    }`}
                  >
                    RM {preset}
                  </motion.button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                  RM
                </span>
                <Input
                  type="number"
                  placeholder="0.00 (any amount)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-14 h-14 text-xl font-semibold rounded-2xl glass-card border-0 shadow-float"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Destination Wallet Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-1">
                <ArrowDown className="w-4 h-4 inline mr-2" />
                Route payment to
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Choose which wallet receives the money
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {DESTINATION_WALLETS.map((wallet) => {
                  const IconComponent = wallet.icon;
                  return (
                    <motion.button
                      key={wallet.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setDestinationWallet(wallet.id)}
                      className={`relative p-4 rounded-2xl transition-all ${
                        destinationWallet === wallet.id
                          ? 'aurora-gradient-soft aurora-border shadow-glow-blue'
                          : 'glass-card hover:bg-white/60 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${wallet.color} flex items-center justify-center`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground text-sm">{wallet.shortName}</p>
                        </div>
                      </div>
                      
                      {destinationWallet === wallet.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full aurora-gradient flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Show QR Button */}
            <Button
              onClick={handleShowQR}
              size="lg"
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Generate DuitNow QR
            </Button>

            {/* Payer compatibility note */}
            <p className="text-xs text-center text-muted-foreground mt-4">
              Payer can scan with: T&G, Maybank, CIMB, GrabPay, and 50+ more apps
            </p>
          </motion.div>
        )}

        {/* STEP 2: Display QR - Waiting for Payment */}
        {flowStep === 'display-qr' && (
          <motion.div
            key="display-qr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center px-6"
          >
            {/* QR Card */}
            <div className="glass-card rounded-3xl p-6 shadow-float-lg w-full max-w-sm mb-4">
              {/* DuitNow Badge - Universal Rail */}
              <div className="flex justify-center mb-3">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">
                    DuitNow QR
                  </span>
                </div>
              </div>

              {/* Scannable by any app indicator */}
              <p className="text-xs text-center text-muted-foreground mb-4">
                Scannable by any DuitNow-enabled app
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <motion.div 
                    className="w-56 h-56 bg-white rounded-3xl p-4 shadow-float"
                    animate={isWaiting ? { 
                      boxShadow: [
                        '0 0 20px rgba(139, 92, 246, 0.3)',
                        '0 0 40px rgba(139, 92, 246, 0.5)',
                        '0 0 20px rgba(139, 92, 246, 0.3)',
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {generateQRPattern()}
                    </svg>
                  </motion.div>
                  
                  {/* Center Logo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg"
                      animate={isWaiting ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <img src={flowIcon} alt="FLOW" className="w-11 h-7 object-contain" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-center mb-3">
                  <p className="text-3xl font-bold text-foreground">
                    RM {parseFloat(amount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* User Info */}
              <div className="text-center mb-4">
                <p className="font-medium text-foreground mb-1">
                  {userName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userPhone || 'FLOW User'}
                </p>
              </div>

              {/* Routing Indicator */}
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/50">
                <span className="text-xs text-muted-foreground">Routes to</span>
                <ArrowRight className="w-3 h-3 text-aurora-purple" />
                <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${selectedWalletData?.color} flex items-center gap-1`}>
                  <Wallet className="w-3 h-3 text-white" />
                  <span className="text-white font-medium text-xs">
                    {selectedWalletData?.shortName}
                  </span>
                </div>
              </div>
            </div>

            {/* Waiting Indicator with pulsing dot */}
            {isWaiting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-4 px-4 py-2 rounded-xl bg-aurora-purple/5"
              >
                <SyncSpinner size={20} className="text-aurora-purple" />
                <p className="text-sm text-muted-foreground">
                  Waiting for payment
                </p>
                <PulsingDot color="bg-aurora-purple" size="sm" />
              </motion.div>
            )}

            {/* Prototype Badge */}
            <div className="px-3 py-1.5 rounded-lg bg-aurora-purple/10 mb-4">
              <p className="text-xs text-aurora-purple font-medium">
                ⚡ Prototype: Auto-resolves in 5 seconds
              </p>
            </div>

            {/* Compatible Apps */}
            <div className="glass-card rounded-2xl p-4 w-full max-w-sm mb-4">
              <p className="text-xs font-medium text-foreground mb-2 text-center">
                Payer can scan with:
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {COMPATIBLE_PAYER_APPS.slice(0, 6).map((app) => (
                  <span 
                    key={app} 
                    className="px-2 py-1 rounded-lg bg-muted text-[10px] text-muted-foreground"
                  >
                    {app}
                  </span>
                ))}
                <span className="px-2 py-1 rounded-lg bg-aurora-purple/10 text-[10px] text-aurora-purple font-medium">
                  +50 more
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full max-w-sm">
              <Button
                onClick={handleCopy}
                variant="outline"
                className="flex-1 h-12 rounded-2xl glass-card border-0"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy ID
                  </>
                )}
              </Button>
              <Button
                onClick={handleShare}
                className="flex-1 h-12 rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </Button>
            </div>

            {/* Change Settings */}
            <button
              onClick={handleReset}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
              Change amount or destination
            </button>
          </motion.div>
        )}

        {/* STEP 3: Payment Received - Success State */}
        {flowStep === 'received' && receivedData && (
          <motion.div
            key="received"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {/* Success Animation with micro-animations */}
            <div className="relative mb-6">
              <SuccessCircle size={96} delay={0.1} />
              
              {/* Floating celebration sparkles */}
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: Math.cos(i * 90 * Math.PI / 180) * 50,
                    y: Math.sin(i * 90 * Math.PI / 180) * 50,
                  }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-4 h-4 text-success" />
                </motion.div>
              ))}
            </div>

            {/* Amount Received */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <p className="text-sm text-muted-foreground mb-2">Payment received</p>
              <p className="text-4xl font-bold text-success mb-2">
                +RM {receivedData.amount.toFixed(2)}
              </p>
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="w-4 h-4 text-aurora-purple" />
                <p className="text-foreground font-medium">
                  From {receivedData.payerName}
                </p>
              </div>
            </motion.div>

            {/* Transaction Details Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-2xl p-4 w-full max-w-sm mb-6 shadow-float"
            >
              {/* Flow Visualization */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid via</p>
                    <p className="text-sm font-medium text-foreground">{receivedData.payerApp}</p>
                  </div>
                </div>
                
                <ArrowRight className="w-5 h-5 text-success" />
                
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedWalletData?.color} flex items-center justify-center`}>
                    <Wallet className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Routed to</p>
                    <p className="text-sm font-medium text-foreground">{selectedWalletData?.shortName}</p>
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Transaction ID</span>
                  <span className="text-xs font-mono text-foreground">{receivedData.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Time</span>
                  <span className="text-xs text-foreground">
                    {receivedData.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="text-xs font-medium text-success flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Completed
                  </span>
                </div>
              </div>
            </motion.div>

            {/* FLOW Orchestration Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-aurora-purple/10 mb-6"
            >
              <Zap className="w-4 h-4 text-aurora-purple" />
              <p className="text-xs text-aurora-purple font-medium">
                FLOW resolved payment across rails
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3 w-full max-w-sm"
            >
              <Button
                onClick={handleReceiveAnother}
                variant="outline"
                className="flex-1 h-12 rounded-2xl glass-card border-0"
              >
                <QrCode className="w-5 h-5 mr-2" />
                New QR
              </Button>
              <Button
                onClick={handleDone}
                className="flex-1 h-12 rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Done
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceivePage;
