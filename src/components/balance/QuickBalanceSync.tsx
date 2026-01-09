/**
 * Quick Balance Sync Widget for Home Page
 * 
 * A compact, beautiful widget that lets users quickly sync their wallet balances
 * via screenshot right from the home page.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, Wallet, RefreshCw, X } from 'lucide-react';
import { ScreenshotBalanceSync } from './ScreenshotBalanceSync';
import { useFundingSources } from '@/hooks/useFundingSources';
import { cn } from '@/lib/utils';

interface QuickBalanceSyncProps {
  className?: string;
}

export function QuickBalanceSync({ className }: QuickBalanceSyncProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { sources, walletBalance, refetch, updateBalance } = useFundingSources();

  const primaryWallet = sources.find(s => s.type === 'wallet' && s.isLinked);

  const handleApplyBalance = async (balance: number, walletName: string) => {
    // Find matching source and update
    const source = sources.find(s => 
      s.name.toLowerCase().includes(walletName.toLowerCase()) ||
      walletName.toLowerCase().includes(s.name.toLowerCase())
    );

    if (source) {
      await updateBalance(source.id, balance);
      await refetch();
    }

    setIsExpanded(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className={cn("", className)}
    >
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-full glass-card p-4 flex items-center gap-3 hover:bg-white/10 transition-colors"
          >
            {/* Icon */}
            <div className="w-11 h-11 rounded-2xl aurora-gradient flex items-center justify-center shadow-glow-aurora">
              <Camera className="w-5 h-5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">Sync Balance</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-purple/20 text-aurora-purple font-medium">
                  AI
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {primaryWallet 
                  ? `${primaryWallet.name}: RM ${walletBalance.toFixed(2)}`
                  : 'Screenshot your wallet to sync'}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-4 relative"
          >
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl aurora-gradient flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Quick Balance Sync</p>
                <p className="text-xs text-muted-foreground">Upload a wallet screenshot</p>
              </div>
            </div>

            {/* Sync Component */}
            <ScreenshotBalanceSync
              compact
              onApplyBalance={handleApplyBalance}
            />

            {/* Current Balances Quick View */}
            {sources.filter(s => s.isLinked && s.type === 'wallet').length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs font-medium text-muted-foreground mb-2">Current balances</p>
                <div className="flex gap-2 flex-wrap">
                  {sources
                    .filter(s => s.isLinked && (s.type === 'wallet' || s.type === 'bank'))
                    .slice(0, 3)
                    .map(source => (
                      <div
                        key={source.id}
                        className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-lg text-xs"
                      >
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{source.name}:</span>
                        <span className="font-medium text-foreground">RM {source.balance.toFixed(0)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
