import { motion } from "framer-motion";
import { Fingerprint, Check, Store, ArrowRight } from "lucide-react";

interface PaymentDetails {
  merchant: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  methodIcon: string;
}

interface ConfirmationCardProps {
  payment: PaymentDetails;
  onConfirm: () => void;
  isConfirming?: boolean;
  isComplete?: boolean;
}

const ConfirmationCard = ({
  payment,
  onConfirm,
  isConfirming = false,
  isComplete = false,
}: ConfirmationCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card rounded-3xl flow-card-shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 text-center border-b border-border/50">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Store className="w-7 h-7 text-foreground" />
          </div>
          <h3 className="font-semibold text-foreground text-lg">{payment.merchant}</h3>
        </div>

        {/* Amount */}
        <div className="p-8 text-center">
          <motion.p
            className="text-5xl font-semibold text-foreground tracking-tight"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            {payment.currency}
            <span className="ml-1">{payment.amount.toFixed(2)}</span>
          </motion.p>
        </div>

        {/* Payment Route */}
        <div className="px-6 pb-6">
          <div className="bg-secondary/50 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-lg">
                  {payment.methodIcon}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.paymentMethod}</p>
                  <p className="text-xs text-muted-foreground">Auto-selected</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-success text-xs font-medium">
                <Check size={14} />
                <span>Best route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biometric Button */}
        <div className="p-6 pt-2">
          <motion.button
            onClick={onConfirm}
            disabled={isConfirming || isComplete}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${
              isComplete
                ? "bg-success text-success-foreground"
                : "bg-primary text-primary-foreground"
            }`}
            whileTap={{ scale: 0.98 }}
          >
            {isComplete ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check size={24} strokeWidth={3} />
                </motion.div>
                <span className="font-semibold">Payment Complete</span>
              </>
            ) : isConfirming ? (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Fingerprint size={24} />
                </motion.div>
                <span className="font-semibold">Confirming...</span>
              </>
            ) : (
              <>
                <Fingerprint size={24} />
                <span className="font-semibold">Confirm with Face ID</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConfirmationCard;
