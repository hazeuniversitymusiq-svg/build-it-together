/**
 * Payment Method Selector
 * 
 * Displays available payment methods including linked cards
 * and allows users to select their preferred payment source.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Wallet, 
  Building2, 
  ChevronDown, 
  Check,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LinkedCard } from "@/hooks/useLinkedCards";

// Card brand colors
const cardBrandColors: Record<string, string> = {
  visa: "bg-[#1A1F71]",
  mastercard: "bg-gradient-to-r from-[#EB001B] to-[#F79E1B]",
  amex: "bg-[#006FCF]",
};

// Card brand labels
const cardBrandLabels: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
};

export interface PaymentMethod {
  id: string;
  type: "wallet" | "bank" | "card";
  name: string;
  displayName: string;
  icon?: React.ReactNode;
  // Card-specific fields
  cardType?: "visa" | "mastercard" | "amex";
  last4?: string;
  isDefault?: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethodId: string;
  methods: PaymentMethod[];
  linkedCards: LinkedCard[];
  onSelect: (methodId: string, isCard: boolean) => void;
  disabled?: boolean;
}

const PaymentMethodSelector = ({
  selectedMethodId,
  methods,
  linkedCards,
  onSelect,
  disabled = false,
}: PaymentMethodSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find selected method
  const selectedMethod = methods.find(m => m.id === selectedMethodId);
  const selectedCard = linkedCards.find(c => c.id === selectedMethodId);

  // Get display info for selected
  const getSelectedDisplay = () => {
    if (selectedCard) {
      return {
        icon: <CreditCard className="w-5 h-5" />,
        name: `${cardBrandLabels[selectedCard.cardType]} •••• ${selectedCard.cardNumber}`,
        isCard: true,
        cardType: selectedCard.cardType,
      };
    }
    if (selectedMethod) {
      return {
        icon: selectedMethod.icon || <Wallet className="w-5 h-5" />,
        name: selectedMethod.displayName,
        isCard: false,
      };
    }
    return {
      icon: <Wallet className="w-5 h-5" />,
      name: "Select payment method",
      isCard: false,
    };
  };

  const selected = getSelectedDisplay();
  const hasCards = linkedCards.length > 0;

  return (
    <div className="relative">
      {/* Selected Method Button */}
      <button
        onClick={() => !disabled && setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between py-3 transition-colors",
          !disabled && "cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="text-muted-foreground">Paying with</span>
        <div className="flex items-center gap-2">
          {selected.isCard && selected.cardType && (
            <div className={cn(
              "w-6 h-4 rounded-sm flex items-center justify-center",
              cardBrandColors[selected.cardType]
            )}>
              <CreditCard className="w-3 h-3 text-white" />
            </div>
          )}
          {!selected.isCard && selected.icon}
          <span className="font-medium text-foreground">{selected.name}</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Expanded Method List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1 space-y-1">
              {/* Wallets & Banks */}
              {methods.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide px-2 mb-2">
                    Wallets & Banks
                  </p>
                  {methods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        onSelect(method.id, false);
                        setIsExpanded(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors",
                        selectedMethodId === method.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                          {method.type === "wallet" && <Wallet className="w-4 h-4 text-primary" />}
                          {method.type === "bank" && <Building2 className="w-4 h-4 text-primary" />}
                        </div>
                        <span className="font-medium text-foreground">{method.displayName}</span>
                      </div>
                      {selectedMethodId === method.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Linked Cards */}
              {hasCards && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide px-2 mb-2">
                    Cards
                  </p>
                  {linkedCards.filter(c => c.isAvailable).map((card) => (
                    <button
                      key={card.id}
                      onClick={() => {
                        onSelect(card.id, true);
                        setIsExpanded(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors",
                        selectedMethodId === card.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          cardBrandColors[card.cardType]
                        )}>
                          <CreditCard className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {cardBrandLabels[card.cardType]} •••• {card.cardNumber}
                            </span>
                            {card.isDefault && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {card.fundingSourceType === "credit_card" ? "Credit" : "Debit"} · Expires {card.expiryMonth}/{card.expiryYear}
                          </span>
                        </div>
                      </div>
                      {selectedMethodId === card.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* No cards hint */}
              {!hasCards && (
                <div className="px-3 py-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Link a card in Settings for more options</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentMethodSelector;
