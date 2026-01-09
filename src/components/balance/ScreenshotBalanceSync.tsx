/**
 * FLOW Protocol - Layer 2: Balance Sync UI
 * 
 * Beautiful component for screenshot-based balance extraction.
 * User takes screenshot → uploads → FLOW reads balance → updates source.
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Check, X, Loader2, Sparkles, Image, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScreenshotBalance, BalanceExtraction } from '@/hooks/useScreenshotBalance';
import { cn } from '@/lib/utils';

interface ScreenshotBalanceSyncProps {
  onBalanceExtracted?: (extraction: BalanceExtraction) => void;
  onApplyBalance?: (balance: number, walletName: string) => void;
  suggestedWallet?: string;
  className?: string;
}

export function ScreenshotBalanceSync({
  onBalanceExtracted,
  onApplyBalance,
  suggestedWallet,
  className,
}: ScreenshotBalanceSyncProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isProcessing, lastExtraction, handleFileSelect, extractBalanceFromScreenshot } = useScreenshotBalance();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowResult(false);

    // Process
    const result = await handleFileSelect(e, suggestedWallet);
    
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

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
              <p className="font-medium text-foreground">Upload wallet screenshot</p>
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
                          <div className="w-8 h-8 rounded-lg bg-aurora-blue/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-aurora-blue" />
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
      <p className="text-xs text-center text-muted-foreground">
        Take a screenshot of your wallet app showing the main balance screen
      </p>
    </div>
  );
}
