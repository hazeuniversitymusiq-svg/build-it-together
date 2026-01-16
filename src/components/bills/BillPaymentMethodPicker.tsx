/**
 * Bill Payment Method Picker
 * 
 * Allows users to select payment methods for bill payments.
 * Excludes BNPL (like Atome) - bills must be paid with:
 * - DuitNow (bank transfer)
 * - Linked debit/credit cards
 * - Bank accounts
 */

import { motion, AnimatePresence } from "framer-motion";
import { Building2, CreditCard, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { RealFundingSource } from "@/hooks/useFundingSources";

interface BillPaymentMethodPickerProps {
  sources: RealFundingSource[];
  selectedId: string | null;
  onSelect: (id: string, railName: string) => void;
}

const methodIcons: Record<string, React.ReactNode> = {
  bank: <Building2 className="w-5 h-5" />,
  debit_card: <CreditCard className="w-5 h-5" />,
  credit_card: <CreditCard className="w-5 h-5" />,
};

const methodColors: Record<string, string> = {
  DuitNow: "from-pink-500 to-rose-600",
  BankTransfer: "from-blue-500 to-indigo-600",
  Maybank: "from-yellow-500 to-amber-600",
  VisaMastercard: "from-indigo-500 to-purple-600",
};

const BillPaymentMethodPicker = ({
  sources,
  selectedId,
  onSelect,
}: BillPaymentMethodPickerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter to only bill-compatible sources (no wallets, no BNPL)
  const billCompatibleSources = sources.filter(
    (s) =>
      s.isLinked &&
      s.isAvailable &&
      (s.type === "bank" || s.type === "debit_card" || s.type === "credit_card")
  );

  // Also add DuitNow as a special option
  const duitNowSource: RealFundingSource = {
    id: "duitnow-default",
    name: "DuitNow",
    type: "bank",
    priority: 0,
    balance: 0, // No balance required for DuitNow
    isAvailable: true,
    isLinked: true,
    maxAutoTopUp: 0,
    requireConfirmAbove: 0,
    currency: "MYR",
  };

  const allSources = [duitNowSource, ...billCompatibleSources];

  const selectedSource = allSources.find((s) => s.id === selectedId);

  if (allSources.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-muted-foreground text-sm">
          No payment methods available for bill payments.
          <br />
          Link a bank account or card in Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-muted-foreground mb-2">
        Pay with
      </label>

      {/* Selected method (collapsed view) */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass-card rounded-2xl p-4 flex items-center justify-between hover:bg-white/60 dark:hover:bg-white/10 transition-all"
      >
        <div className="flex items-center gap-3">
          {selectedSource ? (
            <>
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  methodColors[selectedSource.name] || "from-gray-500 to-gray-600"
                } flex items-center justify-center text-white shadow-float`}
              >
                {methodIcons[selectedSource.type] || (
                  <Building2 className="w-5 h-5" />
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">
                  {selectedSource.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSource.type === "bank"
                    ? "Bank Transfer"
                    : "Card Payment"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Select payment method</p>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </motion.button>

      {/* Expanded options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {allSources.map((source, index) => {
              const isSelected = selectedId === source.id;
              const colorClass =
                methodColors[source.name] || "from-gray-500 to-gray-600";

              return (
                <motion.button
                  key={source.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onSelect(source.id, source.name);
                    setIsExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected
                      ? "aurora-gradient-soft aurora-border shadow-glow-blue"
                      : "glass-subtle hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-float`}
                  >
                    {methodIcons[source.type] || (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground text-sm">
                      {source.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {source.type === "bank"
                        ? "Instant bank transfer"
                        : source.type === "debit_card"
                        ? "Debit card"
                        : "Credit card"}
                    </p>
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full aurora-gradient flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}

            {/* Info about excluded methods */}
            <div className="px-3 py-2 text-xs text-muted-foreground/70 text-center">
              💡 BNPL options like Atome are not available for bill payments
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillPaymentMethodPicker;
