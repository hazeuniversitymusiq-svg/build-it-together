/**
 * FLOW Protocol - Layer 2: Balance Sync UI (Polished)
 * 
 * Beautiful component for screenshot-based balance extraction.
 * User takes screenshot → uploads → FLOW reads balance → updates source.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Check, X, Loader2, Sparkles, RefreshCw, Wallet, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScreenshotBalance, BalanceExtraction } from '@/hooks/useScreenshotBalance';
import { cn } from '@/lib/utils';

// Wallet-specific tips for better screenshots
const WALLET_TIPS: Record<string, { color: string; tip: string; balanceLocation: string }> = {
  'TouchNGo': {
    color: 'bg-blue-500',
    tip: "Open Touch 'n Go → Home screen",
    balanceLocation: 'Large number at the top',
  },
  'GrabPay': {
    color: 'bg-green-500',
    tip: 'Open Grab → Tap "GrabPay" tab',
    balanceLocation: 'Balance shown below your name',
  },
  'Boost': {
    color: 'bg-orange-500',
    tip: 'Open Boost → Home screen',
    balanceLocation: 'Main balance in the center',
  },
  'MAE': {
    color: 'bg-yellow-500',
    tip: 'Open MAE → Dashboard',
    balanceLocation: 'Account balance at the top',
  },
  'ShopeePay': {
    color: 'bg-orange-600',
    tip: 'Open Shopee → Tap "ShopeePay"',
    balanceLocation: 'Wallet balance shown prominently',
  },
};

interface ScreenshotBalanceSyncProps {
  onBalanceExtracted?: (extraction: BalanceExtraction) => void;
  onApplyBalance?: (balance: number, walletName: string) => void;
  suggestedWallet?: string;
  className?: string;
  compact?: boolean; // For home page widget
}

export function ScreenshotBalanceSync({
  onBalanceExtracted,
  onApplyBalance,
  suggestedWallet,
  className,
  compact = false,
}: ScreenshotBalanceSyncProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, lastExtraction, handleFileSelect } = useScreenshotBalance();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(suggestedWallet || null);

  const walletTip = selectedWallet ? WALLET_TIPS[selectedWallet] : null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowResult(false);

    // Process with wallet hint
    const result = await handleFileSelect(e, selectedWallet || suggestedWallet);
    
    if (result) {
      setShowResult(true);
      onBalanceExtracted?.(result);
    }
  };

  const handleApply = () => {
    if (lastExtraction?.balance !== null && lastExtraction) {
      onApplyBalance?.(lastExtraction.balance!, lastExtraction.walletName);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setShowResult(false);
    setSelectedWallet(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Compact version for home page
  if (compact) {
    return (
      <div className={cn("", className)}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 p-3 glass-card rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Reading balance...</p>
                <p className="text-xs text-muted-foreground">AI is analyzing your screenshot</p>
              </div>
            </motion.div>
          ) : showResult && lastExtraction ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-3 glass-card rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{lastExtraction.walletName}</p>
                    <p className="text-xs text-muted-foreground">
                      {lastExtraction.confidence >= 0.7 ? 'High' : 'Medium'} confidence
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">
                    RM {lastExtraction.balance?.toFixed(2) || '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button size="sm" onClick={handleApply} className="flex-1 aurora-gradient text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Apply
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 glass-card rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center shadow-glow-aurora">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">Quick Balance Sync</p>
                <p className="text-xs text-muted-foreground">Screenshot your wallet</p>
              </div>
              <Sparkles className="w-4 h-4 text-aurora-blue" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Full version
  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Wallet Selector (Quick Tips) */}
      {!previewUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Which wallet are you syncing?
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(WALLET_TIPS).map(([name, config]) => (
              <button
                key={name}
                onClick={() => setSelectedWallet(selectedWallet === name ? null : name)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedWallet === name
                    ? "bg-aurora-blue text-white shadow-glow-aurora"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Wallet-specific tip */}
          <AnimatePresence>
            {walletTip && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 p-3 bg-aurora-blue/10 rounded-xl text-sm">
                  <Lightbulb className="w-4 h-4 text-aurora-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">{walletTip.tip}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Look for: {walletTip.balanceLocation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Upload Area */}
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.button
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-full glass-card p-6 flex flex-col items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl aurora-gradient flex items-center justify-center shadow-glow-aurora">
              <Camera className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">
                {selectedWallet ? `Upload ${selectedWallet} screenshot` : 'Upload wallet screenshot'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                FLOW will read your balance automatically
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Sparkles className="w-3 h-3" />
              <span>Powered by AI vision</span>
            </div>
          </motion.button>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative glass-card overflow-hidden"
          >
            {/* Image Preview */}
            <div className="relative aspect-[9/16] max-h-64 overflow-hidden bg-black/20">
              <img
                src={previewUrl}
                alt="Wallet screenshot"
                className="w-full h-full object-contain"
              />
              
              {/* Processing Overlay */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full aurora-gradient animate-pulse" />
                      <Loader2 className="w-6 h-6 text-white absolute inset-0 m-auto animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Reading balance...</p>
                    <p className="text-xs text-muted-foreground">This takes about 2-3 seconds</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Result */}
            <AnimatePresence>
              {showResult && lastExtraction && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-4 border-t border-white/10"
                >
                  {lastExtraction.balance !== null ? (
                    <div className="space-y-3">
                      {/* Detected Wallet */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-success/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{lastExtraction.walletName}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(lastExtraction.confidence * 100)}% confident
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-foreground">
                            RM {lastExtraction.balance.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Detected balance</p>
                        </div>
                      </div>

                      {/* Secondary Balances */}
                      {lastExtraction.secondaryBalances && lastExtraction.secondaryBalances.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {lastExtraction.secondaryBalances.map((sb, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground"
                            >
                              {sb.label}: RM {sb.amount.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleReset}
                          className="flex-1"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Try again
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleApply}
                          className="flex-1 aurora-gradient text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Use this balance
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground mb-3">
                        Couldn't read the balance clearly
                      </p>
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try another screenshot
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button */}
            {!isProcessing && (
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      {!previewUrl && (
        <p className="text-xs text-center text-muted-foreground">
          Take a screenshot showing the main balance screen of your wallet app
        </p>
      )}
    </div>
  );
}
