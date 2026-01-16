/**
 * FLOW Done Page - Screen 9
 * 
 * Shows payment receipt with transaction details.
 * iOS 26 Liquid Glass design with aurora accents.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Share2, Home, Loader2, Receipt, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { format } from "date-fns";
import { SuccessCircle, CountingNumber } from "@/components/ui/micro-animations";

interface ReceiptData {
  amount: number;
  currency: string;
  payeeName: string;
  rail: string;
  reference: string;
  timestamp: Date;
}

const DonePage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const { toast } = useToast();
  const haptics = useHaptics();

  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!transactionId) {
        setError("No transaction found");
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (txError || !transaction) {
        setError("Transaction not found");
        setIsLoading(false);
        return;
      }

      // Fetch intent for payee info
      const { data: intent } = await supabase
        .from("intents")
        .select("*")
        .eq("id", transaction.intent_id)
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch plan for rail info
      const { data: plan } = await supabase
        .from("resolution_plans")
        .select("*")
        .eq("id", transaction.plan_id)
        .eq("user_id", user.id)
        .maybeSingle();

      const receipt = transaction.receipt as Record<string, unknown>;

      setReceiptData({
        amount: (receipt?.amount as number) || Number(intent?.amount) || 0,
        currency: (receipt?.currency as string) || intent?.currency || "MYR",
        payeeName: (receipt?.payee as string) || intent?.payee_name || "Unknown",
        rail: (receipt?.rail as string) || plan?.chosen_rail || "Unknown",
        reference: transactionId.substring(0, 8).toUpperCase(),
        timestamp: new Date(transaction.created_at),
      });
      
      // Success haptic
      await haptics.success();
      setIsLoading(false);
    };

    loadReceipt();
  }, [transactionId, navigate, haptics]);

  const handleShare = async () => {
    if (!receiptData) return;
    await haptics.impact();

    const shareText = `Payment Receipt\n\nPaid ${receiptData.currency} ${receiptData.amount.toFixed(2)}\nTo: ${receiptData.payeeName}\nVia: ${receiptData.rail}\nRef: ${receiptData.reference}\n${format(receiptData.timestamp, "PPp")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Receipt",
          text: shareText,
        });
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Receipt details copied",
      });
    }
  };

  const handleBackToHome = () => {
    navigate("/home");
  };

  if (isLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium mb-2">Receipt not found</p>
        <p className="text-muted-foreground text-sm text-center">{error}</p>
        <Button variant="ghost" onClick={handleBackToHome} className="mt-6">
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-background via-background to-success/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background effects */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-success/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-40 right-0 w-48 h-48 bg-aurora-blue/10 blur-3xl rounded-full" />
      
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Animated success with confetti-like sparkles */}
        <div className="relative mb-6">
          <SuccessCircle size={96} delay={0.1} />
          
          {/* Floating sparkles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: Math.cos(i * 60 * Math.PI / 180) * 60,
                y: Math.sin(i * 60 * Math.PI / 180) * 60,
              }}
              transition={{ 
                delay: 0.5 + i * 0.1, 
                duration: 1,
                ease: "easeOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Sparkles className="w-4 h-4 text-success" />
            </motion.div>
          ))}
          
          {/* Celebration particle */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.7, type: "spring" }}
            className="absolute -top-2 -right-4"
          >
            <PartyPopper className="w-6 h-6 text-aurora-pink" />
          </motion.div>
        </div>

        {/* Title with stagger */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-semibold text-foreground mb-2"
        >
          Sent
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          Payment delivered successfully
        </motion.p>

        {/* Receipt Card - Glass design with counting animation */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-sm glass-card rounded-3xl p-6 shadow-float-lg overflow-hidden relative"
        >
          {/* Subtle shimmer on load */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
          />
          
          {/* Amount - Hero section with counting effect */}
          <div className="text-center pb-5 border-b border-border/50 relative">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground text-sm mb-2"
            >
              Amount Paid
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-4xl font-bold text-foreground tracking-tight"
            >
              <CountingNumber 
                value={receiptData.amount} 
                prefix={`${receiptData.currency} `}
                duration={0.8}
              />
            </motion.p>
          </div>

          {/* Details */}
          <div className="space-y-4 pt-5">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">To</span>
              <span className="font-medium text-foreground">{receiptData.payeeName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Paid via</span>
              <span className="font-medium text-foreground">{receiptData.rail}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Reference</span>
              <span className="font-mono text-sm text-foreground bg-muted/50 px-2 py-1 rounded-lg">
                {receiptData.reference}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Date</span>
              <span className="text-foreground text-sm">{format(receiptData.timestamp, "PPp")}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3 pb-4 relative z-10"
      >
        {/* Share Button */}
        <Button
          variant="outline"
          onClick={handleShare}
          className="w-full h-14 text-base font-medium rounded-2xl glass-card border-0"
          size="lg"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Receipt
        </Button>

        {/* Back to Home Button */}
        <Button
          onClick={handleBackToHome}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
          size="lg"
        >
          <Home className="w-5 h-5 mr-2" />
          Back to Home
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-sm text-muted-foreground pb-8 relative z-10"
      >
        Saved in your activity
      </motion.p>
    </div>
  );
});
DonePage.displayName = "DonePage";

export default DonePage;