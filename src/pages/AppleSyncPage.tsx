/**
 * Apple Intelligence-Style Sync Page
 * 
 * Immersive floating app constellation with:
 * - Apps floating in orbital paths around a central FLOW orb
 * - Magnetic convergence animation during sync
 * - Liquid glass effects and aurora gradients
 * - Particle trails and depth blur
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Wallet, 
  Building2, 
  Receipt, 
  Landmark, 
  Check, 
  CreditCard,
  Zap,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useHaptics } from "@/hooks/useHaptics";

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
];

type SyncPhase = 'discovering' | 'ready' | 'syncing' | 'complete';

interface FloatingAppProps {
  app: AppConfig;
  index: number;
  total: number;
  phase: SyncPhase;
  isSelected: boolean;
  isSynced: boolean;
  onToggle: () => void;
}

function FloatingAppOrb({ app, index, total, phase, isSelected, isSynced, onToggle }: FloatingAppProps) {
  const controls = useAnimationControls();
  const Icon = app.icon;
  
  // Calculate orbital position
  const angle = (index / total) * Math.PI * 2;
  const radius = 130;
  const baseX = Math.cos(angle) * radius;
  const baseY = Math.sin(angle) * radius * 0.6; // Elliptical orbit
  
  // Floating orbit animation
  useEffect(() => {
    if (phase === 'discovering') {
      controls.start({
        x: [baseX - 10, baseX + 10, baseX - 10],
        y: [baseY - 5, baseY + 5, baseY - 5],
        scale: [0, 1.1, 1],
        opacity: [0, 1, 1],
        transition: {
          x: { duration: 4 + index * 0.2, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 3.5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' },
          scale: { duration: 0.6, delay: index * 0.1 },
          opacity: { duration: 0.4, delay: index * 0.1 },
        },
      });
    } else if (phase === 'ready') {
      controls.start({
        x: [baseX - 8, baseX + 8, baseX - 8],
        y: [baseY - 4, baseY + 4, baseY - 4],
        scale: 1,
        opacity: 1,
        transition: {
          x: { duration: 4 + index * 0.2, repeat: Infinity, ease: 'easeInOut' },
          y: { duration: 3.5 + index * 0.3, repeat: Infinity, ease: 'easeInOut' },
        },
      });
    } else if (phase === 'syncing') {
      // Magnetic convergence to center
      controls.start({
        x: 0,
        y: 0,
        scale: [1, 0.5, 0],
        opacity: [1, 1, 0],
        transition: {
          duration: 0.8,
          delay: index * 0.06,
          ease: [0.32, 0.72, 0, 1],
        },
      });
    } else if (phase === 'complete') {
      // Explode back outward with celebration
      controls.start({
        x: baseX,
        y: baseY,
        scale: [0, 1.2, 1],
        opacity: 1,
        transition: {
          duration: 0.5,
          delay: 0.3 + index * 0.05,
          type: 'spring',
          stiffness: 400,
          damping: 15,
        },
      });
    }
  }, [phase, controls, index, baseX, baseY]);

  const disabled = phase === 'syncing' || phase === 'discovering';

  return (
    <motion.button
      animate={controls}
      initial={{ x: baseX, y: baseY, scale: 0, opacity: 0 }}
      whileHover={!disabled ? { scale: 1.15 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={!disabled ? onToggle : undefined}
      disabled={disabled}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ zIndex: isSelected ? 20 : 10 }}
    >
      {/* Outer glow ring */}
      <motion.div
        animate={{
          boxShadow: isSelected || isSynced
            ? `0 0 30px ${app.color}60, 0 0 60px ${app.color}30`
            : `0 0 15px ${app.color}20`,
        }}
        className="relative"
      >
        {/* Glass card */}
        <motion.div
          animate={{
            borderColor: isSelected || isSynced
              ? `${app.color}60`
              : 'rgba(255,255,255,0.15)',
          }}
          className={`
            relative w-20 h-20 rounded-[22px] 
            bg-white/[0.08] backdrop-blur-xl
            border-2 transition-all duration-300
            flex flex-col items-center justify-center gap-1
            overflow-hidden
          `}
        >
          {/* Inner gradient glow */}
          <div
            className="absolute inset-0 opacity-30 rounded-[20px]"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${app.color}40, transparent 70%)`,
            }}
          />
          
          {/* Icon container */}
          <motion.div
            animate={{
              scale: isSelected || isSynced ? 1.1 : 1,
            }}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: app.color,
              boxShadow: `0 4px 12px ${app.color}50`,
            }}
          >
            <Icon className="w-5 h-5 text-white" />
          </motion.div>
          
          {/* App name */}
          <span className="text-[10px] font-medium text-white/90 text-center px-1 leading-tight">
            {app.displayName}
          </span>

          {/* Selection indicator */}
          <AnimatePresence>
            {(isSelected || isSynced) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-lg"
              >
                <Check className="w-3 h-3 text-green-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

export default function AppleSyncPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptics = useHaptics();
  
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [syncedApps, setSyncedApps] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<SyncPhase>('discovering');

  // Auto-discover apps
  useEffect(() => {
    const init = async () => {
      // Short discovery animation
      await new Promise(r => setTimeout(r, 1500));
      
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
      } else {
        // No user - select recommended by default
        const defaults = new Set(APPS.filter(a => a.recommended).map(a => a.name));
        setSelectedApps(defaults);
      }
      
      setPhase('ready');
    };
    init();
  }, []);

  const toggleApp = useCallback((name: string) => {
    if (syncedApps.has(name) || phase !== 'ready') return;
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
  }, [syncedApps, phase, haptics]);

  const handleSync = useCallback(async () => {
    if (selectedApps.size === 0) {
      navigate('/home');
      return;
    }
    
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

    // Wait for convergence animation
    await new Promise(r => setTimeout(r, APPS.length * 60 + 800));
    
    let priority = 1;
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

    setSyncedApps(prev => new Set([...prev, ...selectedApps]));
    setSelectedApps(new Set());
    setPhase('complete');
    
    haptics.success();
    toast({ 
      title: "Connected!",
      description: `${selectedApps.size} apps linked to FLOW`
    });
    
    setTimeout(() => navigate("/home"), 2500);
  }, [selectedApps, toast, navigate, haptics]);

  const handleSkip = () => navigate("/home");

  const newAppsCount = [...selectedApps].filter(app => !syncedApps.has(app)).length;
  const allConnected = APPS.every(app => syncedApps.has(app.name));

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden safe-area-top safe-area-bottom">
      {/* Deep space background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Aurora gradients */}
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-aurora-purple/30 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-20 -left-20 w-[350px] h-[350px] rounded-full bg-aurora-blue/25 blur-[100px]"
        />
        <motion.div
          animate={{
            opacity: [0.15, 0.25, 0.15],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-aurora-teal/15 blur-[100px]"
        />
        
        {/* Subtle star particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 3,
              repeat: Infinity,
            }}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Skip button */}
      {phase !== 'syncing' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          Skip
        </motion.button>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {phase === 'discovering' ? 'Discovering Apps' :
             phase === 'syncing' ? 'Connecting' :
             phase === 'complete' ? 'All Set!' :
             'Your Apps'}
          </h1>
          <p className="text-white/60 mt-2">
            {phase === 'discovering' ? 'Finding your payment apps...' :
             phase === 'syncing' ? 'Linking to FLOW...' :
             phase === 'complete' ? 'Ready for smart payments' :
             'Tap to select, then connect'}
          </p>
        </motion.div>

        {/* Orbital constellation */}
        <div className="relative w-80 h-80">
          {/* Central FLOW orb */}
          <motion.div
            animate={{
              scale: phase === 'syncing' ? [1, 1.3, 1] : 1,
              boxShadow: phase === 'syncing' 
                ? ['0 0 40px rgba(139,92,246,0.5)', '0 0 100px rgba(139,92,246,0.8)', '0 0 40px rgba(139,92,246,0.5)']
                : '0 0 40px rgba(139,92,246,0.4)',
            }}
            transition={{ duration: phase === 'syncing' ? 1 : 0.3, repeat: phase === 'syncing' ? Infinity : 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full aurora-gradient flex items-center justify-center z-30"
          >
            <motion.div
              animate={phase === 'syncing' ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>

          {/* Orbital ring (subtle) */}
          <motion.div
            animate={{ 
              opacity: phase === 'syncing' ? 0 : 0.15,
              rotate: 360,
            }}
            transition={{ 
              opacity: { duration: 0.3 },
              rotate: { duration: 60, repeat: Infinity, ease: 'linear' },
            }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-44 rounded-full border border-white/20"
          />

          {/* Floating app orbs */}
          {APPS.map((app, i) => (
            <FloatingAppOrb
              key={app.name}
              app={app}
              index={i}
              total={APPS.length}
              phase={phase}
              isSelected={selectedApps.has(app.name)}
              isSynced={syncedApps.has(app.name)}
              onToggle={() => toggleApp(app.name)}
            />
          ))}
        </div>

        {/* Selection count */}
        <AnimatePresence>
          {phase === 'ready' && newAppsCount > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-white/50 text-sm mt-6"
            >
              {newAppsCount} app{newAppsCount > 1 ? 's' : ''} selected
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 px-6 pb-10 pt-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSync}
          disabled={phase === 'syncing' || phase === 'discovering'}
          className={`
            w-full h-14 rounded-2xl font-medium text-base
            transition-all duration-300 relative overflow-hidden
            ${phase === 'syncing' || phase === 'discovering'
              ? 'bg-white/10 text-white/50 cursor-not-allowed'
              : 'aurora-gradient text-white shadow-glow-aurora'
            }
          `}
        >
          {phase === 'discovering' ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.span>
              Discovering...
            </span>
          ) : phase === 'syncing' ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.span>
              Connecting...
            </span>
          ) : phase === 'complete' ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Continue
            </span>
          ) : allConnected ? (
            'All Connected'
          ) : newAppsCount > 0 ? (
            `Connect ${newAppsCount} App${newAppsCount > 1 ? 's' : ''}`
          ) : (
            'Continue'
          )}
        </motion.button>

        {/* Trust message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-white/40 mt-4"
        >
          FLOW never moves money without your confirmation
        </motion.p>
      </motion.div>
    </div>
  );
}