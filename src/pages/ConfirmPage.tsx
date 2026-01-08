/**
 * FLOW Confirm Page - Screen 8
 * 
 * Shows payment summary, handles biometric confirmation,
 * executes plan, and navigates to Done screen.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Fingerprint, 
  X, 
  AlertTriangle, 
  Pause, 
  ArrowRight, 
  Wallet, 
  CreditCard,
  Building2,
  RefreshCw,
  Check,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { executePlan } from "@/lib/core/execute-plan";
import { useSecurity } from "@/contexts/SecurityContext";
import { useFlowPause } from "@/hooks/useFlowPause";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type ResolutionPlan = Database['public']['Tables']['resolution_plans']['Row'];
type Intent = Database['public']['Tables']['intents']['Row'];

const railIcons: Record<string, React.ReactNode> = {
  TouchNGo: <Wallet className="w-5 h-5" />,
  GrabPay: <Wallet className="w-5 h-5" />,
  Boost: <Wallet className="w-5 h-5" />,
  DuitNow: <Building2 className="w-5 h-5" />,
  BankTransfer: <Building2 className="w-5 h-5" />,
  Maybank: <Building2 className="w-5 h-5" />,
  VisaMastercard: <CreditCard className="w-5 h-5" />,
};

interface ConfirmState {
  plan: ResolutionPlan | null;
  intent: Intent | null;
  isLoading: boolean;
  error: string | null;
}

const ConfirmPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const { toast } = useToast();
  const { authorizePayment, isAuthenticating, clearAuthorization } = useSecurity();
  const { isPaused, isLoading: isPauseLoading } = useFlowPause();

  const [state, setState] = useState<ConfirmState>({
    plan: null,
    intent: null,
    isLoading: true,
    error: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [recoveryRail, setRecoveryRail] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  // Load plan and intent data
  useEffect(() => {
    const loadData = async () => {
      if (!planId) {
        setState(prev => ({ ...prev, isLoading: false, error: "No payment plan found" }));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch plan
      const { data: plan, error: planError } = await supabase
        .from("resolution_plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (planError || !plan) {
        setState(prev => ({ ...prev, isLoading: false, error: "Payment plan not found" }));
        return;
      }

      // Fetch intent
      const { data: intent, error: intentError } = await supabase
        .from("intents")
        .select("*")
        .eq("id", plan.intent_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (intentError || !intent) {
        setState(prev => ({ ...prev, isLoading: false, error: "Payment request not found" }));
        return;
      }

      // Set recovery rail if fallback exists
      if (plan.fallback_rail) {
        setRecoveryRail(plan.fallback_rail);
      }

      setState({
        plan,
        intent,
        isLoading: false,
        error: null,
      });
    };

    loadData();
  }, [planId, navigate]);

  // Check identity status
  const [identityBlocked, setIdentityBlocked] = useState(false);
  useEffect(() => {
    const checkIdentity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("identity_status")
        .eq("id", user.id)
        .single();

      if (userData && userData.identity_status !== "active") {
        setIdentityBlocked(true);
      }
    };
    checkIdentity();
  }, []);

  const handleConfirm = async () => {
    if (!state.plan || !state.intent) return;

    // Authorize with biometrics
    const authorized = await authorizePayment();
    if (!authorized) {
      toast({
        title: "Authentication failed",
        description: "Please try again",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: userData } = await supabase
        .from("users")
        .select("device_id")
        .eq("id", user.id)
        .single();

      const deviceId = userData?.device_id || "prototype-device";

      const result = await executePlan(user.id, deviceId, state.plan.id);

      if (!result.success) {
        // Check if we should show recovery option
        if (recoveryRail && result.failureType !== "user_paused") {
          setShowRecovery(true);
          setIsProcessing(false);
          return;
        }

        toast({
          title: "Payment failed",
          description: result.error || "Unable to complete payment",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      setIsComplete(true);
      clearAuthorization();

      // Navigate to done screen
      setTimeout(() => {
        navigate(`/done/${result.transactionId}`);
      }, 800);
    } catch (error) {
      console.error("Execution error:", error);
      toast({
        title: "Payment failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    clearAuthorization();
    navigate("/home");
  };

  const handleUseRecoveryRail = () => {
    // In a real implementation, this would re-resolve with the fallback rail
    toast({
      title: "Switching to fallback",
      description: `Using ${recoveryRail} instead`,
    });
    setShowRecovery(false);
    // For prototype, just retry with same plan
    handleConfirm();
  };

  // Determine if extra confirmation needed (high risk)
  const isHighRisk = state.plan?.risk_level === "high";

  // Render loading state
  if (state.isLoading || isPauseLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <ShieldAlert className="w-12 h-12 text-destructive mb-4" />
        <p className="text-foreground font-medium mb-2">Unable to confirm</p>
        <p className="text-muted-foreground text-sm text-center">{state.error}</p>
        <Button variant="ghost" onClick={() => navigate("/home")} className="mt-6">
          Return to Home
        </Button>
      </div>
    );
  }

  const { plan, intent } = state;
  if (!plan || !intent) return null;

  const amount = Number(intent.amount);
  const steps = plan.steps as Array<{ action: string; description: string; amount?: number; source?: string }>;
  const topupStep = steps.find(s => s.action === "TOP_UP");

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Confirm
        </h1>
      </motion.div>

      {/* Paused State */}
      {isPaused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <Pause className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">FLOW is paused.</p>
              <p className="text-sm text-muted-foreground">
                Unpause in Settings to continue.
              </p>
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2 text-primary"
                onClick={() => navigate("/settings")}
              >
                Go to Settings
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Identity Blocked State */}
      {identityBlocked && !isPaused && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Identity verification required.</p>
              <p className="text-sm text-muted-foreground">
                Your identity needs to be verified before you can make payments.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recovery State */}
      {showRecovery && !isPaused && !identityBlocked && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-warning/10 border border-warning/20 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground mb-1">We could not complete this route.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Try the recommended option below.
              </p>
              <Button 
                onClick={handleUseRecoveryRail}
                className="w-full"
                variant="outline"
              >
                <span>Use {recoveryRail} instead</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-card border border-border rounded-3xl p-6 mb-6"
      >
        {/* Pay to */}
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-muted-foreground">Pay to</span>
          <span className="font-medium text-foreground">{intent.payee_name}</span>
        </div>

        {/* Amount */}
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold text-xl text-foreground">
            {intent.currency} {amount.toFixed(2)}
          </span>
        </div>

        {/* Paying with */}
        <div className="flex justify-between items-center py-3 border-b border-border">
          <span className="text-muted-foreground">Paying with</span>
          <div className="flex items-center gap-2">
            {railIcons[plan.chosen_rail] || <Wallet className="w-5 h-5" />}
            <span className="font-medium text-foreground">{plan.chosen_rail}</span>
          </div>
        </div>

        {/* Fallback (if any) */}
        {plan.fallback_rail && (
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-muted-foreground">Fallback</span>
            <div className="flex items-center gap-2 text-muted-foreground">
              {railIcons[plan.fallback_rail] || <Wallet className="w-5 h-5" />}
              <span>{plan.fallback_rail}</span>
            </div>
          </div>
        )}

        {/* Top up (if any) */}
        {plan.topup_needed && topupStep && (
          <div className="flex justify-between items-center py-3">
            <span className="text-muted-foreground">Auto top-up</span>
            <span className="text-foreground">
              +{intent.currency} {Number(plan.topup_amount).toFixed(2)} from {topupStep.source}
            </span>
          </div>
        )}
      </motion.div>

      {/* Risk Message */}
      {isHighRisk && !isPaused && !identityBlocked && !showRecovery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 mb-6"
        >
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-foreground">
            Extra confirmation required for this amount.
          </p>
        </motion.div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3 pb-8"
      >
        {/* Primary Button */}
        <Button
          onClick={handleConfirm}
          disabled={isPaused || identityBlocked || isProcessing || isComplete || showRecovery}
          className="w-full h-14 text-base font-medium rounded-2xl"
          size="lg"
        >
          {isComplete ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Payment Complete
            </>
          ) : isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : isAuthenticating ? (
            <>
              <Fingerprint className="w-5 h-5 mr-2 animate-pulse" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 mr-2" />
              Confirm with biometrics
            </>
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={isProcessing || isComplete}
          className="w-full h-12 text-base text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5 mr-2" />
          Cancel
        </Button>
      </motion.div>
    </div>
  );
});
ConfirmPage.displayName = "ConfirmPage";

export default ConfirmPage;
