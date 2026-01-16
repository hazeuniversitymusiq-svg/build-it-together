/**
 * FLOW Resolve Page - Phase 3
 * 
 * Runs ResolveEngine, shows animated steps, navigates to Confirm
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Check, ArrowRight, Wallet, CreditCard, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveIntent } from "@/lib/core/resolve-engine";
import type { ResolutionPlan, ResolutionStep } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTestMode, getConfirmRoute } from "@/hooks/useTestMode";

const stepIcons: Record<string, React.ReactNode> = {
  TOP_UP: <Wallet className="w-5 h-5" />,
  PAY: <CreditCard className="w-5 h-5" />,
};

const StepItem = forwardRef<HTMLDivElement, {
  step: ResolutionStep;
  index: number;
  isActive: boolean;
  isComplete: boolean;
}>((props, ref) => {
  const { step, index, isActive, isComplete } = props;
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: isActive || isComplete ? 1 : 0.4, 
        x: 0 
      }}
      transition={{ duration: 0.4, delay: index * 0.3 }}
      className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
        isComplete 
          ? "bg-success/10 border border-success/20"
          : isActive
          ? "bg-primary/10 border border-primary/20"
          : "bg-muted/50 border border-transparent"
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isComplete 
          ? "bg-success text-success-foreground"
          : isActive
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}>
        {isComplete ? (
          <Check className="w-5 h-5" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          stepIcons[step.action] || <ArrowRight className="w-5 h-5" />
        )}
      </div>
      <div className="flex-1">
        <p className={`font-medium ${
          isComplete || isActive ? "text-foreground" : "text-muted-foreground"
        }`}>
          {step.description}
        </p>
      </div>
    </motion.div>
  );
});
StepItem.displayName = "StepItem";

const ResolvePage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { intentId } = useParams<{ intentId: string }>();
  const { toast } = useToast();
  const { mode } = useTestMode();
  
  const [plan, setPlan] = useState<ResolutionPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runResolve = async () => {
      if (!intentId) {
        setError("No payment request found");
        setIsResolving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get device ID (or use default for prototype)
      const { data: userData } = await supabase
        .from("users")
        .select("device_id")
        .eq("id", user.id)
        .single();

      const deviceId = userData?.device_id || "prototype-device";

      // Run resolve engine
      const result = await resolveIntent(user.id, deviceId, intentId);

      if (!result.success || !result.plan || !result.planId) {
        setError(result.error || "Failed to resolve payment");
        setIsResolving(false);
        toast({
          title: "Resolution failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setPlan(result.plan);
      setPlanId(result.planId);
      setIsResolving(false);

      // Animate steps sequentially
      for (let i = 0; i < result.plan.steps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Mark all complete and navigate
      setCurrentStepIndex(result.plan.steps.length);
      
      // Small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate based on test mode setting
      navigate(getConfirmRoute(result.planId, mode));
    };

    runResolve();
  }, [intentId, navigate, toast, mode]);

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-4 pb-2"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Resolving
        </h1>
      </motion.div>

      {/* Body */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-muted-foreground mb-8"
      >
        FLOW is preparing the best route.
      </motion.p>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center">
        {isResolving ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-muted-foreground">Analyzing payment options...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-foreground font-medium mb-2">Unable to resolve</p>
            <p className="text-muted-foreground text-sm">{error}</p>
            <button
              onClick={() => navigate("/scan")}
              className="mt-6 text-primary hover:underline"
            >
              Go back to scan
            </button>
          </motion.div>
        ) : plan ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {plan.steps.map((step, index) => (
              <StepItem
                key={index}
                step={step}
                index={index}
                isActive={currentStepIndex === index}
                isComplete={currentStepIndex > index}
              />
            ))}
          </motion.div>
        ) : null}
      </div>

      {/* Helper Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="py-8 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span>You will always confirm before payment.</span>
        </div>
      </motion.div>
    </div>
  );
});
ResolvePage.displayName = "ResolvePage";

export default ResolvePage;
