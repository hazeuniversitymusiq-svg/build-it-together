/**
 * FLOW Settings Page
 * 
 * iOS 26 Liquid Glass design - Clean, minimal settings UI
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DemoHighlight } from "@/components/demo/DemoHighlight";

import { useOrchestration } from "@/contexts/OrchestrationContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/hooks/useAuth";
import { useTestMode } from "@/hooks/useTestMode";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useOnboarding } from "@/hooks/useOnboarding";
import { KillSwitch } from "@/components/settings/KillSwitch";
import PaymentSourcesManager from "@/components/settings/PaymentSourcesManager";
import PaymentRailsManager from "@/components/settings/PaymentRailsManager";
import CardLinkingManager from "@/components/settings/CardLinkingManager";
import FallbackPreferenceSelector from "@/components/settings/FallbackPreferenceSelector";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronRight, 
  ChevronDown,
  Wallet, 
  Shield, 
  Bell,
  DollarSign,
  LogOut,
  Smartphone,
  CreditCard,
  Building2,
  Route,
  ArrowLeftRight,
  Clock,
  Settings2,
  Sliders,
  RotateCcw
} from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { guardrails } = useOrchestration();
  const { isWebAuthnRegistered } = useSecurity();
  const { signOut } = useAuth();
  const { toggleMode, isFieldTest } = useTestMode();
  const { 
    isFlowCardEnabled, 
    isNetworkEnabled, 
    isProvisioningEnabled, 
    setFlag,
    loading: flagsLoading 
  } = useFeatureFlags();
  const { resetOnboarding } = useOnboarding();
  
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  const [isLimitsExpanded, setIsLimitsExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleReplayOnboarding = () => {
    resetOnboarding();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <header className="px-6 pt-14 pb-6">
        <p className="text-muted-foreground text-sm mb-1">Account</p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
      </header>

      {/* Kill Switch - Primary Control */}
      <section className="px-6 mb-6">
        <DemoHighlight
          id="kill-switch"
          title="Emergency Kill Switch"
          description="Instantly pause all FLOW payments. Use this if you lose your phone or suspect fraud."
        >
          <KillSwitch />
        </DemoHighlight>
      </section>

      {/* Security */}
      <section className="px-6 mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">Security</p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden shadow-float"
        >
          <div className="divide-y divide-border/30">
            <button className="flex items-center justify-between p-4 w-full hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <Shield className="w-5 h-5 text-aurora-teal" />
                </div>
                <span className="text-foreground">Face ID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                  isWebAuthnRegistered 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {isWebAuthnRegistered ? "Enabled" : "Set up"}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </button>
            
            <button className="flex items-center justify-between p-4 w-full hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <Bell className="w-5 h-5 text-aurora-teal" />
                </div>
                <span className="text-foreground">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">On</span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </button>
          </div>
        </motion.div>
      </section>

      {/* Spending Limits - Collapsible */}
      <section className="px-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl overflow-hidden shadow-float"
        >
          <button
            onClick={() => setIsLimitsExpanded(!isLimitsExpanded)}
            className="flex items-center justify-between p-4 w-full hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                <Sliders className="w-5 h-5 text-aurora-purple" />
              </div>
              <div className="text-left">
                <span className="text-foreground font-medium">Spending Limits</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Auto-approve up to RM {guardrails.maxSinglePaymentAuto}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isLimitsExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </button>
          
          <motion.div
            initial={false}
            animate={{ 
              height: isLimitsExpanded ? "auto" : 0,
              opacity: isLimitsExpanded ? 1 : 0 
            }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/30 border-t border-border/30">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-aurora-purple" />
                  </div>
                  <span className="text-foreground text-sm">Auto-approve limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">
                    RM {guardrails.maxSinglePaymentAuto}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-aurora-purple" />
                  </div>
                  <span className="text-foreground text-sm">Max auto top-up</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">
                    RM {guardrails.maxAutoTopUpAmount}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-aurora-purple" />
                  </div>
                  <span className="text-foreground text-sm">Daily auto limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">
                    RM {guardrails.dailyAutoLimit}
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Advanced Settings */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Advanced</p>
          </div>
          <motion.div
            animate={{ rotate: isAdvancedExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isAdvancedExpanded ? "auto" : 0,
            opacity: isAdvancedExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden space-y-4"
        >
          {/* Mode Toggle - Moved to Advanced */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-float">
            <div className="p-3 border-b border-border/30 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mode</span>
            </div>
            <div className="p-4">
              <div className={`rounded-xl p-4 transition-all ${isFieldTest ? 'aurora-border bg-aurora-purple/5' : 'bg-muted/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isFieldTest ? 'aurora-gradient shadow-glow-blue' : 'bg-muted'
                    }`}>
                      <Smartphone className={`w-5 h-5 ${isFieldTest ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">
                        {isFieldTest ? "Field Test" : "Prototype"}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isFieldTest ? "Opens real wallet apps" : "Simulates payment flow"}
                      </p>
                    </div>
                  </div>
                  <Switch 
                    checked={isFieldTest} 
                    onCheckedChange={toggleMode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <DemoHighlight
            id="feature-flags"
            title="Feature Flags"
            description="Enable or disable experimental features like Flow Card, Network Mode, and Push Provisioning."
          >
            <div className="glass-card rounded-2xl overflow-hidden shadow-float">
              <div className="p-3 border-b border-border/30 bg-muted/20">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Feature Flags</span>
              </div>
              <div className="divide-y divide-border/30">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isFlowCardEnabled ? 'aurora-gradient shadow-glow-blue' : 'bg-muted'
                    }`}>
                      <CreditCard className={`w-5 h-5 ${isFlowCardEnabled ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Flow Card</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Digital card feature</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isFlowCardEnabled} 
                    onCheckedChange={(checked) => setFlag('flow_card_enabled', checked)}
                    disabled={flagsLoading}
                  />
                </div>

                <div className={`flex items-center justify-between p-4 transition-opacity ${!isFlowCardEnabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isNetworkEnabled ? 'bg-aurora-purple/20' : 'bg-muted'
                    }`}>
                      <Route className={`w-5 h-5 ${isNetworkEnabled ? 'text-aurora-purple' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Network Mode</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Virtual card network</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isNetworkEnabled} 
                    onCheckedChange={(checked) => setFlag('flow_card_network_enabled', checked)}
                    disabled={flagsLoading || !isFlowCardEnabled}
                  />
                </div>

                <div className={`flex items-center justify-between p-4 transition-opacity ${!isNetworkEnabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isProvisioningEnabled ? 'bg-aurora-teal/20' : 'bg-muted'
                    }`}>
                      <Wallet className={`w-5 h-5 ${isProvisioningEnabled ? 'text-aurora-teal' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <span className="text-foreground font-medium">Push Provisioning</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Apple Pay / Google Pay</p>
                    </div>
                  </div>
                  <Switch 
                    checked={isProvisioningEnabled} 
                    onCheckedChange={(checked) => setFlag('flow_card_push_provisioning_enabled', checked)}
                    disabled={flagsLoading || !isNetworkEnabled}
                  />
                </div>
              </div>
            </div>
          </DemoHighlight>

          {/* Payment Configuration */}
          <div className="glass-card rounded-2xl overflow-hidden shadow-float">
            <div className="p-3 border-b border-border/30 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Configuration</span>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-4 h-4 text-aurora-purple" />
                  <span className="text-sm font-medium text-foreground">Payment Rails</span>
                </div>
                <PaymentRailsManager />
              </div>
              
              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-foreground">Linked Cards</span>
                </div>
                <CardLinkingManager />
              </div>

              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Fallback Preference</span>
                </div>
                <FallbackPreferenceSelector />
              </div>

              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-aurora-blue" />
                  <span className="text-sm font-medium text-foreground">Payment Sources</span>
                </div>
                <PaymentSourcesManager />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Quick Links */}
      <section className="px-6 mb-6">
        <div className="flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/activity')}
            className="flex-1 glass-card rounded-2xl p-4 shadow-float flex items-center gap-3 hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
              <Clock className="w-5 h-5 text-aurora-blue" />
            </div>
            <span className="text-foreground font-medium text-sm">History</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/partner')}
            className="flex-1 glass-card rounded-2xl p-4 shadow-float flex items-center gap-3 hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Building2 className="w-5 h-5 text-foreground" />
            </div>
            <span className="text-foreground font-medium text-sm">Partner</span>
          </motion.button>
        </div>
      </section>

      {/* Sign Out & Replay Onboarding */}
      <div className="px-6 pb-8 space-y-3">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleReplayOnboarding}
          className="w-full py-3 flex items-center justify-center gap-2 text-muted-foreground glass-card rounded-2xl shadow-float hover:bg-muted/30 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="font-medium text-sm">Replay Onboarding</span>
        </motion.button>

        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          onClick={handleSignOut}
          className="w-full py-4 flex items-center justify-center gap-2 text-destructive glass-card rounded-2xl shadow-float hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </motion.button>
        <p className="text-center text-xs text-muted-foreground mt-6">
          FLOW 1.0 • Liquid Glass
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
