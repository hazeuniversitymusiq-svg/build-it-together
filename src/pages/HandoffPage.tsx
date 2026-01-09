/**
 * FLOW Handoff Page
 * 
 * The minimal field-test flow:
 * 1. Show: "Pay RM X to Y via Z"
 * 2. Button: "Open [Wallet]"
 * 3. On return: "Did you complete the payment?" Yes/No
 * 
 * This is the REAL WORLD bridge.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ExternalLink, 
  Check, 
  X, 
  Loader2, 
  Wallet,
  Building2,
  CreditCard,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  openWalletApp, 
  getRailDisplayName, 
  supportsAppHandoff,
  isMobileDevice 
} from "@/lib/core/wallet-handoff";
import { useHaptics } from "@/hooks/useHaptics";
import type { Database } from "@/integrations/supabase/types";

type ResolutionPlan = Database['public']['Tables']['resolution_plans']['Row'];
type Intent = Database['public']['Tables']['intents']['Row'];

const railIcons: Record<string, React.ReactNode> = {
  TouchNGo: <Wallet className="w-6 h-6" />,
  GrabPay: <Wallet className="w-6 h-6" />,
  Boost: <Wallet className="w-6 h-6" />,
  DuitNow: <Building2 className="w-6 h-6" />,
  BankTransfer: <Building2 className="w-6 h-6" />,
  Maybank: <Building2 className="w-6 h-6" />,
  VisaMastercard: <CreditCard className="w-6 h-6" />,
};

type HandoffState = 'loading' | 'ready' | 'handed_off' | 'confirming' | 'complete' | 'cancelled' | 'error';

const HandoffPage = () => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const haptics = useHaptics();

  const [state, setState] = useState<HandoffState>('loading');
  const [plan, setPlan] = useState<ResolutionPlan | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handoffTime, setHandoffTime] = useState<Date | null>(null);

  // Load plan and intent
  useEffect(() => {
    const loadData = async () => {
      if (!planId) {
        setError("No payment plan found");
        setState('error');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: planData, error: planError } = await supabase
        .from("resolution_plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (planError || !planData) {
        setError("Payment plan not found");
        setState('error');
        return;
      }

      const { data: intentData, error: intentError } = await supabase
        .from("intents")
        .select("*")
        .eq("id", planData.intent_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (intentError || !intentData) {
        setError("Payment request not found");
        setState('error');
        return;
      }

      setPlan(planData);
      setIntent(intentData);
      setState('ready');
    };

    loadData();
  }, [planId, navigate]);

  // Handle visibility change (user returning from wallet app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state === 'handed_off') {
        // User returned from wallet app
        setState('confirming');
        haptics.impact();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state, haptics]);

  const handleOpenWallet = async () => {
    if (!plan || !intent) return;

    await haptics.confirm();
    setHandoffTime(new Date());
    setState('handed_off');

    // Attempt to open the wallet app
    const result = openWalletApp(plan.chosen_rail, {
      amount: Number(intent.amount),
      merchant: intent.payee_name,
      reference: plan.id,
    });

    if (!result.attempted) {
      // No handoff possible, go to confirming state immediately
      setTimeout(() => setState('confirming'), 1000);
    }
  };

  const handleConfirmComplete = async () => {
    if (!plan || !intent) return;

    await haptics.success();
    
    // Record as successful transaction
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: transaction } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          intent_id: plan.intent_id,
          plan_id: plan.id,
          status: 'success',
          receipt: {
            amount: Number(intent.amount),
            currency: intent.currency,
            payee: intent.payee_name,
            rail: plan.chosen_rail,
            completedAt: new Date().toISOString(),
            handoffDuration: handoffTime ? Date.now() - handoffTime.getTime() : null,
            userConfirmed: true,
          },
        })
        .select('id')
        .single();

      if (transaction) {
        setState('complete');
        setTimeout(() => navigate(`/done/${transaction.id}`), 800);
        return;
      }
    }

    setState('complete');
    setTimeout(() => navigate('/home'), 800);
  };

  const handleConfirmNotComplete = async () => {
    await haptics.error();
    setState('cancelled');
    
    // Record as cancelled/incomplete
    const { data: { user } } = await supabase.auth.getUser();
    if (user && plan) {
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          intent_id: plan.intent_id,
          plan_id: plan.id,
          status: 'cancelled',
          receipt: {
            amount: Number(intent?.amount),
            payee: intent?.payee_name,
            rail: plan.chosen_rail,
            cancelledAt: new Date().toISOString(),
            userConfirmed: false,
          },
        });
    }

    setTimeout(() => navigate('/home'), 1500);
  };

  const handleCancel = () => {
    navigate('/home');
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-foreground font-medium mb-2">Unable to proceed</p>
        <p className="text-muted-foreground text-sm text-center">{error}</p>
        <Button variant="ghost" onClick={() => navigate("/home")} className="mt-6">
          Return to Home
        </Button>
      </div>
    );
  }

  if (!plan || !intent) return null;

  const amount = Number(intent.amount);
  const railName = getRailDisplayName(plan.chosen_rail);
  const canHandoff = supportsAppHandoff(plan.chosen_rail);
  const isMobile = isMobileDevice();

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <AnimatePresence mode="wait">
        {/* Ready State - Show payment summary and open button */}
        {state === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-6"
          >
            {/* Payment Summary */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <p className="text-muted-foreground text-lg mb-2">Pay</p>
                <p className="text-5xl font-semibold text-foreground tracking-tight">
                  {intent.currency} {amount.toFixed(2)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <p className="text-muted-foreground">to</p>
                <p className="text-2xl font-medium text-foreground mt-1">
                  {intent.payee_name}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 bg-secondary/60 rounded-2xl px-5 py-3"
              >
                {railIcons[plan.chosen_rail] || <Wallet className="w-6 h-6" />}
                <span className="text-foreground font-medium">via {railName}</span>
              </motion.div>

              {!isMobile && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xs text-muted-foreground mt-6 max-w-xs"
                >
                  For the best experience, use FLOW on your mobile device
                </motion.p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pb-10 space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  onClick={handleOpenWallet}
                  className="w-full py-6 text-lg rounded-2xl"
                  size="lg"
                >
                  <span>Open {railName}</span>
                  <ExternalLink className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="w-full text-muted-foreground"
                >
                  Cancel
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Handed Off State - Waiting for user to return */}
        {state === 'handed_off' && (
          <motion.div
            key="handed_off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
            >
              <ExternalLink className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-xl font-medium text-foreground mb-2">
              Complete in {railName}
            </p>
            <p className="text-muted-foreground">
              Return here when done
            </p>
            
            <Button
              variant="ghost"
              onClick={() => setState('confirming')}
              className="mt-8 text-muted-foreground"
            >
              I'm back
            </Button>
          </motion.div>
        )}

        {/* Confirming State - Ask if payment was completed */}
        {state === 'confirming' && (
          <motion.div
            key="confirming"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-6"
          >
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8"
              >
                <p className="text-2xl font-semibold text-foreground mb-4">
                  Did you complete the payment?
                </p>
                <p className="text-muted-foreground">
                  {intent.currency} {amount.toFixed(2)} to {intent.payee_name}
                </p>
              </motion.div>
            </div>

            <div className="pb-10 space-y-3">
              <Button
                onClick={handleConfirmComplete}
                className="w-full py-6 text-lg rounded-2xl bg-success hover:bg-success/90"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Yes, it's done
              </Button>

              <Button
                variant="outline"
                onClick={handleConfirmNotComplete}
                className="w-full py-6 text-lg rounded-2xl"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                No, I didn't pay
              </Button>
            </div>
          </motion.div>
        )}

        {/* Complete State */}
        {state === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-20 h-20 rounded-full bg-success flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-success-foreground" />
            </motion.div>
            <p className="text-xl font-medium text-foreground mt-6">Payment recorded</p>
          </motion.div>
        )}

        {/* Cancelled State */}
        {state === 'cancelled' && (
          <motion.div
            key="cancelled"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-20 h-20 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-10 h-10 text-muted-foreground" />
            </motion.div>
            <p className="text-xl font-medium text-foreground mt-6">Payment cancelled</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HandoffPage;
