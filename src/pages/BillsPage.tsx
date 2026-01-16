/**
 * FLOW Bills Page
 * 
 * iOS 26 Liquid Glass design - Linked billers and bill payments
 * With intelligent features: payment history, auto-pay, spending insights
 * Shows real wallet balances from funding_sources
 */

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft,
  Loader2,
  Calendar,
  ArrowRight,
  Plus,
  Wallet,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import BillPaymentHistory from "@/components/bills/BillPaymentHistory";
import AutoPayToggle from "@/components/bills/AutoPayToggle";
import BillLinkingFlow from "@/components/bills/BillLinkingFlow";
import BillerCatalog, { type BillerTemplate } from "@/components/bills/BillerCatalog";
import { useDemo } from "@/contexts/DemoContext";
import { DemoHighlight } from "@/components/demo/DemoHighlight";
import { useBillerAccounts, type LinkedBiller } from "@/hooks/useBillerAccounts";
import { useFundingSources } from "@/hooks/useFundingSources";

const BillsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registerPageAction, clearPageActions } = useDemo();
  const { sources, totalBalance, loading: balanceLoading } = useFundingSources();
  
  const { 
    linkedBillers, 
    linkedBillerIds, 
    isLoading, 
    userId,
    linkBiller, 
  } = useBillerAccounts();

  const [showCatalog, setShowCatalog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BillerTemplate | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState<string | null>(null);

  // Real wallets with balances
  const linkedWallets = useMemo(() => 
    sources.filter(s => s.isLinked && (s.type === 'wallet' || s.type === 'bank')),
    [sources]
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !userId) {
      navigate("/auth");
    }
  }, [isLoading, userId, navigate]);

  // Handle selecting a biller from catalog
  const handleSelectBiller = useCallback((template: BillerTemplate) => {
    setShowCatalog(false);
    setSelectedTemplate(template);
  }, []);

  // Handle completing the linking flow
  const handleLinkComplete = useCallback(async (accountRef: string) => {
    if (!selectedTemplate) return;
    
    setIsLinking(true);
    const success = await linkBiller(selectedTemplate, accountRef);
    setIsLinking(false);
    
    if (success) {
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, linkBiller]);

  // Handle paying a bill
  const handlePayNow = useCallback(async (biller: LinkedBiller) => {
    if (!userId) {
      navigate("/auth");
      return;
    }
    
    setIsCreatingIntent(biller.id);

    try {
      // Bill payments support: DuitNow, BankTransfer, VisaMastercard (cards)
      // NOT Atome or other BNPL
      const railsAvailable = ["DuitNow", "BankTransfer", "VisaMastercard", "Maybank"];

      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: userId,
          type: "PayBill" as const,
          amount: biller.dueAmount,
          currency: "MYR",
          payee_name: biller.name,
          payee_identifier: biller.accountRef,
          metadata: {
            billerType: biller.name,
            accountRef: biller.accountRef,
            railsAvailable,
          },
        })
        .select("id")
        .single();

      if (error) {
        console.error("Intent creation error:", error);
        throw new Error(error.message || "Failed to create bill payment");
      }
      
      if (!intent) {
        throw new Error("No intent returned");
      }

      navigate(`/resolve/${intent.id}`);
    } catch (error) {
      console.error("Error creating intent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bill payment",
        variant: "destructive",
      });
      setIsCreatingIntent(null);
    }
  }, [navigate, toast, userId]);

  // Demo simulation
  const simulateBillPayment = useCallback(() => {
    if (linkedBillers.length === 0) {
      toast({
        title: "No bills linked",
        description: "Tap + to add your first biller",
      });
      setShowCatalog(true);
      return;
    }

    const sortedByDue = [...linkedBillers].sort((a, b) => 
      a.dueDate.getTime() - b.dueDate.getTime()
    );
    const urgentBill = sortedByDue[0];
    const daysUntilDue = differenceInDays(urgentBill.dueDate, new Date());
    
    const urgency = daysUntilDue <= 3 ? "🔴 Urgent" : daysUntilDue <= 7 ? "🟡 Soon" : "🟢 Upcoming";
    
    toast({
      title: `${urgency}: ${urgentBill.name} Bill`,
      description: `RM ${urgentBill.dueAmount.toFixed(2)} due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`,
    });
  }, [linkedBillers, toast]);

  // Register demo actions
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
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-muted-foreground text-sm">Manage & pay</p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Bills
            </h1>
          </div>
          
          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCatalog(true)}
            className="w-10 h-10 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora"
          >
            <Plus className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 pb-4 text-muted-foreground"
      >
        Link your billers and pay in one flow.
      </motion.p>

      {/* Active Linking Flow */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mb-4 glass-card rounded-3xl overflow-hidden shadow-float-lg"
          >
            <div className="flex items-center gap-4 p-5 border-b border-border/30">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedTemplate.gradient} flex items-center justify-center text-white shadow-float`}>
                {selectedTemplate.icon}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedTemplate.name}</p>
                <p className="text-sm text-muted-foreground">New biller</p>
              </div>
            </div>
            <BillLinkingFlow
              billerName={selectedTemplate.name}
              billerIcon={selectedTemplate.icon}
              billerGradient={selectedTemplate.gradient}
              onComplete={handleLinkComplete}
              onCancel={() => setSelectedTemplate(null)}
              isLoading={isLinking}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Billers List */}
      <div className="flex-1 px-6 space-y-4 overflow-y-auto">
        {linkedBillers.length === 0 && !selectedTemplate ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-20 h-20 rounded-full glass-subtle flex items-center justify-center mb-6">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No bills linked</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-[240px]">
              Add your utility bills, subscriptions, and more for easy payment
            </p>
            <Button
              onClick={() => setShowCatalog(true)}
              className="rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add your first biller
            </Button>
          </motion.div>
        ) : (
          linkedBillers.map((biller, index) => (
            <DemoHighlight
              key={biller.id}
              id={`biller-${biller.id}`}
              title={`${biller.name} Bill`}
              description={`Your ${biller.name} account is linked. Tap to see payment options.`}
              onTryIt={simulateBillPayment}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="glass-card rounded-3xl overflow-hidden shadow-float-lg"
              >
                {/* Biller Header */}
                <div className="flex items-center gap-4 p-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${biller.gradient} flex items-center justify-center text-white shadow-float`}>
                    {biller.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-lg">{biller.name}</p>
                    <p className="text-sm text-muted-foreground">Acc: {biller.accountRef}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="font-bold text-foreground text-xl">
                      RM {biller.dueAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 glass-subtle rounded-xl px-3 py-2">
                    <Calendar className="w-4 h-4" />
                    <span>Due on {format(biller.dueDate, "MMM d, yyyy")}</span>
                  </div>

                  {/* Balance Info */}
                  <div className="flex items-center justify-between mb-3 glass-subtle rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="w-4 h-4" />
                      <span>Available balance</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      totalBalance >= biller.dueAmount ? 'text-foreground' : 'text-destructive'
                    }`}>
                      RM {totalBalance.toFixed(2)}
                    </span>
                  </div>

                  {/* Insufficient Balance Warning */}
                  {totalBalance < biller.dueAmount && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Insufficient balance. Top up RM {(biller.dueAmount - totalBalance).toFixed(2)} to pay.</span>
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
                    accountRef={biller.accountRef}
                  />
                  
                  <Button
                    onClick={() => handlePayNow(biller)}
                    disabled={isCreatingIntent === biller.id || totalBalance < biller.dueAmount}
                    className="w-full rounded-2xl h-12 aurora-gradient text-white border-0 shadow-glow-aurora disabled:opacity-50"
                  >
                    {isCreatingIntent === biller.id ? (
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
                </div>
              </motion.div>
            </DemoHighlight>
          ))
        )}
      </div>

      {/* Biller Catalog Modal */}
      <AnimatePresence>
        {showCatalog && (
          <BillerCatalog
            linkedBillerIds={linkedBillerIds}
            onSelectBiller={handleSelectBiller}
            onClose={() => setShowCatalog(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillsPage;
