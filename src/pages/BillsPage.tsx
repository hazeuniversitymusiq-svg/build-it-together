/**
 * FLOW Bills Page
 * 
 * iOS 26 Liquid Glass design - Linked billers and bill payments
 * With intelligent features: payment history, auto-pay, spending insights
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft,
  Loader2,
  Zap,
  Wifi,
  Phone,
  Link as LinkIcon,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, differenceInDays } from "date-fns";
import BillPaymentHistory from "@/components/bills/BillPaymentHistory";
import AutoPayToggle from "@/components/bills/AutoPayToggle";
import { useDemo } from "@/contexts/DemoContext";
import { DemoHighlight } from "@/components/demo/DemoHighlight";
import type { Database } from "@/integrations/supabase/types";

type BillerAccount = Database['public']['Tables']['biller_accounts']['Row'];

interface BillerInfo {
  name: "Maxis" | "Unifi" | "TNB";
  icon: React.ReactNode;
  gradient: string;
  dueAmount?: number;
  dueDate?: Date;
  accountRef?: string;
  isLinked: boolean;
}

const billerConfig: Record<string, { icon: React.ReactNode; gradient: string }> = {
  Maxis: { icon: <Phone className="w-6 h-6" />, gradient: "from-green-500 to-emerald-600" },
  Unifi: { icon: <Wifi className="w-6 h-6" />, gradient: "from-orange-500 to-amber-600" },
  TNB: { icon: <Zap className="w-6 h-6" />, gradient: "from-yellow-500 to-orange-500" },
};

const BillsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registerPageAction, clearPageActions } = useDemo();

  const [billers, setBillers] = useState<BillerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingBiller, setLinkingBiller] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState<string | null>(null);

  useEffect(() => {
    const loadBillers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: linkedBillers } = await supabase
        .from("biller_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "linked");

      const billerNames: Array<"Maxis" | "Unifi" | "TNB"> = ["Maxis", "Unifi", "TNB"];
      const billerList: BillerInfo[] = billerNames.map(name => {
        const linked = linkedBillers?.find(b => b.biller_name === name);
        const config = billerConfig[name];
        
        const sampleDue = linked ? {
          dueAmount: Math.floor(Math.random() * 150) + 50,
          dueDate: addDays(new Date(), Math.floor(Math.random() * 14) + 1),
        } : {};

        return {
          name,
          icon: config.icon,
          gradient: config.gradient,
          isLinked: !!linked,
          accountRef: linked?.account_reference,
          ...sampleDue,
        };
      });

      setBillers(billerList);
      setIsLoading(false);
    };

    loadBillers();
  }, [navigate]);

  // Simulate paying a bill with auto-detection of due date
  const simulateBillPayment = useCallback(() => {
    // Find the bill with the soonest due date
    const linkedBillers = billers.filter(b => b.isLinked && b.dueDate);
    
    if (linkedBillers.length === 0) {
      // Auto-link TNB as demo
      const demoBiller: BillerInfo = {
        name: "TNB",
        icon: <Zap className="w-6 h-6" />,
        gradient: "from-yellow-500 to-orange-500",
        isLinked: true,
        accountRef: "TNB-12345678",
        dueAmount: 127.50,
        dueDate: addDays(new Date(), 3),
      };
      
      setBillers(prev => prev.map(b => 
        b.name === "TNB" ? demoBiller : b
      ));
      
      toast({
        title: "⚡ Demo: TNB Bill Detected",
        description: `RM 127.50 due in 3 days`,
      });
      return;
    }

    // Find the most urgent bill
    const sortedByDue = linkedBillers.sort((a, b) => 
      (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0)
    );
    const urgentBill = sortedByDue[0];
    const daysUntilDue = differenceInDays(urgentBill.dueDate!, new Date());
    
    const urgency = daysUntilDue <= 3 ? "🔴 Urgent" : daysUntilDue <= 7 ? "🟡 Soon" : "🟢 Upcoming";
    
    toast({
      title: `${urgency}: ${urgentBill.name} Bill`,
      description: `RM ${urgentBill.dueAmount?.toFixed(2)} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
    });
  }, [billers, toast]);

  // Register demo actions for this page
  useEffect(() => {
    registerPageAction({
      id: 'bills-simulate-payment',
      label: 'Simulate Bill Payment',
      description: 'Detect and pay the most urgent bill',
      action: simulateBillPayment,
    });

    return () => {
      clearPageActions();
    };
  }, [registerPageAction, clearPageActions, simulateBillPayment]);

  const handleLinkBiller = useCallback(async (billerName: string) => {
    if (!accountNumber.trim()) {
      toast({
        title: "Missing account number",
        description: "Please enter your account number or reference",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("biller_accounts").insert({
        user_id: user.id,
        biller_name: billerName,
        account_reference: accountNumber,
        status: "linked",
      });

      setBillers(prev => prev.map(b => 
        b.name === billerName 
          ? { 
              ...b, 
              isLinked: true, 
              accountRef: accountNumber,
              dueAmount: Math.floor(Math.random() * 150) + 50,
              dueDate: addDays(new Date(), Math.floor(Math.random() * 14) + 1),
            } 
          : b
      ));

      setLinkingBiller(null);
      setAccountNumber("");

      toast({
        title: "Biller linked",
        description: `${billerName} account has been linked`,
      });
    } catch (error) {
      console.error("Error linking biller:", error);
      toast({
        title: "Failed to link",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  }, [accountNumber, toast]);

  const handlePayNow = useCallback(async (biller: BillerInfo) => {
    if (!biller.dueAmount) return;

    setIsCreatingIntent(biller.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: user.id,
          type: "PayBill",
          amount: biller.dueAmount,
          currency: "MYR",
          payee_name: biller.name,
          payee_identifier: biller.accountRef || "",
          metadata: {
            billerType: biller.name,
            accountRef: biller.accountRef,
            railsAvailable: ["DuitNow", "BankTransfer"],
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create bill payment");
      }

      navigate(`/resolve/${intent.id}`);
    } catch (error) {
      console.error("Error creating intent:", error);
      toast({
        title: "Error",
        description: "Failed to create bill payment",
        variant: "destructive",
      });
      setIsCreatingIntent(null);
    }
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-muted-foreground text-sm">Manage & pay</p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Bills
            </h1>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 pb-6 text-muted-foreground"
      >
        Link your billers and pay in one flow.
      </motion.p>

      {/* Billers List */}
      <div className="flex-1 px-6 space-y-4">
        {billers.map((biller, index) => (
          <DemoHighlight
            key={biller.name}
            id={`biller-${biller.name}`}
            title={`${biller.name} Bill`}
            description={biller.isLinked 
              ? `Your ${biller.name} account is linked. Tap to see payment options.`
              : `Link your ${biller.name} account to pay bills in one tap.`}
            onTryIt={simulateBillPayment}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="glass-card rounded-3xl overflow-hidden shadow-float-lg"
            >
            {/* Biller Header */}
            <div className="flex items-center gap-4 p-5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${biller.gradient} flex items-center justify-center text-white shadow-float`}>
                {biller.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-lg">{biller.name}</p>
                {biller.isLinked && biller.accountRef && (
                  <p className="text-sm text-muted-foreground">Acc: {biller.accountRef}</p>
                )}
              </div>
              {biller.isLinked && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Due</p>
                  <p className="font-bold text-foreground text-xl">
                    RM {biller.dueAmount?.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {biller.isLinked ? (
                <motion.div
                  key="linked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5"
                >
                  {biller.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 glass-subtle rounded-xl px-3 py-2">
                      <Calendar className="w-4 h-4" />
                      <span>Due on {format(biller.dueDate, "MMM d, yyyy")}</span>
                    </div>
                  )}

                  {/* Payment History */}
                  <BillPaymentHistory 
                    billerName={biller.name} 
                    currentAmount={biller.dueAmount} 
                  />

                  {/* Auto-Pay Toggle */}
                  <AutoPayToggle
                    billerName={biller.name}
                    accountRef={biller.accountRef || ''}
                  />
                  
                  <Button
                    onClick={() => handlePayNow(biller)}
                    disabled={isCreatingIntent === biller.name}
                    className="w-full rounded-2xl h-12 aurora-gradient text-white border-0 shadow-glow-aurora"
                  >
                    {isCreatingIntent === biller.name ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Pay now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : linkingBiller === biller.name ? (
                <motion.div
                  key="linking"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-5"
                >
                  <Input
                    type="text"
                    placeholder="Account number or reference"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="mb-3 h-12 rounded-2xl glass-subtle border-0"
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLinkingBiller(null);
                        setAccountNumber("");
                      }}
                      className="flex-1 rounded-2xl h-11 glass-card border-0"
                      disabled={isLinking}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLinkBiller(biller.name)}
                      disabled={isLinking}
                      className="flex-1 rounded-2xl h-11 aurora-gradient text-white border-0"
                    >
                      {isLinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Link
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="unlinked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pb-5"
                >
                  <Button
                    variant="outline"
                    onClick={() => setLinkingBiller(biller.name)}
                    className="w-full rounded-2xl h-11 glass-card border-0 text-muted-foreground hover:text-foreground"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link biller
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          </DemoHighlight>
        ))}
      </div>
    </div>
  );
};

export default BillsPage;
