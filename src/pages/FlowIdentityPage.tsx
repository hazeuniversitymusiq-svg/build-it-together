import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Fingerprint, 
  Link2, 
  Layers,
  Scan,
  Send,
  Receipt,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSurfaceAnalytics } from "@/hooks/useSurfaceAnalytics";

interface StatusItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const FlowIdentityPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { logUsage } = useSurfaceAnalytics();
  const [connectionCount, setConnectionCount] = useState(0);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [appMode, setAppMode] = useState("Prototype");
  const [showFlowOptions, setShowFlowOptions] = useState(false);

  // Log identity_card surface usage when "Use Flow" is tapped
  const handleUseFlow = async () => {
    // Log surface usage - does not affect any resolution logic
    await logUsage('identity_card');
    setShowFlowOptions(true);
  };

  const flowOptions = [
    { 
      icon: <Scan className="w-6 h-6" />, 
      label: "Scan", 
      description: "Scan QR to pay",
      action: () => navigate("/scan") 
    },
    { 
      icon: <Send className="w-6 h-6" />, 
      label: "Send Money", 
      description: "Send to contacts",
      action: () => navigate("/send") 
    },
    { 
      icon: <Receipt className="w-6 h-6" />, 
      label: "Bills", 
      description: "Pay your bills",
      action: () => navigate("/bills") 
    },
  ];

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user settings
      const { data: userData } = await supabase
        .from("users")
        .select("biometric_enabled, app_mode")
        .eq("id", user.id)
        .single();

      if (userData) {
        setBiometricsEnabled(userData.biometric_enabled);
        setAppMode(userData.app_mode);
      }

      // Count linked connectors
      const { count } = await supabase
        .from("connectors")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "available");

      setConnectionCount(count || 0);
    };

    loadUserData();
  }, []);

  const statusItems: StatusItem[] = [
    {
      icon: <ShieldCheck className="w-4 h-4" />,
      label: "Identity",
      value: "Active",
      color: "text-success",
    },
    {
      icon: <Fingerprint className="w-4 h-4" />,
      label: "Security",
      value: biometricsEnabled ? "Biometrics enabled" : "PIN only",
      color: biometricsEnabled ? "text-success" : "text-muted-foreground",
    },
    {
      icon: <Link2 className="w-4 h-4" />,
      label: "Connections",
      value: `${connectionCount} linked`,
      color: connectionCount > 0 ? "text-primary" : "text-muted-foreground",
    },
    {
      icon: <Layers className="w-4 h-4" />,
      label: "Mode",
      value: appMode,
      color: "text-accent",
    },
  ];

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-blue/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background glow */}
      <div className="absolute top-10 right-0 w-72 h-72 bg-aurora-blue/20 blur-3xl rounded-full" />
      <div className="absolute bottom-40 left-0 w-56 h-56 bg-aurora-purple/15 blur-3xl rounded-full" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-6 relative z-10"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Flow Identity
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Your Flow Identity is now active.
        </p>
        <p className="text-muted-foreground leading-relaxed mt-2">
          It represents your verified identity, device, and connected payment ecosystem.
        </p>
      </motion.div>

      {/* Status Indicators - Glass cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-3 mb-8 relative z-10"
      >
        {statusItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            className="glass-card flex items-center justify-between py-3 px-4"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                {item.icon}
              </div>
              <span className="text-foreground font-medium">{item.label}</span>
            </div>
            <span className={`text-sm font-medium ${item.color}`}>
              {item.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Identity Card - Aurora gradient */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex-1 flex items-center justify-center relative z-10"
      >
        <div className="w-full max-w-sm aspect-[1.6/1] rounded-3xl aurora-gradient p-6 flex flex-col justify-between shadow-glow-aurora">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
              Flow Identity
            </p>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-sm">Active</span>
            </div>
            <p className="text-white text-lg font-semibold">
              FLOW
            </p>
          </div>
        </div>
      </motion.div>

      {/* Card Subtext */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="py-6 text-center relative z-10"
      >
        <p className="text-sm text-muted-foreground">
          This is not a payment card.
        </p>
        <p className="text-sm text-muted-foreground">
          Flow always asks before any payment.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="py-6 space-y-3 relative z-10"
      >
        <Button
          onClick={handleUseFlow}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
        >
          Use Flow
        </Button>
        
        <button
          onClick={() => navigate("/auto-sync")}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View connections
        </button>
      </motion.div>

      {/* Flow Options Modal */}
      <AnimatePresence>
        {showFlowOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-end justify-center"
            onClick={() => setShowFlowOptions(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg glass rounded-t-3xl p-6 pb-10 safe-area-bottom border-t border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Use Flow</h2>
                <button
                  onClick={() => setShowFlowOptions(false)}
                  className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                {flowOptions.map((option, index) => (
                  <motion.button
                    key={option.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      setShowFlowOptions(false);
                      option.action();
                    }}
                    className="w-full glass-card flex items-center gap-4 p-4 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-xl aurora-gradient flex items-center justify-center text-white shadow-glow-aurora">
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
FlowIdentityPage.displayName = "FlowIdentityPage";

export default FlowIdentityPage;
