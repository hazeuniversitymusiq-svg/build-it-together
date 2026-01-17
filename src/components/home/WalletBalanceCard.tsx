/**
 * Wallet Balance Card - Apple-Style Design
 * 
 * Clean, minimal design with:
 * - Prominent total balance
 * - Compact horizontal wallet icon row
 * - Expandable details
 * - Dismissible warnings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, ChevronDown, X, ChevronRight } from 'lucide-react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { cn } from '@/lib/utils';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';
import { PulsingDot, SyncSpinner, ShimmerEffect } from '@/components/ui/micro-animations';

interface WalletBalanceCardProps {
  className?: string;
  onLinkWallet?: () => void;
}

export function WalletBalanceCard({ className, onLinkWallet }: WalletBalanceCardProps) {
  const navigate = useNavigate();
  const { sources, totalBalance, loading, refetch } = useFundingSources();
  const [isExpanded, setIsExpanded] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBalance, setLastBalance] = useState(totalBalance);

  const linkedWallets = sources.filter(s => s.isLinked && s.type === 'wallet');
  const linkedBanks = sources.filter(s => s.isLinked && s.type === 'bank');
  const allSources = [...linkedWallets, ...linkedBanks];
  const hasLowBalance = linkedWallets.some(w => w.balance < 20);
  const balanceIncreased = totalBalance > lastBalance;

  const handleRefresh = async () => {
    setIsSyncing(true);
    setLastBalance(totalBalance);
    await refetch();
    setTimeout(() => setIsSyncing(false), 800);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass-card p-4 animate-pulse", className)}
      >
        <div className="h-5 w-24 bg-muted/50 rounded mb-2" />
        <div className="h-8 w-32 bg-muted/50 rounded" />
      </motion.div>
    );
  }

  // No wallets linked state
  if (linkedWallets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn("glass-card overflow-hidden", className)}
      >
        <button
          onClick={onLinkWallet}
          className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground text-sm">Link Your Wallets</p>
            <p className="text-xs text-muted-foreground">
              Connect TnG, GrabPay & more
            </p>
          </div>
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn("liquid-glass overflow-hidden", className)}
    >
      {/* Compact Header with Balance */}
      <div className="p-4 pb-3 relative overflow-hidden">
        {/* Shimmer effect on sync */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <ShimmerEffect />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground/70 font-semibold uppercase tracking-widest">
              Total Available
            </p>
            <PulsingDot color="bg-success" size="sm" />
          </div>
          <motion.button
            onClick={handleRefresh}
            whileTap={{ scale: 0.9 }}
            className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            title="Refresh balances"
          >
            {isSyncing ? (
              <SyncSpinner size={14} />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </motion.button>
        </div>
        
        {/* Clean balance display with subtle dark mode glow */}
        <motion.p 
          key={totalBalance}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="text-[1.75rem] font-semibold text-foreground tracking-tight leading-tight dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]"
        >
          RM {totalBalance.toFixed(2)}
        </motion.p>
      </div>

      {/* Compact Wallet Icons Row - Tap to go to Apps page */}
      <button
        onClick={() => navigate('/apps')}
        className="w-full px-4 py-2.5 flex items-center justify-between border-t border-border/30 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-1">
          {/* Overlapping wallet icons */}
          <div className="flex -space-x-2">
            {allSources.slice(0, 4).map((source, index) => {
              const IconComponent = getBrandedIcon(source.name, source.type === 'wallet' ? 'wallet' : 'bank');
              return (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-7 h-7 rounded-full bg-background border-2 border-background flex items-center justify-center shadow-sm"
                >
                  <IconComponent size={18} />
                </motion.div>
              );
            })}
            {allSources.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{allSources.length - 4}
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-2">
            {allSources.length} linked
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="text-xs">Manage</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
      {/* Minimal Low Balance Warning - just text, no background */}
      <AnimatePresence>
        {hasLowBalance && !warningDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/20"
          >
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <p className="text-xs text-muted-foreground">
                  Low balance — auto top-up enabled
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setWarningDismissed(true);
                }}
                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
