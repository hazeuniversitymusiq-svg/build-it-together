/**
 * FLOW Scan Page
 * 
 * iOS 26 Liquid Glass design - frosted surfaces, aurora accents
 * Real QR scanning with camera access.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  QrCode, 
  Camera, 
  Store, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useTestMode } from "@/hooks/useTestMode";
import QRScanner from "@/components/scanner/QRScanner";
import { parseQRToIntent, createIntentFromParsedQR, type ParsedQRIntent } from "@/lib/qr";

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptics = useHaptics();
  const { isFieldTest } = useTestMode();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<ParsedQRIntent | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
    };
    checkAuth();
  }, [navigate]);

  const handleScan = async (rawData: string) => {
    setIsScannerOpen(false);
    await haptics.impact();
    
    const parsed = parseQRToIntent(rawData);
    setScannedData(parsed);
    
    if (!parsed.success) {
      await haptics.error();
      toast({
        title: "Unrecognized QR Code",
        description: parsed.error,
        variant: "destructive",
      });
      return;
    }
    
    await haptics.success();
    toast({
      title: "QR Scanned",
      description: `${parsed.merchantName} - ${parsed.currency} ${parsed.amount?.toFixed(2) || 'Amount TBD'}`,
    });
  };

  const handleProceed = async () => {
    if (!scannedData || !userId) return;
    
    setIsProcessing(true);
    await haptics.confirm();
    
    const result = await createIntentFromParsedQR(userId, scannedData);
    
    if (!result.success || !result.intentId) {
      toast({
        title: "Failed to create payment",
        description: result.error,
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    navigate(`/resolve/${result.intentId}`);
  };

  const handleScanAnother = () => {
    setScannedData(null);
    setIsScannerOpen(true);
  };

  const railIcons: Record<string, React.ReactNode> = {
    TouchNGo: <Wallet className="w-3.5 h-3.5" />,
    GrabPay: <Wallet className="w-3.5 h-3.5" />,
    Boost: <Wallet className="w-3.5 h-3.5" />,
    DuitNow: <Store className="w-3.5 h-3.5" />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-14 pb-2"
      >
        <p className="text-muted-foreground text-sm mb-1">Pay merchants instantly</p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Scan to Pay
        </h1>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col mt-6">
        <AnimatePresence mode="wait">
          {scannedData ? (
            /* Scanned Result */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Success/Error indicator */}
              <div className="flex justify-center mb-6">
                {scannedData.success ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center shadow-glow-success"
                  >
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
                  >
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </motion.div>
                )}
              </div>

              {scannedData.success ? (
                /* Payment Details Card */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card rounded-3xl p-6 mb-6 shadow-float-lg"
                >
                  {/* Merchant */}
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl aurora-gradient-soft flex items-center justify-center mx-auto mb-3 shadow-float">
                      <Store className="w-7 h-7 text-aurora-blue" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      {scannedData.merchantName}
                    </h2>
                    {scannedData.reference && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Ref: {scannedData.reference}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="text-center py-5 border-t border-b border-border/50">
                    {scannedData.amount ? (
                      <p className="text-4xl font-semibold text-foreground tracking-tight">
                        {scannedData.currency} {scannedData.amount.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground">
                        Amount to be entered
                      </p>
                    )}
                  </div>

                  {/* Available Rails */}
                  <div className="mt-5">
                    <p className="text-xs text-muted-foreground mb-2">Pay via</p>
                    <div className="flex flex-wrap gap-2">
                      {scannedData.availableRails.map((rail, i) => (
                        <Badge 
                          key={rail} 
                          variant="secondary"
                          className={`flex items-center gap-1.5 px-3 py-1.5 ${
                            i === 0 ? "aurora-gradient text-white border-0" : "glass-card"
                          }`}
                        >
                          {railIcons[rail]}
                          {rail}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Error Message */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card border-destructive/20 rounded-3xl p-6 mb-6"
                >
                  <p className="text-center text-destructive">
                    {scannedData.error}
                  </p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="mt-auto space-y-3">
                {scannedData.success && (
                  <Button
                    onClick={handleProceed}
                    disabled={isProcessing}
                    className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Pay
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={handleScanAnother}
                  className="w-full h-12 rounded-2xl glass-card border-0"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Scan Another
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Initial State - Scan Button */
            <motion.div
              key="initial"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              {/* Large Scan Button */}
              <motion.button
                onClick={() => setIsScannerOpen(true)}
                className="relative w-52 h-52 rounded-[2.5rem] aurora-gradient-soft glass-card flex flex-col items-center justify-center gap-4 shadow-float-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Aurora glow ring */}
                <div className="absolute inset-0 rounded-[2.5rem] aurora-border opacity-50" />
                
                {/* Icon */}
                <motion.div 
                  className="w-20 h-20 rounded-2xl aurora-gradient flex items-center justify-center shadow-glow-aurora"
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Camera className="w-9 h-9 text-white" />
                </motion.div>
                
                <span className="text-lg font-medium text-foreground">
                  Open Scanner
                </span>
              </motion.button>

              {/* Supported formats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 text-center"
              >
                <p className="text-sm text-muted-foreground mb-3">Supports</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="glass-card border-0 px-3 py-1">DuitNow</Badge>
                  <Badge variant="secondary" className="glass-card border-0 px-3 py-1">Touch'n'Go</Badge>
                  <Badge variant="secondary" className="glass-card border-0 px-3 py-1">GrabPay</Badge>
                  <Badge variant="secondary" className="glass-card border-0 px-3 py-1">Boost</Badge>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onScan={handleScan}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
};

export default ScanPage;
