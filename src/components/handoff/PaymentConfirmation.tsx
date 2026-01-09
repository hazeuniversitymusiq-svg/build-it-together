/**
 * FLOW Protocol - Layer 5: Confirmation UI
 * 
 * Shown when user returns from wallet app.
 * Simple question: "Did you complete the payment?"
 */

import { motion } from 'framer-motion';
import { Check, X, Clock, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRailDisplayName } from '@/lib/core/wallet-handoff';
import { cn } from '@/lib/utils';

interface PaymentConfirmationProps {
  rail: string;
  amount: number;
  merchant?: string;
  elapsedTime: number; // in ms
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function PaymentConfirmation({
  rail,
  amount,
  merchant,
  elapsedTime,
  onConfirm,
  onCancel,
  className,
}: PaymentConfirmationProps) {
  const formatElapsed = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn("glass-card p-6 text-center space-y-6", className)}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-aurora-blue/20 flex items-center justify-center">
          <Wallet className="w-8 h-8 text-aurora-blue" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Welcome back!
        </h2>
        <p className="text-muted-foreground">
          Did you complete the payment in {getRailDisplayName(rail)}?
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-muted/30 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium text-foreground">RM {amount.toFixed(2)}</span>
        </div>
        {merchant && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">To</span>
            <span className="font-medium text-foreground">{merchant}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Via</span>
          <span className="font-medium text-foreground">{getRailDisplayName(rail)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Time away</span>
          <span className="font-medium text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatElapsed(elapsedTime)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={onConfirm}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora"
        >
          <Check className="w-5 h-5 mr-2" />
          Yes, payment completed
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full h-12 text-base rounded-xl"
        >
          <X className="w-4 h-4 mr-2" />
          No, I'll pay later
        </Button>
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground">
        FLOW uses this to keep your records accurate. We never move money ourselves.
      </p>
    </motion.div>
  );
}
