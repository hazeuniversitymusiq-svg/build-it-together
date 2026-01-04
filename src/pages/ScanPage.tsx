import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import ScannerFrame from "@/components/scanner/ScannerFrame";
import ConfirmationCard from "@/components/payment/ConfirmationCard";

type ScanState = "scanning" | "confirming" | "processing" | "complete";

const ScanPage = () => {
  const [scanState, setScanState] = useState<ScanState>("scanning");

  const mockPayment = {
    merchant: "Starbucks KLCC",
    amount: 18.90,
    currency: "RM",
    paymentMethod: "Touch 'n Go",
  };

  const handleScan = () => {
    setScanState("confirming");
  };

  const handleConfirm = () => {
    setScanState("processing");
    setTimeout(() => {
      setScanState("complete");
      setTimeout(() => {
        setScanState("scanning");
      }, 1800);
    }, 1200);
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full">
        {/* Minimal Header - Confident, not descriptive */}
        <header className="px-6 pt-8 pb-4 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">FLOW</h1>
        </header>

        {/* Main Content - Single Focus */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait">
            {scanState === "scanning" && (
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

            {(scanState === "confirming" || scanState === "processing" || scanState === "complete") && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ConfirmationCard
                  payment={mockPayment}
                  onConfirm={handleConfirm}
                  isConfirming={scanState === "processing"}
                  isComplete={scanState === "complete"}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Removed explanatory hints - intelligence should be invisible */}
        <div className="h-6" />
      </div>
    </MobileShell>
  );
};

export default ScanPage;
