/**
 * FLOW Scan Page
 * 
 * Integrates Intent Engine + Orchestration Engine + Security.
 * Scan QR → Intent created → Resolution computed → Confirmation card → Face ID → Done.
 * Now includes transaction logging and pause check.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import ScannerFrame from "@/components/scanner/ScannerFrame";
import ConfirmationCard from "@/components/payment/ConfirmationCard";
import { useIntent } from "@/contexts/IntentContext";
import { useOrchestration } from "@/contexts/OrchestrationContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { useTransactionLogs } from "@/hooks/useTransactionLogs";
import { useFlowPause } from "@/hooks/useFlowPause";
import { Pause } from "lucide-react";
import type { PaymentResolution } from "@/lib/orchestration";

type ScanState = "scanning" | "confirming" | "authenticating" | "processing" | "complete";

// Helper to extract amount from any intent type
function getAmountFromIntent(intent: NonNullable<ReturnType<typeof useIntent>['currentIntent']>): { value: number; currency: string } {
  if (intent.type === 'PAY_MERCHANT') {
    return intent.amount;
  } else if (intent.type === 'SEND_MONEY') {
    return intent.amount;
  } else if (intent.type === 'RECEIVE_MONEY') {
    return intent.amount ?? { value: 0, currency: '$' };
  }
  return { value: 0, currency: '$' };
}

const ScanPage = () => {
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [resolution, setResolution] = useState<PaymentResolution | null>(null);
  
  const { currentIntent, handleQRScan, authorizeIntent, completeIntent, clearCurrentIntent } = useIntent();
  const { resolvePaymentRequest, recordPayment, topUpWallet } = useOrchestration();
  const { authorizePayment, clearAuthorization } = useSecurity();
  const { logTransaction } = useTransactionLogs();
  const { isPaused } = useFlowPause();

  // When intent changes, compute resolution
  useEffect(() => {
    if (currentIntent && scanState === "confirming") {
      const amount = getAmountFromIntent(currentIntent);
      
      const paymentResolution = resolvePaymentRequest({
        amount: amount.value,
        currency: amount.currency,
        intentId: currentIntent.id,
        merchantId: currentIntent.type === 'PAY_MERCHANT' ? currentIntent.merchant.id : undefined,
        recipientId: currentIntent.type === 'SEND_MONEY' ? currentIntent.recipient.id : undefined,
      });
      setResolution(paymentResolution);
    }
  }, [currentIntent, scanState, resolvePaymentRequest]);

  // Simulate QR scan - in real app, this would use camera
  const handleScan = () => {
    // Mock merchant QR data
    const mockQRData = JSON.stringify({
      type: 'merchant',
      merchantId: 'starbucks_klcc_001',
      merchantName: 'Starbucks KLCC',
      amount: 18.90,
      currency: '$',
      reference: `TXN-${Date.now()}`,
    });

    handleQRScan(mockQRData);
    setScanState("confirming");
  };

  // Handle biometric confirmation
  const handleConfirm = async () => {
    if (!currentIntent || !resolution) return;

    // Check if blocked
    if (resolution.action === 'BLOCKED' || resolution.action === 'INSUFFICIENT_FUNDS') {
      console.error(resolution.blockedReason);
      return;
    }

    setScanState("authenticating");

    // Step 1: Biometric auth
    const authSuccess = await authorizePayment();
    
    if (!authSuccess) {
      setScanState("confirming");
      return;
    }

    // Step 2: Authorize intent
    authorizeIntent(currentIntent.id);
    setScanState("processing");

    // Step 3: Execute resolution steps (simulate)
    await executePayment(resolution);

    // Step 4: Log transaction to audit trail
    const railUsed = resolution.steps.find(s => s.action === 'charge')?.sourceId || 'wallet';
    await logTransaction(currentIntent, railUsed);

    // Step 5: Complete
    const amount = getAmountFromIntent(currentIntent);
    setScanState("complete");
    completeIntent(currentIntent.id);
    recordPayment(amount.value);

    // Reset after animation
    setTimeout(() => {
      clearCurrentIntent();
      clearAuthorization();
      setResolution(null);
      setScanState("scanning");
    }, 2000);
  };

  // Simulate payment execution
  const executePayment = async (res: PaymentResolution): Promise<void> => {
    for (const step of res.steps) {
      if (step.action === 'top_up') {
        await new Promise(r => setTimeout(r, 400));
        topUpWallet(step.amount);
      } else if (step.action === 'charge') {
        await new Promise(r => setTimeout(r, 600));
      }
    }
  };

  // Get display data from current intent
  const getRecipientName = (): string => {
    if (!currentIntent) return '';
    
    switch (currentIntent.type) {
      case 'PAY_MERCHANT':
        return currentIntent.merchant.name;
      case 'SEND_MONEY':
        return currentIntent.recipient.name;
      default:
        return 'Unknown';
    }
  };

  const getRecipientType = (): 'merchant' | 'person' => {
    return currentIntent?.type === 'PAY_MERCHANT' ? 'merchant' : 'person';
  };

  const getDisplayAmount = () => {
    if (!currentIntent) return { value: 0, currency: '$' };
    return getAmountFromIntent(currentIntent);
  };

  const displayAmount = getDisplayAmount();

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Minimal Header */}
        <header className="px-6 pt-8 pb-4 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">FLOW</h1>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {/* Paused State */}
            {isPaused && (
              <motion.div
                key="paused"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <Pause className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">FLOW is Paused</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  All payments are currently blocked. Go to Settings to resume.
                </p>
              </motion.div>
            )}

            {!isPaused && scanState === "scanning" && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <button onClick={handleScan} className="mb-10">
                  <ScannerFrame />
                </button>
                <p className="text-muted-foreground text-center text-sm">
                  Scan to pay
                </p>
              </motion.div>
            )}

            {!isPaused && scanState !== "scanning" && currentIntent && resolution && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ConfirmationCard
                  recipient={getRecipientName()}
                  recipientType={getRecipientType()}
                  amount={displayAmount.value}
                  currency={displayAmount.currency}
                  resolution={resolution}
                  onConfirm={handleConfirm}
                  isAuthenticating={scanState === "authenticating"}
                  isProcessing={scanState === "processing"}
                  isComplete={scanState === "complete"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <BottomNav />
    </MobileShell>
  );
};

export default ScanPage;
