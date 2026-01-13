/**
 * FLOW Settings Page
 * 
 * iOS 26 Liquid Glass design - Payment sources, guardrails, security
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useOrchestration } from "@/contexts/OrchestrationContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/hooks/useAuth";
import { useTestMode } from "@/hooks/useTestMode";
import { KillSwitch } from "@/components/settings/KillSwitch";
import PaymentSourcesManager from "@/components/settings/PaymentSourcesManager";
import PaymentRailsManager from "@/components/settings/PaymentRailsManager";
import CardLinkingManager from "@/components/settings/CardLinkingManager";
import FallbackPreferenceSelector from "@/components/settings/FallbackPreferenceSelector";
import { BankPartnerDemo } from "@/components/demo/BankPartnerDemo";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronRight, 
  ChevronDown,
  Wallet, 
  Shield, 
  Bell,
  DollarSign,
  LogOut,
  FlaskConical,
  Smartphone,
  CreditCard,
  Building2,
  Route,
  ArrowLeftRight,
  ExternalLink
} from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { guardrails } = useOrchestration();
  const { isWebAuthnRegistered } = useSecurity();
  const { signOut } = useAuth();
  const { toggleMode, isFieldTest } = useTestMode();
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [isBankDemoExpanded, setIsBankDemoExpanded] = useState(true);
  const [isRailsExpanded, setIsRailsExpanded] = useState(false);
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [isFallbackExpanded, setIsFallbackExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <header className="px-6 pt-14 pb-6">
        <p className="text-muted-foreground text-sm mb-1">Configuration</p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Settings</h1>
      </header>

      {/* Bank Partner Demo - NEW */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsBankDemoExpanded(!isBankDemoExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-aurora-teal" />
            <p className="text-sm font-medium text-muted-foreground">Bank Partner Demo</p>
          </div>
          <motion.div
            animate={{ rotate: isBankDemoExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isBankDemoExpanded ? "auto" : 0,
            opacity: isBankDemoExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="glass-card rounded-2xl p-4 shadow-float">
            <BankPartnerDemo />
          </div>
        </motion.div>
      </section>

      {/* Payment Rails - NEW */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsRailsExpanded(!isRailsExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-aurora-purple" />
            <p className="text-sm font-medium text-muted-foreground">Payment Rails</p>
          </div>
          <motion.div
            animate={{ rotate: isRailsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isRailsExpanded ? "auto" : 0,
            opacity: isRailsExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <PaymentRailsManager />
        </motion.div>
      </section>

      {/* Linked Cards - NEW */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsCardsExpanded(!isCardsExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-medium text-muted-foreground">Linked Cards</p>
          </div>
          <motion.div
            animate={{ rotate: isCardsExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isCardsExpanded ? "auto" : 0,
            opacity: isCardsExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <CardLinkingManager />
        </motion.div>
      </section>

      {/* Fallback Preference - NEW */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsFallbackExpanded(!isFallbackExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Fallback Preference</p>
          </div>
          <motion.div
            animate={{ rotate: isFallbackExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isFallbackExpanded ? "auto" : 0,
            opacity: isFallbackExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <FallbackPreferenceSelector />
        </motion.div>
      </section>

      {/* Payment Sources - Expandable */}
      <section className="px-6 mb-6">
        <button
          onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-aurora-blue" />
            <p className="text-sm font-medium text-muted-foreground">Payment Sources</p>
          </div>
          <motion.div
            animate={{ rotate: isSourcesExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.div>
        </button>
        
        <motion.div
          initial={false}
          animate={{ 
            height: isSourcesExpanded ? "auto" : 0,
            opacity: isSourcesExpanded ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <PaymentSourcesManager />
        </motion.div>
      </section>

      {/* Guardrails */}
      <section className="px-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-aurora-purple" />
          <p className="text-sm font-medium text-muted-foreground">Guardrails</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl overflow-hidden shadow-float"
        >
          <div className="divide-y divide-border/30">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-aurora-purple" />
                </div>
                <span className="text-foreground">Auto-approve limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">
                  RM {guardrails.maxSinglePaymentAuto}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-aurora-purple" />
                </div>
                <span className="text-foreground">Max auto top-up</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">
                  RM {guardrails.maxAutoTopUpAmount}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-aurora-purple" />
                </div>
                <span className="text-foreground">Daily auto limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-medium">
                  RM {guardrails.dailyAutoLimit}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Kill Switch */}
      <section className="px-6 mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          Emergency Controls
        </p>
        <KillSwitch />
      </section>

      {/* Test Mode */}
      <section className="px-6 mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">Mode</p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-card rounded-2xl p-4 shadow-float transition-all ${
            isFieldTest ? 'aurora-border' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isFieldTest ? 'aurora-gradient shadow-glow-blue' : 'bg-muted'
              }`}>
                {isFieldTest ? (
                  <Smartphone className="w-5 h-5 text-white" />
                ) : (
                  <FlaskConical className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <span className="text-foreground font-medium">
                  {isFieldTest ? "Field Test" : "Prototype"}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isFieldTest 
                    ? "Opens real wallet apps" 
                    : "Simulates payment flow"}
                </p>
              </div>
            </div>
            <Switch 
              checked={isFieldTest} 
              onCheckedChange={toggleMode}
            />
          </div>
        </motion.div>
      </section>

      {/* Security */}
      <section className="px-6 mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-4">Security</p>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl overflow-hidden shadow-float"
        >
          <div className="divide-y divide-border/30">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center">
                  <Shield className="w-5 h-5 text-aurora-teal" />
                </div>
                <span className="text-foreground">Face ID</span>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                isWebAuthnRegistered 
                  ? "bg-success/10 text-success" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {isWebAuthnRegistered ? "Enabled" : "Not set up"}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4">
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
            </div>
          </div>
        </motion.div>
      </section>

      {/* Partner Portal Link */}
      <div className="px-6 mb-6">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28 }}
          onClick={() => navigate('/partner')}
          className="w-full py-4 flex items-center justify-center gap-2 text-primary glass-card rounded-2xl shadow-float hover:bg-primary/5 transition-colors"
        >
          <Building2 className="w-5 h-5" />
          <span className="font-medium">Bank Partner Portal</span>
          <ExternalLink className="w-4 h-4 ml-1" />
        </motion.button>
      </div>

      {/* Sign Out */}
      <div className="px-6 pb-8">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
