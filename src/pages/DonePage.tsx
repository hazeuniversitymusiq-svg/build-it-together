/**
 * FLOW Done Page - Screen 9
 * 
 * Shows payment receipt with transaction details.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Share2, Home, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database['public']['Tables']['transactions']['Row'];
type Intent = Database['public']['Tables']['intents']['Row'];
type ResolutionPlan = Database['public']['Tables']['resolution_plans']['Row'];

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
      setIsLoading(false);
    };

    loadReceipt();
  }, [transactionId, navigate]);

  const handleShare = async () => {
    if (!receiptData) return;

    const shareText = `Payment Receipt\n\nPaid ${receiptData.currency} ${receiptData.amount.toFixed(2)}\nTo: ${receiptData.payeeName}\nVia: ${receiptData.rail}\nRef: ${receiptData.reference}\n${format(receiptData.timestamp, "PPp")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Payment Receipt",
          text: shareText,
        });
      } catch (err) {
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
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-foreground font-medium mb-2">Receipt not found</p>
        <p className="text-muted-foreground text-sm text-center">{error}</p>
        <Button variant="ghost" onClick={handleBackToHome} className="mt-6">
          Go to Home
        </Button>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Success Animation */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Checkmark */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1 
          }}
          className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            className="w-14 h-14 rounded-full bg-success flex items-center justify-center"
          >
            <Check className="w-8 h-8 text-success-foreground" strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl font-semibold text-foreground mb-8"
        >
          Paid
        </motion.h1>

        {/* Receipt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-4"
        >
          {/* Amount */}
          <div className="text-center pb-4 border-b border-border">
            <p className="text-muted-foreground text-sm mb-1">Paid</p>
            <p className="text-3xl font-bold text-foreground">
              {receiptData.currency} {receiptData.amount.toFixed(2)}
            </p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium text-foreground">{receiptData.payeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Via</span>
              <span className="font-medium text-foreground">{receiptData.rail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono text-foreground">{receiptData.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="text-foreground">{format(receiptData.timestamp, "PPp")}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-3 pb-4"
      >
        {/* Share Button */}
        <Button
          variant="outline"
          onClick={handleShare}
          className="w-full h-14 text-base font-medium rounded-2xl"
          size="lg"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share receipt
        </Button>

        {/* Back to Home Button */}
        <Button
          onClick={handleBackToHome}
          className="w-full h-14 text-base font-medium rounded-2xl"
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
        className="text-center text-sm text-muted-foreground pb-8"
      >
        Saved in your activity.
      </motion.p>
    </div>
  );
});
DonePage.displayName = "DonePage";

export default DonePage;
