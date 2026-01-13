/**
 * FLOW Confirmation Card
 * 
 * The single moment of truth.
 * Shows: recipient, amount, auto-resolved rail.
 * One action: Face ID → Done.
 */

import { motion } from "framer-motion";
import { Check, Wallet, Building2, CreditCard, ArrowUp } from "lucide-react";
import type { PaymentResolution, FundingRailType } from "@/lib/orchestration";

interface ConfirmationCardProps {
  // Who/where
  recipient: string;
  recipientType?: 'merchant' | 'person';
  
  // What
  amount: number;
  currency?: string;
  
  // How (from orchestration engine)
  resolution: PaymentResolution;
  
  // Action
  onConfirm: () => void;
  isAuthenticating?: boolean;
  isProcessing?: boolean;
  isComplete?: boolean;
}

// Rail icons and labels
const railConfig: Record<FundingRailType, { icon: typeof Wallet; label: string }> = {
  wallet: { icon: Wallet, label: 'FLOW Wallet' },
  bank: { icon: Building2, label: 'Bank Account' },
  card: { icon: CreditCard, label: 'Card' },
  debit_card: { icon: CreditCard, label: 'Debit Card' },
  credit_card: { icon: CreditCard, label: 'Credit Card' },
  bnpl: { icon: CreditCard, label: 'Buy Now Pay Later' },
};

const ConfirmationCard = ({
  recipient,
  recipientType = 'merchant',
  amount,
  currency = '$',
  resolution,
  onConfirm,
  isAuthenticating = false,
  isProcessing = false,
  isComplete = false,
}: ConfirmationCardProps) => {
  const isDisabled = isAuthenticating || isProcessing || isComplete;
  
  // Determine primary rail from resolution
  const chargeStep = resolution.steps.find(s => s.action === 'charge');
  const topUpStep = resolution.steps.find(s => s.action === 'top_up');
  const primaryRail = chargeStep?.sourceType || 'wallet';
  const railInfo = railConfig[primaryRail];
  const RailIcon = railInfo.icon;

  // Format amount
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card rounded-[2rem] flow-card-shadow overflow-hidden">
        
        {/* Amount - Single Focus */}
        <div className="pt-12 pb-4 text-center">
          <motion.p
            className="text-[3.5rem] font-semibold text-foreground tracking-tight leading-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {currency}{formattedAmount}
          </motion.p>
        </div>

        {/* Recipient - Clear Statement */}
        <motion.div
          className="text-center pb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-muted-foreground text-lg">
            {recipientType === 'merchant' ? 'to' : 'to'} <span className="text-foreground font-medium">{recipient}</span>
          </p>
        </motion.div>

        {/* Rail Resolution - Confident, Already Decided */}
        <motion.div
          className="mx-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-secondary/60 rounded-2xl py-4 px-5">
            <div className="flex items-center justify-center gap-3">
              <RailIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {railInfo.label}
              </span>
            </div>
            
            {/* Show top-up info if wallet needs funding */}
            {topUpStep && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Auto top-up {currency}{topUpStep.amount.toFixed(2)} from {railConfig[topUpStep.sourceType].label}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Confirmation Needed Notice */}
        {resolution.requiresConfirmation && resolution.confirmationReason && (
          <motion.div
            className="mx-6 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-xs text-center text-warning">
              {resolution.confirmationReason}
            </p>
          </motion.div>
        )}

        {/* Biometric Action - Single Inevitable Button */}
        <div className="px-6 pb-10">
          <motion.button
            onClick={onConfirm}
            disabled={isDisabled}
            className={`w-full py-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isComplete
                ? "bg-success"
                : "bg-primary hover:bg-primary/90 active:scale-[0.98]"
            }`}
            whileTap={!isDisabled ? { scale: 0.98 } : {}}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isComplete ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check size={28} strokeWidth={2.5} className="text-success-foreground" />
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                className="w-7 h-7 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            ) : isAuthenticating ? (
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-6 h-6 rounded-full border-2 border-primary-foreground"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="font-medium text-primary-foreground text-lg">
                  Authenticating...
                </span>
              </div>
            ) : (
              <span className="font-medium text-primary-foreground text-lg">
                Pay with Face ID
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConfirmationCard;
