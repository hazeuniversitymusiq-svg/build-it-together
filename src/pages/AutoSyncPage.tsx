import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Building2, Receipt, Landmark, Check, ShieldCheck, Link2, Info, ChevronRight, Camera, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ScreenshotBalanceSync } from "@/components/balance/ScreenshotBalanceSync";

interface AvailableApp {
  id: string;
  app_name: string;
  app_type: "wallet" | "bank" | "biller";
  description: string;
  selected: boolean;
}

const appIcons: Record<string, React.ReactNode> = {
  "TouchNGo": <Wallet className="w-5 h-5" />,
  "GrabPay": <Wallet className="w-5 h-5" />,
  "Boost": <Wallet className="w-5 h-5" />,
  "Maybank": <Landmark className="w-5 h-5" />,
  "DuitNow": <Building2 className="w-5 h-5" />,
  "TNB": <Receipt className="w-5 h-5" />,
  "Unifi": <Receipt className="w-5 h-5" />,
  "Maxis": <Receipt className="w-5 h-5" />,
};

const appDescriptions: Record<string, string> = {
  "TouchNGo": "Pay QR codes and send money to friends",
  "GrabPay": "Pay at merchants and split bills",
  "Boost": "Cashback rewards and payments",
  "Maybank": "Direct bank transfers and payments",
  "TNB": "Electricity bill payments",
  "Unifi": "Internet and TV bill payments",
  "Maxis": "Mobile phone bill payments",
};

// All available apps that users can connect
const availableApps: Omit<AvailableApp, "id" | "selected">[] = [
  { app_name: "TouchNGo", app_type: "wallet", description: appDescriptions["TouchNGo"] },
  { app_name: "GrabPay", app_type: "wallet", description: appDescriptions["GrabPay"] },
  { app_name: "Boost", app_type: "wallet", description: appDescriptions["Boost"] },
  { app_name: "Maybank", app_type: "bank", description: appDescriptions["Maybank"] },
  { app_name: "TNB", app_type: "biller", description: appDescriptions["TNB"] },
  { app_name: "Unifi", app_type: "biller", description: appDescriptions["Unifi"] },
  { app_name: "Maxis", app_type: "biller", description: appDescriptions["Maxis"] },
];

const AppCard = forwardRef<HTMLDivElement, {
  app: AvailableApp;
  onToggle: () => void;
  delay: number;
}>(({ app, onToggle, delay }, ref) => {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onToggle}
      className={`glass-card p-4 transition-all cursor-pointer ${
        app.selected 
          ? "ring-2 ring-aurora-blue/50 bg-aurora-blue/5" 
          : "hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          app.app_type === "wallet" 
            ? "bg-aurora-blue/20 text-aurora-blue"
            : app.app_type === "bank"
            ? "bg-aurora-purple/20 text-aurora-purple"
            : "bg-aurora-pink/20 text-aurora-pink"
        }`}>
          {appIcons[app.app_name] || <Wallet className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">{app.app_name}</h3>
            {app.selected ? (
              <div className="w-5 h-5 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {app.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
});
AppCard.displayName = "AppCard";

const AutoSyncPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apps, setApps] = useState<AvailableApp[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("popular");
  const [isLoading, setIsLoading] = useState(true);
  const [showBalanceSync, setShowBalanceSync] = useState(false);

  // Initialize apps on mount
  useEffect(() => {
    const initApps = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check which apps are already connected
      let connectedNames: string[] = [];
      if (user) {
        const { data: existingConnectors } = await supabase
          .from("connectors")
          .select("name")
          .eq("user_id", user.id);
        connectedNames = existingConnectors?.map(c => c.name) || [];
      }

      // Initialize apps with pre-selected popular ones (not already connected)
      const popularApps = ["TouchNGo", "Maybank"];
      const initialApps: AvailableApp[] = availableApps.map((app, index) => ({
        ...app,
        id: `app-${index}`,
        selected: popularApps.includes(app.app_name) && !connectedNames.includes(app.app_name),
      }));

      setApps(initialApps);
      setIsLoading(false);
    };

    initApps();
  }, []);

  const toggleApp = (appId: string) => {
    setApps(prev => 
      prev.map(app => 
        app.id === appId ? { ...app, selected: !app.selected } : app
      )
    );
  };

  const connectSelectedApps = async () => {
    setIsSyncing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setIsSyncing(false);
      return;
    }

    const selectedApps = apps.filter(app => app.selected);

    // Default balances for simulation
    const defaultBalances: Record<string, number> = {
      TouchNGo: 85.50,
      GrabPay: 42.00,
      Boost: 25.00,
      Maybank: 1250.00,
    };

    // Create connectors and funding sources for selected apps
    let priority = 1;
    for (const app of selectedApps) {
      const connectorType = app.app_type === "wallet" ? "wallet" 
        : app.app_type === "bank" ? "bank" 
        : "biller";

      // Check if connector name is valid
      const validConnectorNames = ["TouchNGo", "GrabPay", "Boost", "DuitNow", "BankTransfer", "Maybank", "VisaMastercard", "Maxis", "Unifi", "TNB", "Contacts"];
      
      if (validConnectorNames.includes(app.app_name)) {
        // Create connector with capabilities
        const capabilities: Record<string, boolean> = {};
        if (app.app_type === "wallet") {
          capabilities.can_pay_qr = true;
          capabilities.can_p2p = true;
          capabilities.can_receive = true;
        } else if (app.app_type === "bank") {
          capabilities.can_pay = true;
          capabilities.can_transfer = true;
        }

        const { error: connectorError } = await supabase.from("connectors").upsert({
          user_id: user.id,
          name: app.app_name as any,
          type: connectorType,
          status: "available",
          mode: "Prototype",
          capabilities,
        }, { onConflict: "user_id,name" });

        if (connectorError) {
          console.error("Error creating connector:", connectorError);
        }

        // Create funding source for wallets and banks
        if (app.app_type === "wallet" || app.app_type === "bank") {
          const fundingType = app.app_type === "wallet" ? "wallet" : "bank";
          const balance = defaultBalances[app.app_name] || 50.00;

          const { error: fundingError } = await supabase.from("funding_sources").upsert({
            user_id: user.id,
            name: app.app_name,
            type: fundingType,
            balance,
            currency: "MYR",
            priority,
            linked_status: "linked",
            available: true,
            max_auto_topup_amount: fundingType === "wallet" ? 200 : 500,
            require_extra_confirm_amount: fundingType === "wallet" ? 300 : 1000,
          }, { onConflict: "user_id,name" });

          if (fundingError) {
            console.error("Error creating funding source:", fundingError);
          }
          priority++;
        }

        // For billers, create biller_accounts
        if (app.app_type === "biller") {
          const { error: billerError } = await supabase.from("biller_accounts").upsert({
            user_id: user.id,
            biller_name: app.app_name,
            account_reference: `ACC-${Date.now()}`,
            status: "linked",
          }, { onConflict: "user_id,biller_name" });

          if (billerError) {
            console.error("Error creating biller account:", billerError);
          }
        }
      }
    }

    toast({ 
      title: "Connected!", 
      description: `${selectedApps.length} app${selectedApps.length !== 1 ? 's' : ''} linked to FLOW` 
    });
    
    setIsSyncing(false);
    navigate("/home");
  };

  const getFilteredApps = (type?: string) => {
    if (!type || type === "popular") {
      return apps.filter(app => ["TouchNGo", "Maybank", "GrabPay"].includes(app.app_name));
    }
    const typeMap: Record<string, string> = {
      wallets: "wallet",
      bills: "biller",
      banks: "bank",
    };
    return apps.filter(app => app.app_type === typeMap[type]);
  };

  const selectedCount = apps.filter(app => app.selected).length;

  if (isLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-purple/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-purple/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background glow */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-aurora-purple/15 blur-3xl rounded-full" />
      <div className="absolute bottom-60 left-0 w-48 h-48 bg-aurora-blue/10 blur-3xl rounded-full" />
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-4 relative z-10"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Connect Your Apps
        </h1>
        <p className="text-muted-foreground">
          Choose which payment apps and bills you want FLOW to manage for you.
        </p>
      </motion.div>

      {/* FLOW Protocol - Balance Sync Option */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 mb-4"
      >
        <AnimatePresence mode="wait">
          {!showBalanceSync ? (
            <motion.button
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBalanceSync(true)}
              className="w-full glass-card p-4 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center shadow-glow-aurora">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground flex items-center gap-2">
                  Screenshot Balance Sync
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-purple/20 text-aurora-purple">NEW</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload a wallet screenshot → FLOW reads your balance
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-aurora-blue" />
            </motion.button>
          ) : (
            <motion.div
              key="sync"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ScreenshotBalanceSync
                onBalanceExtracted={(extraction) => {
                  console.log("Balance extracted:", extraction);
                }}
                onApplyBalance={async (balance, walletName) => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) return;
                  
                  // Update or create the funding source
                  await supabase.from("funding_sources").upsert({
                    user_id: user.id,
                    name: walletName,
                    type: "wallet",
                    balance,
                    currency: "MYR",
                    priority: 1,
                    linked_status: "linked",
                    available: true,
                    max_auto_topup_amount: 200,
                    require_extra_confirm_amount: 300,
                  }, { onConflict: "user_id,name" });
                  
                  toast({
                    title: "Balance synced!",
                    description: `${walletName}: RM ${balance.toFixed(2)}`,
                  });
                  setShowBalanceSync(false);
                }}
              />
              <button
                onClick={() => setShowBalanceSync(false)}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* How it works hint */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="glass-card p-3 mb-4 relative z-10"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-aurora-blue/10 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-aurora-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">How linking works</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap to select apps → Connect them → FLOW will help you pay using these apps when you scan QR codes.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Content - App List */}
      <div className="flex-1 flex flex-col relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 h-12 mb-4 glass rounded-xl p-1">
            <TabsTrigger value="popular" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Popular</TabsTrigger>
            <TabsTrigger value="wallets" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Wallets</TabsTrigger>
            <TabsTrigger value="bills" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Bills</TabsTrigger>
            <TabsTrigger value="banks" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Banks</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="flex-1 mt-0">
            <p className="text-sm font-medium text-foreground mb-3">
              Most used in Malaysia
            </p>
            <div className="space-y-3">
              {getFilteredApps("popular").map((app, index) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onToggle={() => toggleApp(app.id)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="wallets" className="flex-1 mt-0">
            <div className="space-y-3">
              {getFilteredApps("wallets").map((app, index) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onToggle={() => toggleApp(app.id)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bills" className="flex-1 mt-0">
            <div className="space-y-3">
              {getFilteredApps("bills").map((app, index) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onToggle={() => toggleApp(app.id)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="banks" className="flex-1 mt-0">
            <div className="space-y-3">
              {getFilteredApps("banks").map((app, index) => (
                <AppCard
                  key={app.id}
                  app={app}
                  onToggle={() => toggleApp(app.id)}
                  delay={index * 0.1}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="py-3 relative z-10"
      >
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            In production, linking would open each app to authorize FLOW. For now, this creates simulated connections.
          </span>
        </div>
      </motion.div>

      {/* Trust Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="py-2 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span>FLOW never moves money without your confirmation.</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="py-6 space-y-3 relative z-10"
      >
        <Button
          onClick={connectSelectedApps}
          disabled={isSyncing || selectedCount === 0}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSyncing ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          {selectedCount > 0 ? `Connect ${selectedCount} app${selectedCount !== 1 ? 's' : ''}` : 'Select apps to connect'}
        </Button>
        <button
          onClick={() => navigate("/home")}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
});
AutoSyncPage.displayName = "AutoSyncPage";

export default AutoSyncPage;
