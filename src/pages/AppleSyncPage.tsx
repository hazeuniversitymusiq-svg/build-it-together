/**
 * Apple-Style Auto Sync Page
 * 
 * Immersive floating app sync experience with orbital animations,
 * liquid glass effects, and Apple Intelligence-inspired design.
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
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
  CreditCard,
  Zap,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";

// App configuration with visual properties
interface AppConfig {
  name: string;
  displayName: string;
  icon: React.ElementType;
  color: string;
  category: 'wallet' | 'bank' | 'bnpl' | 'biller';
  recommended?: boolean;
}

const APPS: AppConfig[] = [
  { name: "TouchNGo", displayName: "Touch 'n Go", icon: Wallet, color: "#0066FF", category: 'wallet', recommended: true },
  { name: "GrabPay", displayName: "GrabPay", icon: Wallet, color: "#00B14F", category: 'wallet', recommended: true },
  { name: "Boost", displayName: "Boost", icon: Zap, color: "#FF6B00", category: 'wallet' },
  { name: "Maybank", displayName: "Maybank", icon: Landmark, color: "#FFD700", category: 'bank', recommended: true },
  { name: "Atome", displayName: "Atome", icon: CreditCard, color: "#FF69B4", category: 'bnpl', recommended: true },
  { name: "SPayLater", displayName: "SPayLater", icon: CreditCard, color: "#FF4500", category: 'bnpl' },
  { name: "TNB", displayName: "TNB", icon: Receipt, color: "#4169E1", category: 'biller' },
  { name: "Unifi", displayName: "Unifi", icon: Receipt, color: "#E91E63", category: 'biller' },
  { name: "Maxis", displayName: "Maxis", icon: Receipt, color: "#00CED1", category: 'biller' },
];

type SyncPhase = 'ready' | 'syncing' | 'complete';

interface FloatingAppProps {
  app: AppConfig;
  index: number;
  isSelected: boolean;
  isSyncing: boolean;
  isSynced: boolean;
  onToggle: () => void;
  disabled: boolean;
}

function FloatingAppCard({ app, index, isSelected, isSyncing, isSynced, onToggle, disabled }: FloatingAppProps) {
  const controls = useAnimationControls();
  const Icon = app.icon;
  
  // Floating animation
  useEffect(() => {
    if (!isSyncing && !isSynced) {
      controls.start({
        y: [0, -8, 0],
        transition: {
          duration: 3 + index * 0.3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    }
  }, [controls, index, isSyncing, isSynced]);

  // Sync animation - fly to center
  useEffect(() => {
    if (isSyncing) {
      controls.start({
        scale: [1, 0.8, 0],
        opacity: [1, 1, 0],
        y: [0, -50],
        transition: {
          duration: 0.6,
          delay: index * 0.08,
          ease: [0.32, 0.72, 0, 1],
        },
      });
    }
  }, [isSyncing, controls, index]);

  // Return after sync
  useEffect(() => {
    if (isSynced && !isSyncing) {
      controls.start({
        scale: 1,
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          delay: 0.5 + index * 0.05,
          type: 'spring',
          stiffness: 300,
        },
      });
    }
  }, [isSynced, isSyncing, controls, index]);

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={controls}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={!disabled ? onToggle : undefined}
      disabled={disabled}
      className={`
        relative p-4 rounded-3xl transition-all duration-300
        ${isSelected || isSynced
          ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg'
          : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10'
        }
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
      style={{
        boxShadow: isSelected || isSynced ? `0 8px 32px ${app.color}30` : undefined,
      }}
    >
      {/* Glow effect */}
      {(isSelected || isSynced) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          className="absolute inset-0 rounded-3xl blur-xl -z-10"
          style={{ backgroundColor: app.color }}
        />
      )}

      {/* Icon */}
      <div 
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 mx-auto"
        style={{ 
          backgroundColor: app.color,
          boxShadow: `0 4px 16px ${app.color}40`,
        }}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Name */}
      <p className="text-sm font-medium text-foreground text-center mb-1">
        {app.displayName}
      </p>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-1">
        {isSynced ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500 }}
          >
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </motion.div>
        ) : isSelected ? (
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        ) : app.recommended ? (
          <span className="text-[10px] text-aurora-blue font-medium">Recommended</span>
        ) : null}
      </div>
    </motion.button>
  );
}

export default function AppleSyncPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptics = useHaptics();
  
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [syncedApps, setSyncedApps] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<SyncPhase>('ready');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with recommended apps and load existing connections
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: existingConnectors } = await supabase
          .from("connectors")
          .select("name")
          .eq("user_id", user.id);
        
        const connectedNames = new Set(existingConnectors?.map(c => c.name as string) || []);
        setSyncedApps(connectedNames);
        
        // Pre-select recommended apps not already connected
        const defaults = new Set<string>();
        APPS.forEach(app => {
          if (app.recommended && !connectedNames.has(app.name)) {
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
    if (syncedApps.has(name)) return;
    haptics.selection();
    
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, [syncedApps, haptics]);

  const handleSync = useCallback(async () => {
    if (selectedApps.size === 0) return;
    
    haptics.impact();
    setPhase('syncing');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in first", variant: "destructive" });
      setPhase('ready');
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

    const bnplLimits: Record<string, number> = {
      Atome: 1500.00,
      SPayLater: 1000.00,
    };

    let priority = 1;
    
    // Simulate staggered connection with visual feedback
    await new Promise(resolve => setTimeout(resolve, APPS.length * 80 + 600));
    
    for (const appName of selectedApps) {
      const app = APPS.find(a => a.name === appName);
      if (!app) continue;
      
      const connectorType = app.category === 'biller' ? 'biller' : app.category;
      
      const capabilities: Record<string, boolean> = {};
      if (app.category === 'wallet') {
        capabilities.can_pay_qr = true;
        capabilities.can_p2p = true;
        capabilities.can_receive = true;
      } else if (app.category === 'bank') {
        capabilities.can_pay = true;
        capabilities.can_transfer = true;
      } else if (app.category === 'bnpl') {
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

      if (app.category !== 'biller') {
        const balance = defaultBalances[appName] || 50.00;
        const sourceType = app.category === 'wallet' ? 'wallet' : app.category === 'bank' ? 'bank' : 'bnpl';
        
        await supabase.from("funding_sources").upsert({
          user_id: user.id,
          name: appName,
          type: sourceType,
          balance: app.category === 'bnpl' ? bnplLimits[appName] || 500 : balance,
          currency: "MYR",
          priority: app.category === 'bnpl' ? priority + 10 : priority,
          linked_status: "linked",
          available: true,
          max_auto_topup_amount: app.category === 'wallet' ? 200 : app.category === 'bank' ? 500 : 0,
          require_extra_confirm_amount: app.category === 'wallet' ? 300 : app.category === 'bank' ? 1000 : 200,
        }, { onConflict: "user_id,name" });
        priority++;
      }

      if (app.category === 'biller') {
        await supabase.from("biller_accounts").upsert({
          user_id: user.id,
          biller_name: appName,
          account_reference: `ACC-${Date.now()}`,
          status: "linked",
        }, { onConflict: "user_id,biller_name" });
      }
    }

    // Mark apps as synced
    setSyncedApps(prev => new Set([...prev, ...selectedApps]));
    setSelectedApps(new Set());
    setPhase('complete');
    
    haptics.success();
    toast({ 
      title: "Apps Connected!",
      description: `${selectedApps.size} apps linked to FLOW`
    });
    
    // Navigate after celebration
    setTimeout(() => {
      navigate("/home");
    }, 2000);
  }, [selectedApps, toast, navigate, haptics]);

  const handleSkip = () => {
    navigate("/home");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  const newAppsCount = [...selectedApps].filter(app => !syncedApps.has(app)).length;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden safe-area-top safe-area-bottom">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-aurora-purple/20 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-aurora-blue/15 blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-aurora-teal/10 blur-[80px]"
        />
      </div>

      {/* Central sync orb (visible during sync) */}
      <AnimatePresence>
        {phase === 'syncing' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 40px rgba(139, 92, 246, 0.4)',
                  '0 0 100px rgba(139, 92, 246, 0.8)',
                  '0 0 40px rgba(139, 92, 246, 0.4)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-32 h-32 rounded-full aurora-gradient flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {phase === 'complete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                All Set!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your apps are connected to FLOW
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-4"
        >
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Connect Your Apps
          </h1>
          <p className="text-muted-foreground mt-2">
            FLOW will use these for smart payments
          </p>
        </motion.div>
      </header>

      {/* App grid */}
      <div className="flex-1 relative z-10 px-4 py-6 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 max-w-md mx-auto"
        >
          {APPS.map((app, index) => (
            <FloatingAppCard
              key={app.name}
              app={app}
              index={index}
              isSelected={selectedApps.has(app.name)}
              isSyncing={phase === 'syncing' && selectedApps.has(app.name)}
              isSynced={syncedApps.has(app.name)}
              onToggle={() => toggleApp(app.name)}
              disabled={phase !== 'ready' || syncedApps.has(app.name)}
            />
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 px-6 pb-8 pt-4 space-y-4"
      >
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4" />
          <span>FLOW never moves money without your confirmation</span>
        </div>

        <Button
          onClick={handleSync}
          disabled={phase !== 'ready' || newAppsCount === 0}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora disabled:opacity-50 disabled:shadow-none"
        >
          {phase === 'syncing' ? (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Connecting...
            </motion.span>
          ) : newAppsCount > 0 ? (
            <>
              Connect {newAppsCount} App{newAppsCount !== 1 ? 's' : ''}
              <Sparkles className="w-5 h-5 ml-2" />
            </>
          ) : (
            "All Connected"
          )}
        </Button>
      </motion.div>
    </div>
  );
}
