/**
 * Bill Linking Flow Component
 * 
 * Enhanced UX for linking and activating biller accounts.
 * Shows step-by-step process with animations.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Link as LinkIcon, 
  Check, 
  Loader2, 
  Shield,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessCircle, PulsingDot } from "@/components/ui/micro-animations";

interface BillLinkingFlowProps {
  billerName: string;
  billerIcon: React.ReactNode;
  billerGradient: string;
  onComplete: (accountRef: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

type LinkingStep = "input" | "verifying" | "success";

const BillLinkingFlow = ({
  billerName,
  billerIcon,
  billerGradient,
  onComplete,
  onCancel,
  isLoading,
}: BillLinkingFlowProps) => {
  const [step, setStep] = useState<LinkingStep>("input");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!accountNumber.trim()) {
      setError("Please enter your account number");
      return;
    }

    if (accountNumber.length < 6) {
      setError("Account number must be at least 6 characters");
      return;
    }

    setError(null);
    setStep("verifying");

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStep("success");

    // Brief success display before completing
    await new Promise((resolve) => setTimeout(resolve, 1200));

    onComplete(accountNumber);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-5 pb-5"
    >
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${billerGradient} flex items-center justify-center text-white shadow-float`}
              >
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Link {billerName}</p>
                <p className="text-xs text-muted-foreground">
                  Enter your account details
                </p>
              </div>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={`${billerName} account number`}
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value);
                  setError(null);
                }}
                className="h-12 rounded-2xl glass-subtle border-0 text-center text-lg font-medium tracking-wider"
                autoFocus
              />
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-destructive text-sm px-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 px-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Your account info is encrypted and secure</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 rounded-2xl h-11 glass-card border-0"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !accountNumber.trim()}
                className="flex-1 rounded-2xl h-11 aurora-gradient text-white border-0"
              >
                Link Account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "verifying" && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-6 space-y-4"
          >
            <div className="relative">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${billerGradient} flex items-center justify-center text-white shadow-float`}
              >
                {billerIcon}
              </div>
              <motion.div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4 text-primary" />
              </motion.div>
            </div>

            <div className="text-center">
              <p className="font-medium text-foreground">Verifying account</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <PulsingDot size="sm" color="bg-primary" />
                <span className="text-sm text-muted-foreground">
                  Connecting to {billerName}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-6 space-y-4"
          >
            <SuccessCircle size={64} />

            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">
                Account Linked!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {billerName} is now active
              </p>
            </div>

            {/* Quick info */}
            <div className="glass-subtle rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                Account: <span className="font-medium">{accountNumber}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BillLinkingFlow;
