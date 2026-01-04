import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import ScannerFrame from "@/components/scanner/ScannerFrame";
import ConfirmationCard from "@/components/payment/ConfirmationCard";
import { Zap } from "lucide-react";

type ScanState = "scanning" | "confirming" | "processing" | "complete";

const ScanPage = () => {
  const [scanState, setScanState] = useState<ScanState>("scanning");

  const mockPayment = {
    merchant: "Starbucks KLCC",
    amount: 18.90,
    currency: "RM",
    paymentMethod: "Touch 'n Go",
    methodIcon: "🔵",
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
      }, 2000);
    }, 1500);
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full safe-area-top">
        {/* Header */}
        <header className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">FLOW</h1>
              <p className="text-sm text-muted-foreground">Ready to pay</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success-soft rounded-full">
              <Zap size={14} className="text-success" />
              <span className="text-xs font-medium text-success">Connected</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <AnimatePresence mode="wait">
            {scanState === "scanning" && (
              <motion.div
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center"
              >
                <button onClick={handleScan} className="mb-8">
                  <ScannerFrame />
                </button>
                <motion.p
                  className="text-muted-foreground text-center"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Point at QR code to scan
                </motion.p>
              </motion.div>
            )}

            {(scanState === "confirming" || scanState === "processing" || scanState === "complete") && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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

        {/* Bottom hint */}
        {scanState === "scanning" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 pb-4 text-center"
          >
            <p className="text-xs text-muted-foreground">
              FLOW automatically selects the best payment route
            </p>
          </motion.div>
        )}
      </div>
    </MobileShell>
  );
};

export default ScanPage;
