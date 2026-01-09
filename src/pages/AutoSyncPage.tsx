import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, Building2, Receipt, Landmark, Check, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DiscoveredApp {
  id: string;
  app_name: string;
  app_type: "wallet" | "bank" | "biller";
  confidence: number;
  detected: boolean;
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

const AppCard = forwardRef<HTMLDivElement, {
  app: DiscoveredApp;
  onToggle: () => void;
  recommended?: boolean;
  delay: number;
}>(({ app, onToggle, recommended, delay }, ref) => {
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
            {app.selected && (
              <div className="w-5 h-5 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          {recommended && (
            <p className="text-sm text-muted-foreground mt-1">
              Recommended because you'll use this often. Tap to link.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
});
AppCard.displayName = "AppCard";

const AutoSyncPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [discoveredApps, setDiscoveredApps] = useState<DiscoveredApp[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState("recommended");

  // Simulate auto-sync discovery
  const runAutoSync = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setIsScanning(false);
      return;
    }

    // Check existing connectors to populate discovered apps
    const { data: existingConnectors } = await supabase
      .from("connectors")
      .select("*")
      .eq("user_id", user.id);

    // Simulated discovered apps based on connector_name enum
    const simulatedApps: Omit<DiscoveredApp, "id" | "selected">[] = [
      { app_name: "TouchNGo", app_type: "wallet", confidence: 0.95, detected: true },
      { app_name: "GrabPay", app_type: "wallet", confidence: 0.88, detected: true },
      { app_name: "Boost", app_type: "wallet", confidence: 0.72, detected: false },
      { app_name: "Maybank", app_type: "bank", confidence: 0.91, detected: true },
      { app_name: "TNB", app_type: "biller", confidence: 0.85, detected: true },
      { app_name: "Unifi", app_type: "biller", confidence: 0.78, detected: true },
      { app_name: "Maxis", app_type: "biller", confidence: 0.65, detected: false },
    ];

    // Mark as linked if already exists in connectors
    const existingNames = new Set(existingConnectors?.map(c => c.name) || []);
    
    const apps: DiscoveredApp[] = simulatedApps.map((app, index) => ({
      ...app,
      id: `app-${index}`,
      selected: app.confidence >= 0.8 && app.detected, // Auto-select high confidence detected apps
    }));

    // Save to discovered_apps table
    const { error } = await supabase.from("discovered_apps").upsert(
      apps.map(app => ({
        user_id: user.id,
        app_name: app.app_name,
        app_type: app.app_type,
        confidence: app.confidence,
        detected: app.detected,
        discovery_source: "simulated" as const,
      })),
      { onConflict: "user_id,app_name", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Error saving discovered apps:", error);
    }

    setDiscoveredApps(apps);
    setHasScanned(true);
    setIsScanning(false);
  };

  const toggleApp = (appId: string) => {
    setDiscoveredApps(prev => 
      prev.map(app => 
        app.id === appId ? { ...app, selected: !app.selected } : app
      )
    );
  };

  const syncRecommended = async () => {
    setIsSyncing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setIsSyncing(false);
      return;
    }

    const selectedApps = discoveredApps.filter(app => app.selected);

    // Create connectors for selected apps
    for (const app of selectedApps) {
      const connectorType = app.app_type === "wallet" ? "wallet" 
        : app.app_type === "bank" ? "bank" 
        : "biller";

      // Check if connector name is valid
      const validConnectorNames = ["TouchNGo", "GrabPay", "Boost", "DuitNow", "BankTransfer", "Maybank", "VisaMastercard", "Maxis", "Unifi", "TNB", "Contacts"];
      
      if (validConnectorNames.includes(app.app_name)) {
        const { error: connectorError } = await supabase.from("connectors").upsert({
          user_id: user.id,
          name: app.app_name as any,
          type: connectorType,
          status: "available",
          mode: "Prototype",
        }, { onConflict: "user_id,name" });

        if (connectorError) {
          console.error("Error creating connector:", connectorError);
        }

        // For billers, also create biller_accounts
        if (app.app_type === "biller") {
          const { error: billerError } = await supabase.from("biller_accounts").upsert({
            user_id: user.id,
            biller_name: app.app_name,
            account_reference: `AUTO-${Date.now()}`,
            status: "linked",
          }, { onConflict: "user_id,biller_name" });

          if (billerError) {
            console.error("Error creating biller account:", billerError);
          }
        }
      }
    }

    toast({ 
      title: "Sync complete", 
      description: `${selectedApps.length} apps connected successfully` 
    });
    
    setIsSyncing(false);
    navigate("/home"); // Navigate directly to Home
  };

  const getFilteredApps = (type?: string) => {
    if (!type || type === "recommended") {
      return discoveredApps.filter(app => app.confidence >= 0.8);
    }
    const typeMap: Record<string, string> = {
      wallets: "wallet",
      bills: "biller",
      banks: "bank",
    };
    return discoveredApps.filter(app => app.app_type === typeMap[type]);
  };

  const selectedCount = discoveredApps.filter(app => app.selected).length;

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
        className="pt-16 pb-6 relative z-10"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Auto Sync
        </h1>
        <p className="text-muted-foreground">
          FLOW can find your payment and bill apps and recommend what to connect.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        <AnimatePresence mode="wait">
          {!hasScanned ? (
            <motion.div
              key="scan-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              {isScanning ? (
                <>
                  <div className="w-20 h-20 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <p className="text-muted-foreground">Scanning your device...</p>
                </>
              ) : (
                <Button
                  onClick={runAutoSync}
                  className="h-14 px-8 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
                >
                  Run Auto Sync
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col"
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4 h-12 mb-4 glass rounded-xl p-1">
                  <TabsTrigger value="recommended" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Recommended</TabsTrigger>
                  <TabsTrigger value="wallets" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Wallets</TabsTrigger>
                  <TabsTrigger value="bills" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Bills</TabsTrigger>
                  <TabsTrigger value="banks" className="text-xs rounded-lg data-[state=active]:bg-white/80 data-[state=active]:shadow-sm">Banks</TabsTrigger>
                </TabsList>

                <TabsContent value="recommended" className="flex-1 mt-0">
                  <p className="text-sm font-medium text-foreground mb-3">
                    Best connections to start with
                  </p>
                  <div className="space-y-3">
                    {getFilteredApps("recommended").map((app, index) => (
                      <AppCard
                        key={app.id}
                        app={app}
                        onToggle={() => toggleApp(app.id)}
                        recommended
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Trust Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="py-4 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span>FLOW cannot move money without your confirmation.</span>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="py-6 space-y-3 relative z-10"
      >
        {hasScanned ? (
          <>
            <Button
              onClick={syncRecommended}
              disabled={isSyncing || selectedCount === 0}
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : null}
              Sync recommended {selectedCount > 0 && `(${selectedCount})`}
            </Button>
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </>
        ) : !isScanning && (
          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
});
AutoSyncPage.displayName = "AutoSyncPage";

export default AutoSyncPage;
