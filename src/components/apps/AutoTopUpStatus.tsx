/**
 * Auto Top-Up Status Component
 * 
 * Visual indicator showing auto top-up intelligence status:
 * - Processing animation
 * - Recent top-up history
 * - Configuration quick access
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { useAutoTopUp } from '@/hooks/useAutoTopUp';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface AutoTopUpStatusProps {
  compact?: boolean;
  onViewDetails?: () => void;
}

export function AutoTopUpStatus({ compact = false, onViewDetails }: AutoTopUpStatusProps) {
  const { 
    isEnabled, 
    isProcessing, 
    walletsNeedingTopUp,
    pendingTopUps,
    recentTopUps,
    config 
  } = useAutoTopUp();

  const hasAlerts = walletsNeedingTopUp.length > 0;
  const latestTopUp = recentTopUps[0];

  if (!isEnabled) {
    return null;
  }

  // Compact version for home page
  if (compact) {
    return (
      <motion.button
        onClick={onViewDetails}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full p-3 rounded-xl flex items-center justify-between transition-colors",
          isProcessing
            ? "bg-primary/10"
            : hasAlerts
            ? "bg-amber-500/10"
            : "bg-success/10"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isProcessing
              ? "bg-primary/20"
              : hasAlerts
              ? "bg-amber-500/20"
              : "bg-success/20"
          )}>
            {isProcessing ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            ) : hasAlerts ? (
              <AlertCircle className="w-4 h-4 text-amber-500" />
            ) : (
              <Zap className="w-4 h-4 text-success" />
            )}
          </div>
          <div className="text-left">
            <p className={cn(
              "text-sm font-medium",
              isProcessing
                ? "text-primary"
                : hasAlerts
                ? "text-amber-500"
                : "text-success"
            )}>
              {isProcessing
                ? "Processing auto top-up..."
                : hasAlerts
                ? `${walletsNeedingTopUp.length} wallet${walletsNeedingTopUp.length > 1 ? 's' : ''} low`
                : "Auto top-up active"}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasAlerts
                ? "Will auto-refill when confirmed"
                : `Threshold: RM ${config.threshold}`}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    );
  }

  // Full version for apps page
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && pendingTopUps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-primary/10 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Processing Auto Top-Up</p>
                <p className="text-sm text-muted-foreground">
                  Topping up {pendingTopUps[0]?.sourceName}...
                </p>
              </div>
              <p className="text-lg font-bold text-primary">
                RM {pendingTopUps[0]?.amount.toFixed(2)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Top-Up History */}
      {recentTopUps.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent Auto Top-Ups
          </p>
          <div className="space-y-2">
            {recentTopUps.slice(0, 3).map((topUp) => (
              <motion.div
                key={topUp.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-muted/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    topUp.status === 'success' 
                      ? "bg-success/10" 
                      : "bg-destructive/10"
                  )}>
                    {topUp.status === 'success' ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{topUp.sourceName}</p>
                    <p className="text-xs text-muted-foreground">
                      From {topUp.fundedFrom} • {formatDistanceToNow(topUp.triggeredAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  "font-semibold",
                  topUp.status === 'success' ? "text-success" : "text-destructive"
                )}>
                  +RM {topUp.amount.toFixed(2)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
