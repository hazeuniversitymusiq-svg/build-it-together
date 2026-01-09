/**
 * FLOW Done Page - Screen 9
 * 
 * Shows payment receipt with transaction details.
 * iOS 26 Liquid Glass design with aurora accents.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Share2, Home, Loader2, Receipt, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";
import { format } from "date-fns";

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
        {/* Animated checkmark with glow */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1 
          }}
          className="relative mb-6"
        >
          {/* Outer glow ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 0.3 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 w-24 h-24 rounded-full bg-success blur-xl"
          />
          
          {/* Main circle */}
          <div className="relative w-24 h-24 rounded-full bg-success/20 flex items-center justify-center backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-glow-success"
            >
              <Check className="w-9 h-9 text-white" strokeWidth={3} />
            </motion.div>
          </div>
          
          {/* Sparkle */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -top-1 -right-1"
          >
            <Sparkles className="w-6 h-6 text-success" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-semibold text-foreground mb-2"
        >
          Payment Complete
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-muted-foreground mb-8"
        >
          Transaction successful
        </motion.p>

        {/* Receipt Card - Glass design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm glass-card rounded-3xl p-6 shadow-float-lg"
        >
          {/* Amount - Hero section */}
          <div className="text-center pb-5 border-b border-border/50">
            <p className="text-muted-foreground text-sm mb-2">Amount Paid</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              {receiptData.currency} {receiptData.amount.toFixed(2)}
            </p>
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