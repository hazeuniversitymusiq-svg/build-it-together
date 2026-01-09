/**
 * FLOW Settings Page
 * 
 * Funding sources, guardrails, security settings, and kill switch.
 */

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import { useOrchestration } from "@/contexts/OrchestrationContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/hooks/useAuth";
import { useTestMode } from "@/hooks/useTestMode";
import { KillSwitch } from "@/components/settings/KillSwitch";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronRight, 
  Wallet, 
  Building2, 
  CreditCard, 
  Shield, 
  Bell,
  DollarSign,
  LogOut,
  FlaskConical,
  Smartphone
} from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { sources, guardrails, walletBalance } = useOrchestration();
  const { isWebAuthnRegistered } = useSecurity();
  const { signOut } = useAuth();
  const { mode, toggleMode, isFieldTest } = useTestMode();

  const railIcons = {
    wallet: Wallet,
    bank: Building2,
    card: CreditCard,
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header */}
        <header className="px-6 pt-8 pb-6 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Settings</h1>
        </header>

        {/* Funding Stack */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Funding Stack</p>
          <div className="space-y-0 divide-y divide-border/50">
            {sources
              .sort((a, b) => a.priority - b.priority)
              .map((source, index) => {
                const Icon = railIcons[source.type];
                return (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <span className="text-foreground">{source.name}</span>
                        {source.type === 'wallet' && (
                          <p className="text-xs text-muted-foreground">
                            ${walletBalance.toFixed(2)} balance
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Priority {source.priority}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        source.isLinked ? "bg-success" : "bg-muted-foreground/30"
                      }`} />
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>

        {/* Guardrails */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Guardrails</p>
          <div className="space-y-0 divide-y divide-border/50">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Auto-approve limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  ${guardrails.maxSinglePaymentAuto}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Max auto top-up</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  ${guardrails.maxAutoTopUpAmount}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Daily auto limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  ${guardrails.dailyAutoLimit}
                </span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>
          </div>
        </section>

        {/* Kill Switch */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Emergency Controls</p>
          <KillSwitch />
        </section>

        {/* Test Mode */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Test Mode</p>
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isFieldTest ? (
                  <Smartphone className="w-5 h-5 text-primary" />
                ) : (
                  <FlaskConical className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <span className="text-foreground font-medium">
                    {isFieldTest ? "Field Test Mode" : "Prototype Mode"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isFieldTest 
                      ? "Opens real wallet apps for payment" 
                      : "Simulates payment execution"}
                  </p>
                </div>
              </div>
              <Switch 
                checked={isFieldTest} 
                onCheckedChange={toggleMode}
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="px-6 mb-8">
          <p className="text-sm text-muted-foreground mb-4">Security</p>
          <div className="space-y-0 divide-y divide-border/50">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Face ID</span>
              </div>
              <span className={isWebAuthnRegistered ? "text-success" : "text-muted-foreground"}>
                {isWebAuthnRegistered ? "Enabled" : "Not set up"}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground">Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">On</span>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            </div>
          </div>
        </section>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sign Out */}
        <div className="px-6 pb-8">
          <button 
            onClick={handleSignOut}
            className="w-full py-4 flex items-center justify-center gap-2 text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            FLOW 1.0
          </p>
        </div>
      </div>
      
      <BottomNav />
    </MobileShell>
  );
};

export default SettingsPage;
