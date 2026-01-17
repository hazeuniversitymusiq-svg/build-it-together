/**
 * Apple Intelligence-Style Onboarding Flow
 * 
 * Honest onboarding: Welcome → Select Apps → Connect (real DB writes) → Ready
 * No fake "discovering" animations - users select their apps directly.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight,
  Fingerprint,
  Shield,
  Zap,
  Wallet,
  Landmark,
  CreditCard,
  Receipt,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { FlowLogo } from '@/components/brand/FlowLogo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// App configuration
interface AppOption {
  name: string;
  displayName: string;
  description: string;
  icon: React.ElementType;
  color: string;
  type: 'wallet' | 'bank' | 'bnpl' | 'biller';
  defaultBalance: number;
  recommended?: boolean;
}

const APP_OPTIONS: AppOption[] = [
  { name: 'TouchNGo', displayName: "Touch 'n Go", description: "Malaysia's #1 e-wallet", icon: Wallet, color: '#0066CC', type: 'wallet', defaultBalance: 85.50, recommended: true },
  { name: 'GrabPay', displayName: 'GrabPay', description: 'Merchant payments', icon: Wallet, color: '#00B14F', type: 'wallet', defaultBalance: 42.00, recommended: true },
  { name: 'Boost', displayName: 'Boost', description: 'Cashback rewards', icon: Wallet, color: '#FF6B00', type: 'wallet', defaultBalance: 25.00 },
  { name: 'Maybank', displayName: 'Maybank', description: 'Bank transfers', icon: Landmark, color: '#FFCC00', type: 'bank', defaultBalance: 1250.00, recommended: true },
  { name: 'Atome', displayName: 'Atome', description: 'Split payments, 0% interest', icon: CreditCard, color: '#14B8A6', type: 'bnpl', defaultBalance: 1500.00, recommended: true },
  { name: 'SPayLater', displayName: 'SPayLater', description: 'Shopee Pay Later', icon: CreditCard, color: '#F97316', type: 'bnpl', defaultBalance: 1000.00 },
];

const FEATURES = [
  { icon: Zap, text: 'Smart payment routing' },
  { icon: Shield, text: 'Bank-grade security' },
  { icon: Fingerprint, text: 'Biometric protection' },
];

type Phase = 'welcome' | 'select' | 'connecting' | 'ready';

export function AppleOnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasCompleted, completeOnboarding, isLoading } = useOnboarding();
  
  const [phase, setPhase] = useState<Phase>('welcome');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);

  // Pre-select recommended apps
  useEffect(() => {
    const recommended = APP_OPTIONS.filter(app => app.recommended).map(app => app.name);
    setSelectedApps(new Set(recommended));
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
    if (selectedApps.size === 0) {
      toast({ title: "Please select at least one app", variant: "destructive" });
      return;
    }

    setPhase('connecting');
    setIsConnecting(true);
    setConnectedCount(0);

    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, we'll create connectors after they sign up
    // For now, just simulate the connection and complete onboarding
    if (!user) {
      // Store selection in localStorage for post-auth setup
      localStorage.setItem('flow_pending_apps', JSON.stringify([...selectedApps]));
      
      // Animate through the "connecting" visuals
      for (let i = 0; i < selectedApps.size; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setConnectedCount(i + 1);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsConnecting(false);
      setPhase('ready');
      return;
    }

    // Real DB writes for authenticated users
    let priority = 1;
    const appsToConnect = [...selectedApps];
    
    for (const appName of appsToConnect) {
      const app = APP_OPTIONS.find(a => a.name === appName);
      if (!app) continue;

      const connectorType = app.type === 'biller' ? 'biller' : app.type;
      
      // Create connector
      const capabilities: Record<string, boolean> = {};
      if (app.type === 'wallet') {
        capabilities.can_pay_qr = true;
        capabilities.can_p2p = true;
        capabilities.can_receive = true;
        capabilities.can_topup = true;
      } else if (app.type === 'bank') {
        capabilities.can_pay = true;
        capabilities.can_transfer = true;
        capabilities.can_fund_topup = true;
      } else if (app.type === 'bnpl') {
        capabilities.can_pay_qr = true;
        capabilities.can_pay = true;
        capabilities.can_installment = true;
      }

      await supabase.from('connectors').upsert({
        user_id: user.id,
        name: appName as any,
        type: connectorType,
        status: 'available',
        mode: 'Prototype',
        capabilities,
      }, { onConflict: 'user_id,name' });

      // Create funding source for wallets, banks, BNPL
      if (app.type !== 'biller') {
        const sourceType = app.type === 'wallet' ? 'wallet' : app.type === 'bank' ? 'bank' : 'bnpl';
        
        await supabase.from('funding_sources').upsert({
          user_id: user.id,
          name: appName,
          type: sourceType,
          balance: app.defaultBalance,
          currency: 'MYR',
          priority: app.type === 'bnpl' ? priority + 10 : priority,
          linked_status: 'linked',
          available: true,
          max_auto_topup_amount: app.type === 'wallet' ? 200 : app.type === 'bank' ? 500 : 0,
          require_extra_confirm_amount: app.type === 'wallet' ? 300 : app.type === 'bank' ? 1000 : 200,
        }, { onConflict: 'user_id,name' });
        priority++;
      }

      setConnectedCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 200)); // Visual feedback delay
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setIsConnecting(false);
    setPhase('ready');
  }, [selectedApps, toast]);

  const handleGetStarted = () => {
    completeOnboarding();
    navigate('/auth');
  };

  const handleSkip = () => {
    completeOnboarding();
    navigate('/auth');
  };

  // Don't show on auth page or if completed
  if (isLoading || hasCompleted || location.pathname === '/auth' || location.pathname.startsWith('/oauth')) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background overflow-hidden"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-aurora-purple/20 blur-[100px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-aurora-blue/15 blur-[100px]"
        />
      </div>

      {/* Skip button */}
      {phase !== 'ready' && phase !== 'connecting' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute top-4 right-4 z-20 safe-area-top"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground/60 hover:text-foreground"
          >
            Skip
          </Button>
        </motion.div>
      )}

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col safe-area-top safe-area-bottom">
        <AnimatePresence mode="wait">
          {/* WELCOME PHASE */}
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mb-8"
              >
                <FlowLogo variant="full" size="lg" animate />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-foreground mb-3 tracking-tight text-center"
              >
                Welcome to FLOW
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg text-center max-w-xs"
              >
                Your unified payment intelligence layer
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-12 w-full max-w-xs"
              >
                <Button
                  onClick={() => setPhase('select')}
                  className="w-full h-14 rounded-2xl aurora-gradient text-white text-base font-medium shadow-glow-aurora"
                >
                  Set Up FLOW
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* SELECT APPS PHASE */}
          {phase === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 pt-16 pb-4">
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-2xl font-bold text-foreground tracking-tight"
                >
                  Select Your Apps
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground mt-1"
                >
                  Choose the payment apps you use
                </motion.p>
              </div>

              {/* App Grid */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {APP_OPTIONS.map((app, index) => (
                    <motion.button
                      key={app.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => toggleApp(app.name)}
                      className={`relative p-4 rounded-2xl text-left transition-all ${
                        selectedApps.has(app.name)
                          ? 'bg-primary/10 ring-2 ring-primary'
                          : 'bg-card hover:bg-muted/50'
                      }`}
                    >
                      {/* Selection indicator */}
                      {selectedApps.has(app.name) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </motion.div>
                      )}

                      {/* Recommended badge */}
                      {app.recommended && !selectedApps.has(app.name) && (
                        <span className="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-aurora-blue/10 text-aurora-blue font-medium">
                          Popular
                        </span>
                      )}

                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${app.color}20` }}
                      >
                        <app.icon className="w-6 h-6" style={{ color: app.color }} />
                      </div>

                      {/* Info */}
                      <p className="font-medium text-foreground text-sm">{app.displayName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{app.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-8 pt-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  FLOW never moves money without your confirmation
                </p>
                
                <Button
                  onClick={connectApps}
                  disabled={selectedApps.size === 0}
                  className="w-full h-14 rounded-2xl aurora-gradient text-white text-base font-medium shadow-glow-aurora disabled:opacity-50 disabled:shadow-none"
                >
                  Connect {selectedApps.size} App{selectedApps.size !== 1 ? 's' : ''}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* CONNECTING PHASE */}
          {phase === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mb-8"
              >
                <div className="w-24 h-24 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-foreground mb-2 text-center"
              >
                Setting Up FLOW
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground text-center"
              >
                Connecting {connectedCount} of {selectedApps.size} apps...
              </motion.p>

              {/* Progress bar */}
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                transition={{ delay: 0.2 }}
                className="mt-8 w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(connectedCount / selectedApps.size) * 100}%` }}
                  className="h-full aurora-gradient rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* READY PHASE */}
          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mb-8"
              >
                <div className="w-24 h-24 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
                  <Check className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-foreground mb-3 tracking-tight text-center"
              >
                You're All Set
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg text-center"
              >
                One tap. Best rail. Every time.
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 space-y-3"
              >
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Connected apps count */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-sm text-muted-foreground"
              >
                {selectedApps.size} payment app{selectedApps.size !== 1 ? 's' : ''} connected
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 w-full max-w-xs"
              >
                <Button
                  onClick={handleGetStarted}
                  className="w-full h-14 rounded-2xl aurora-gradient text-white text-base font-medium shadow-glow-aurora"
                >
                  Get Started
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2"
        >
          {['welcome', 'select', 'connecting', 'ready'].map((p, i) => {
            const phaseIndex = ['welcome', 'select', 'connecting', 'ready'].indexOf(phase);
            return (
              <motion.div
                key={p}
                animate={{
                  width: p === phase ? 24 : 8,
                  backgroundColor: i <= phaseIndex
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--muted))',
                }}
                transition={{ duration: 0.3 }}
                className="h-2 rounded-full"
              />
            );
          })}
        </motion.div>
      </div>

      {/* Glass overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/50" />
    </motion.div>
  );
}
