/**
 * FLOW Connect Apps Page
 * 
 * Apple-inspired minimal design - smart defaults, single action
 * Clean unified list, no tabs, confidence-inspiring
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Building2, 
  Receipt, 
  Landmark, 
  Check, 
  ShieldCheck, 
  Loader2,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// App type definition
interface AppConfig {
  name: string;
  description: string;
  icon: React.ElementType;
  recommended?: boolean;
}

// App configuration - centralized data
const WALLET_APPS: AppConfig[] = [
  { name: "TouchNGo", description: "Malaysia's #1 e-wallet", icon: Wallet, recommended: true },
  { name: "GrabPay", description: "Merchant payments", icon: Wallet, recommended: true },
  { name: "Boost", description: "Cashback rewards", icon: Wallet },
];

const BANK_APPS: AppConfig[] = [
  { name: "Maybank", description: "Bank transfers", icon: Landmark, recommended: true },
];

const BNPL_APPS: AppConfig[] = [
  { name: "Atome", description: "Split payments, 0% interest", icon: CreditCard, recommended: true },
  { name: "SPayLater", description: "Shopee Pay Later", icon: CreditCard },
];

const BILL_APPS: AppConfig[] = [
  { name: "TNB", description: "Electricity", icon: Receipt },
  { name: "Unifi", description: "Internet", icon: Receipt },
  { name: "Maxis", description: "Mobile", icon: Receipt },
];

const ALL_APP_NAMES = [...WALLET_APPS, ...BANK_APPS, ...BNPL_APPS, ...BILL_APPS].map(a => a.name);

interface AppItemProps {
  name: string;
  description: string;
  icon: React.ElementType;
  selected: boolean;
  recommended?: boolean;
  onToggle: () => void;
  delay: number;
}

const AppItem = ({ name, description, icon: Icon, selected, recommended, onToggle, delay }: AppItemProps) => (
  <motion.button
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay }}
    onClick={onToggle}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
      selected 
        ? "bg-primary/5 ring-1 ring-primary/20" 
        : "hover:bg-muted/50"
    }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
      selected 
        ? "aurora-gradient shadow-glow-aurora" 
        : "bg-muted"
    }`}>
      <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-muted-foreground"}`} />
    </div>
    
    <div className="flex-1 text-left">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{name}</span>
        {recommended && !selected && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-blue/10 text-aurora-blue font-medium">
            Recommended
          </span>
        )}
      </div>
      <span className="text-sm text-muted-foreground">{description}</span>
    </div>
    
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
      selected 
        ? "aurora-gradient shadow-glow-aurora" 
        : "border-2 border-muted-foreground/30"
    }`}>
      {selected && <Check className="w-3.5 h-3.5 text-white" />}
    </div>
  </motion.button>
);

const SectionHeader = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
  <motion.p 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay }}
    className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 pt-6 pb-2"
  >
    {children}
  </motion.p>
);

const AutoSyncPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [alreadyConnected, setAlreadyConnected] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing connections and set smart defaults
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: existingConnectors } = await supabase
          .from("connectors")
          .select("name")
          .eq("user_id", user.id);
        
        const connectedNames: string[] = existingConnectors?.map(c => c.name as string) || [];
        setAlreadyConnected(new Set(connectedNames));
        
        // Smart defaults: pre-select recommended apps not already connected
        const defaults = new Set<string>();
        [...WALLET_APPS, ...BANK_APPS, ...BNPL_APPS].forEach(app => {
          if (app.recommended && !connectedNames.includes(app.name)) {
            defaults.add(app.name);
          }
        });
        setSelectedApps(defaults);
      }
      
      setIsLoading(false);
    };
    init();
  }, []);

  const toggleApp = useCallback((name: string) => {
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const connectApps = useCallback(async () => {
    if (selectedApps.size === 0) return;
    
    setIsSyncing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setIsSyncing(false);
      return;
    }

    const defaultBalances: Record<string, number> = {
      TouchNGo: 85.50,
      GrabPay: 42.00,
      Boost: 25.00,
      Maybank: 1250.00,
      Atome: 500.00,
      SPayLater: 300.00,
    };

    // BNPL credit limits
    const bnplLimits: Record<string, number> = {
      Atome: 1500.00,
      SPayLater: 1000.00,
    };

    let priority = 1;
    
    for (const appName of selectedApps) {
      // Determine app type
      const isWallet = WALLET_APPS.some(w => w.name === appName);
      const isBank = BANK_APPS.some(b => b.name === appName);
      const isBnpl = BNPL_APPS.some(b => b.name === appName);
      const isBiller = BILL_APPS.some(b => b.name === appName);
      
      const connectorType = isWallet ? "wallet" : isBank ? "bank" : isBnpl ? "bnpl" : "biller";
      
      // Create connector
      const capabilities: Record<string, boolean> = {};
      if (isWallet) {
        capabilities.can_pay_qr = true;
        capabilities.can_p2p = true;
        capabilities.can_receive = true;
      } else if (isBank) {
        capabilities.can_pay = true;
        capabilities.can_transfer = true;
      } else if (isBnpl) {
        capabilities.can_pay_qr = true;
        capabilities.can_pay = true;
        capabilities.can_installment = true;
      }

      await supabase.from("connectors").upsert({
        user_id: user.id,
        name: appName as any,
        type: connectorType,
        status: "available",
        mode: "Prototype",
        capabilities,
      }, { onConflict: "user_id,name" });

      // Create funding source for wallets, banks, and BNPL
      if (isWallet || isBank || isBnpl) {
        const balance = defaultBalances[appName] || 50.00;
        const sourceType = isWallet ? "wallet" : isBank ? "bank" : "bnpl";
        
        await supabase.from("funding_sources").upsert({
          user_id: user.id,
          name: appName,
          type: sourceType,
          balance: isBnpl ? bnplLimits[appName] || 500 : balance, // BNPL uses credit limit
          currency: "MYR",
          priority: isBnpl ? priority + 10 : priority, // BNPL lower priority
          linked_status: "linked",
          available: true,
          max_auto_topup_amount: isWallet ? 200 : isBank ? 500 : 0,
          require_extra_confirm_amount: isWallet ? 300 : isBank ? 1000 : 200,
        }, { onConflict: "user_id,name" });
        priority++;
      }

      // Create biller account
      if (isBiller) {
        await supabase.from("biller_accounts").upsert({
          user_id: user.id,
          biller_name: appName,
          account_reference: `ACC-${Date.now()}`,
          status: "linked",
        }, { onConflict: "user_id,biller_name" });
      }
    }

    toast({ 
      title: "Connected", 
      description: `${selectedApps.size} app${selectedApps.size !== 1 ? 's' : ''} linked to FLOW` 
    });
    
    navigate("/home");
  }, [selectedApps, toast, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const newAppsToConnect = [...selectedApps].filter(app => !alreadyConnected.has(app));

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="px-6 pt-14 pb-2">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-primary mb-4 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Connect Apps
          </h1>
          <p className="text-muted-foreground mt-1">
            Select payment apps for FLOW to use
          </p>
        </motion.div>
      </header>

      {/* App List */}
      <div className="flex-1 overflow-y-auto px-2">
        {/* Wallets */}
        <SectionHeader delay={0.1}>Wallets</SectionHeader>
        {WALLET_APPS.map((app, i) => (
          <AppItem
            key={app.name}
            name={app.name}
            description={app.description}
            icon={app.icon}
            selected={selectedApps.has(app.name) || alreadyConnected.has(app.name)}
            recommended={app.recommended}
            onToggle={() => !alreadyConnected.has(app.name) && toggleApp(app.name)}
            delay={0.15 + i * 0.05}
          />
        ))}

        {/* Banks */}
        <SectionHeader delay={0.3}>Banks</SectionHeader>
        {BANK_APPS.map((app, i) => (
          <AppItem
            key={app.name}
            name={app.name}
            description={app.description}
            icon={app.icon}
            selected={selectedApps.has(app.name) || alreadyConnected.has(app.name)}
            recommended={app.recommended}
            onToggle={() => !alreadyConnected.has(app.name) && toggleApp(app.name)}
            delay={0.35 + i * 0.05}
          />
        ))}

        {/* BNPL */}
        <SectionHeader delay={0.4}>Buy Now Pay Later</SectionHeader>
        {BNPL_APPS.map((app, i) => (
          <AppItem
            key={app.name}
            name={app.name}
            description={app.description}
            icon={app.icon}
            selected={selectedApps.has(app.name) || alreadyConnected.has(app.name)}
            recommended={app.recommended}
            onToggle={() => !alreadyConnected.has(app.name) && toggleApp(app.name)}
            delay={0.45 + i * 0.05}
          />
        ))}

        {/* Bills */}
        <SectionHeader delay={0.5}>Bills</SectionHeader>
        {BILL_APPS.map((app, i) => (
          <AppItem
            key={app.name}
            name={app.name}
            description={app.description}
            icon={app.icon}
            selected={selectedApps.has(app.name) || alreadyConnected.has(app.name)}
            onToggle={() => !alreadyConnected.has(app.name) && toggleApp(app.name)}
            delay={0.55 + i * 0.05}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 pt-4 space-y-4">
        {/* Trust message */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>FLOW never moves money without your confirmation</span>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={connectApps}
            disabled={isSyncing || newAppsToConnect.length === 0}
            className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora disabled:opacity-50 disabled:shadow-none"
          >
            {isSyncing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : newAppsToConnect.length > 0 ? (
              `Connect ${newAppsToConnect.length} App${newAppsToConnect.length !== 1 ? 's' : ''}`
            ) : selectedApps.size > 0 ? (
              "Already Connected"
            ) : (
              "Select Apps"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AutoSyncPage;
