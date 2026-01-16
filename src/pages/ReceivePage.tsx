/**
 * FLOW Receive Page
 * 
 * CORRECT PROTOCOL:
 * 1. Enter amount (optional) → Select destination wallet
 * 2. Display YOUR QR code
 * 3. Payer scans QR with their T&G/DuitNow app
 * 4. Money lands in your chosen wallet
 * 
 * iOS 26 Liquid Glass design
 */

import { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Wallet options for destination
const WALLET_OPTIONS = [
  { id: 'TouchNGo', name: 'Touch\'n Go', shortName: 'TNG', color: 'from-blue-500 to-blue-600' },
  { id: 'DuitNow', name: 'DuitNow', shortName: 'DuitNow', color: 'from-rose-500 to-pink-600' },
  { id: 'GrabPay', name: 'GrabPay', shortName: 'Grab', color: 'from-green-500 to-emerald-600' },
  { id: 'Boost', name: 'Boost', shortName: 'Boost', color: 'from-orange-500 to-red-500' },
] as const;

type WalletId = typeof WALLET_OPTIONS[number]['id'];

// Amount presets
const AMOUNT_PRESETS = [10, 20, 50, 100];

const ReceivePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Flow state: 'setup' → 'display-qr'
  const [flowStep, setFlowStep] = useState<'setup' | 'display-qr'>('setup');
  
  // Setup state
  const [amount, setAmount] = useState("");
  const [destinationWallet, setDestinationWallet] = useState<WalletId>('TouchNGo');
  
  // User data
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // QR display state
  const [copied, setCopied] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

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
  }, [navigate]);

  const handlePresetAmount = useCallback((preset: number) => {
    setAmount(preset.toString());
  }, []);

  const handleShowQR = useCallback(() => {
    setFlowStep('display-qr');
    setIsWaiting(true);
    
    // In production, this would poll for incoming payment
    // For prototype, just show waiting state
  }, []);

  const handleCopy = useCallback(async () => {
    const textToCopy = userPhone || 'FLOW Payment';
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({ title: "Copied!", description: "Payment ID copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [userPhone, toast]);

  const handleShare = useCallback(async () => {
    const amountText = amount ? `RM ${parseFloat(amount).toFixed(2)}` : 'any amount';
    const shareData = {
      title: 'Pay me via FLOW',
      text: `Pay me ${amountText} via ${destinationWallet}. ID: ${userPhone || 'FLOW User'}`,
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
    setFlowStep('setup');
    setAmount('');
    setIsWaiting(false);
  }, []);

  // Generate QR pattern (placeholder - production would use real DuitNow/T&G QR)
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
        // Position markers
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

  const selectedWalletData = WALLET_OPTIONS.find(w => w.id === destinationWallet);

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
            onClick={() => flowStep === 'display-qr' ? handleReset() : navigate("/home")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-muted-foreground text-sm">Get paid</p>
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
            {/* Protocol Explanation */}
            <div className="glass-card rounded-2xl p-4 mb-6 shadow-float">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">How it works</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Show your QR → Payer scans with their T&G or DuitNow → 
                    Money lands in your chosen wallet
                  </p>
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
            <div className="mb-8">
              <label className="block text-sm font-medium text-foreground mb-3">
                <ArrowDown className="w-4 h-4 inline mr-2" />
                Where do you want money to land?
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {WALLET_OPTIONS.map((wallet) => (
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
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm">{wallet.shortName}</p>
                        <p className="text-xs text-muted-foreground">{wallet.name}</p>
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
                ))}
              </div>
            </div>

            {/* Show QR Button */}
            <Button
              onClick={handleShowQR}
              size="lg"
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Show My QR Code
            </Button>
          </motion.div>
        )}

        {/* STEP 2: Display QR */}
        {flowStep === 'display-qr' && (
          <motion.div
            key="display-qr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center px-6"
          >
            {/* QR Card */}
            <div className="glass-card rounded-3xl p-6 shadow-float-lg w-full max-w-sm mb-6">
              {/* Wallet Badge */}
              <div className="flex justify-center mb-4">
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${selectedWalletData?.color} flex items-center gap-2`}>
                  <Wallet className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">
                    Receive to {selectedWalletData?.shortName}
                  </span>
                </div>
              </div>

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
                      className="w-14 h-14 rounded-2xl aurora-gradient flex items-center justify-center shadow-glow-aurora"
                      animate={isWaiting ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <QrCode className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Amount Display */}
              {amount && parseFloat(amount) > 0 && (
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-foreground">
                    RM {parseFloat(amount).toFixed(2)}
                  </p>
                </div>
              )}

              {/* User Info */}
              <div className="text-center">
                <p className="font-medium text-foreground mb-1">
                  {userName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userPhone || 'FLOW User'}
                </p>
              </div>
            </div>

            {/* Waiting Indicator */}
            {isWaiting && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-5 h-5 text-aurora-purple" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  Waiting for payment...
                </p>
              </motion.div>
            )}

            {/* Instructions */}
            <div className="glass-card rounded-2xl p-4 w-full max-w-sm mb-6">
              <p className="text-sm text-center text-muted-foreground">
                Ask the payer to scan this QR with their <span className="font-medium text-foreground">Touch'n Go</span> or <span className="font-medium text-foreground">DuitNow</span> app
              </p>
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

            {/* New Request */}
            <button
              onClick={handleReset}
              className="mt-6 text-sm text-muted-foreground hover:text-foreground"
            >
              Change amount or wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReceivePage;
