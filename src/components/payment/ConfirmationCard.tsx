import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface PaymentDetails {
  merchant: string;
  amount: number;
  currency: string;
  paymentMethod: string;
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
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="bg-card rounded-[2rem] flow-card-shadow overflow-hidden">
        {/* Amount - Single Focus */}
        <div className="pt-10 pb-6 text-center">
          <motion.p
            className="text-[3.5rem] font-semibold text-foreground tracking-tight leading-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {payment.currency}{payment.amount.toFixed(2)}
          </motion.p>
          <motion.p
            className="mt-3 text-muted-foreground text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            {payment.merchant}
          </motion.p>
        </div>

        {/* Payment Method - Confident Statement */}
        <motion.div
          className="mx-6 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-secondary/60 rounded-2xl py-4 px-5">
            <p className="text-sm text-muted-foreground text-center">
              {payment.paymentMethod}
            </p>
          </div>
        </motion.div>

        {/* Biometric Confirmation - Inevitable Action */}
        <div className="px-6 pb-8">
          <motion.button
            onClick={onConfirm}
            disabled={isConfirming || isComplete}
            className={`w-full py-5 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isComplete
                ? "bg-success"
                : "bg-primary"
            }`}
            whileTap={!isComplete && !isConfirming ? { scale: 0.98 } : {}}
          >
            {isComplete ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Check size={28} strokeWidth={2.5} className="text-primary-foreground" />
              </motion.div>
            ) : isConfirming ? (
              <motion.div
                className="w-7 h-7 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
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
