/**
 * FLOW Scan Page
 * 
 * iOS 26 Liquid Glass design - frosted surfaces, aurora accents
 * Real QR scanning with camera access.
 * 
 * Enhanced with:
 * - Funding source picker (choose which wallet to pay from)
 * - Amount input for static QR codes
 * - Merchant history & intelligence
 * - My Payment Code for receiving
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
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useTestMode } from "@/hooks/useTestMode";
import { useFundingSources } from "@/hooks/useFundingSources";
import { useDemo } from "@/contexts/DemoContext";
import QRScanner from "@/components/scanner/QRScanner";
import MyPaymentCode from "@/components/scanner/MyPaymentCode";
import FundingSourcePicker from "@/components/scanner/FundingSourcePicker";
import MerchantHistory from "@/components/scanner/MerchantHistory";
import { parseQRToIntent, createIntentFromParsedQR, type ParsedQRIntent } from "@/lib/qr";

// Test QR codes for simulation
const TEST_QR_CODES = {
  merchant: "00020101021226580011com.duitnow0127DUITNOW://PAY?ref=TEST00015204599953031585802MY5913MAMAK CORNER6012KUALA LUMPUR540512.506304ABCD",
  flow: "flow://pay/Kedai%20Kopi/8.50/INV-2024-001",
  static: "00020101021126580011com.duitnow0127DUITNOW://PAY?ref=TEST00025204599953031585802MY5910NASI LEMAK6012KUALA LUMPUR6304EFGH",
};

const ScanPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptics = useHaptics();
  const { isFieldTest } = useTestMode();
  const { sources } = useFundingSources();
  const { registerPageAction, clearPageActions } = useDemo();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMyCodeOpen, setIsMyCodeOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<ParsedQRIntent | null>(null);
  
  // New states for enhanced UX
  const [selectedFundingSourceId, setSelectedFundingSourceId] = useState<string | null>(null);
  const [manualAmount, setManualAmount] = useState<string>("");

  // Simulate a test QR scan
  const simulateTestScan = (type: 'merchant' | 'flow' | 'static') => {
    handleScan(TEST_QR_CODES[type]);
  };

  // Register demo actions for this page
  useEffect(() => {
    registerPageAction({
      id: 'scan-simulate-merchant',
      label: 'Simulate Merchant QR Scan',
      description: 'Scan a DuitNow merchant QR code',
      action: async () => {
        toast({
          title: 'Scanning QR...',
          description: 'Simulating merchant QR scan',
        });
        // Small delay for effect
        await new Promise(resolve => setTimeout(resolve, 500));
        simulateTestScan('merchant');
      },
    });

    return () => {
      clearPageActions();
    };
  }, [registerPageAction, clearPageActions, toast]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);
      
      // Pre-select first available funding source
      if (sources.length > 0 && !selectedFundingSourceId) {
        const firstLinked = sources.find(s => s.isLinked && s.isAvailable);
        if (firstLinked) {
          setSelectedFundingSourceId(firstLinked.id);
        }
      }
    };
    checkAuth();
  }, [navigate, sources, selectedFundingSourceId]);

  const handleScan = async (rawData: string) => {
    setIsScannerOpen(false);
    await haptics.impact();
    
    const parsed = parseQRToIntent(rawData);
    setScannedData(parsed);
    setManualAmount(""); // Reset manual amount
    
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
      description: `${parsed.merchantName} - ${parsed.currency} ${parsed.amount?.toFixed(2) || 'Enter amount'}`,
    });
  };

  const handleProceed = async () => {
    if (!scannedData || !userId) return;
    
    // Check if amount is needed
    const finalAmount = scannedData.amount || parseFloat(manualAmount);
    if (!finalAmount || finalAmount <= 0) {
      toast({
        title: "Amount required",
        description: "Please enter a payment amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    await haptics.confirm();
    
    // Get selected funding source name for the intent
    const selectedSource = sources.find(s => s.id === selectedFundingSourceId);
    
    // Modify scannedData with user selections
    const enrichedData: ParsedQRIntent = {
      ...scannedData,
      amount: finalAmount,
    };
    
    const result = await createIntentFromParsedQR(userId, enrichedData, {
      selectedFundingSourceId,
      selectedFundingSourceName: selectedSource?.name,
    });
    
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
    setManualAmount("");
    setIsScannerOpen(true);
  };

  const railIcons: Record<string, React.ReactNode> = {
    TouchNGo: <Wallet className="w-3.5 h-3.5" />,
    GrabPay: <Wallet className="w-3.5 h-3.5" />,
    Boost: <Wallet className="w-3.5 h-3.5" />,
    DuitNow: <Store className="w-3.5 h-3.5" />,
  };

  // Check if QR is static (no amount)
  const isStaticQR = scannedData?.success && !scannedData.amount;
  const displayAmount = scannedData?.amount || (manualAmount ? parseFloat(manualAmount) : null);

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
      <div className="flex-1 flex flex-col mt-6 overflow-y-auto">
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
              <div className="flex justify-center mb-4">
                {scannedData.success ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center shadow-glow-success"
                  >
                    <CheckCircle2 className="w-7 h-7 text-success" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center"
                  >
                    <AlertCircle className="w-7 h-7 text-destructive" />
                  </motion.div>
                )}
              </div>

              {scannedData.success ? (
                <>
                  {/* Merchant History Intelligence */}
                  {userId && (
                    <div className="mb-4">
                      <MerchantHistory 
                        merchantName={scannedData.merchantName}
                        merchantId={scannedData.merchantId}
                        userId={userId}
                      />
                    </div>
                  )}

                  {/* Payment Details Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-3xl p-5 mb-4 shadow-float-lg"
                  >
                    {/* Merchant */}
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-2xl aurora-gradient-soft flex items-center justify-center mx-auto mb-2 shadow-float">
                        <Store className="w-6 h-6 text-aurora-blue" />
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">
                        {scannedData.merchantName}
                      </h2>
                      {scannedData.reference && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ref: {scannedData.reference}
                        </p>
                      )}
                    </div>

                    {/* Amount - either from QR or manual input */}
                    <div className="text-center py-4 border-t border-b border-border/50">
                      {isStaticQR ? (
                        /* Manual Amount Input for Static QR */
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground mb-2">Enter amount</p>
                          <div className="relative max-w-[200px] mx-auto">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                              RM
                            </span>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={manualAmount}
                              onChange={(e) => setManualAmount(e.target.value)}
                              className="pl-14 h-14 text-2xl font-semibold text-center rounded-2xl glass-card border-0 shadow-float"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-3xl font-semibold text-foreground tracking-tight">
                          {scannedData.currency} {displayAmount?.toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Available Rails */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Merchant accepts</p>
                      <div className="flex flex-wrap gap-2">
                        {scannedData.availableRails.map((rail, i) => (
                          <Badge 
                            key={rail} 
                            variant="secondary"
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs ${
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

                  {/* Funding Source Picker */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                  >
                    <FundingSourcePicker
                      sources={sources}
                      selectedId={selectedFundingSourceId}
                      onSelect={setSelectedFundingSourceId}
                      merchantRails={scannedData.availableRails}
                    />
                  </motion.div>
                </>
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
              <div className="mt-auto space-y-3 pb-4">
                {scannedData.success && (
                  <Button
                    onClick={handleProceed}
                    disabled={isProcessing || !selectedFundingSourceId || (isStaticQR && !manualAmount)}
                    className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora disabled:opacity-50 disabled:shadow-none"
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

              {/* Test Mode Buttons */}
              {isFieldTest && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 space-y-2"
                >
                  <p className="text-xs text-muted-foreground text-center mb-3">Test Mode</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateTestScan('merchant')}
                      className="glass-card border-0 text-xs"
                    >
                      <QrCode className="w-3 h-3 mr-1.5" />
                      DuitNow (RM12.50)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateTestScan('flow')}
                      className="glass-card border-0 text-xs"
                    >
                      <QrCode className="w-3 h-3 mr-1.5" />
                      FLOW URL
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateTestScan('static')}
                      className="glass-card border-0 text-xs"
                    >
                      <QrCode className="w-3 h-3 mr-1.5" />
                      Static (No Amount)
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScannerOpen}
        onScan={handleScan}
        onClose={() => setIsScannerOpen(false)}
        onMyCodePress={() => {
          setIsScannerOpen(false);
          setIsMyCodeOpen(true);
        }}
      />

      {/* My Payment Code Modal */}
      <MyPaymentCode
        isOpen={isMyCodeOpen}
        onClose={() => setIsMyCodeOpen(false)}
      />
    </div>
  );
};

export default ScanPage;
