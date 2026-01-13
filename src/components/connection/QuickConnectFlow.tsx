/**
 * Quick Connect Flow Component
 * 
 * Seamless one-tap connection experience that delivers on FLOW's promise:
 * "Connect to your existing wallets, banks, and bill apps"
 * 
 * Features:
 * - Auto-detection of installed apps
 * - One-tap connect all
 * - Visual progress feedback
 * - Smart defaults
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  Building2,
  CreditCard,
  Receipt,
  Zap,
  Check,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnectionEngine } from '@/hooks/useConnectionEngine';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import type { AppDefinition } from '@/lib/connection/connection-engine';

interface QuickConnectFlowProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wallet: Wallet,
  bank: Building2,
  bnpl: CreditCard,
  biller: Receipt,
};

const CATEGORY_COLORS: Record<string, string> = {
  wallet: 'from-blue-500 to-blue-600',
  bank: 'from-yellow-500 to-amber-600',
  bnpl: 'from-teal-500 to-teal-600',
  biller: 'from-green-500 to-green-600',
};

function AppPill({ 
  app, 
  isConnecting, 
  isConnected 
}: { 
  app: AppDefinition; 
  isConnecting: boolean;
  isConnected: boolean;
}) {
  const Icon = CATEGORY_ICONS[app.category] || Wallet;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-full text-sm
        transition-all duration-300
        ${isConnected 
          ? 'bg-success/10 text-success border border-success/20' 
          : isConnecting
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'glass-card border-0'
        }
      `}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isConnected ? (
        <Check className="w-4 h-4" />
      ) : (
        <Icon className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={isConnected ? 'font-medium' : ''}>{app.displayName}</span>
    </motion.div>
  );
}

export function QuickConnectFlow({ onComplete, showSkip = true }: QuickConnectFlowProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const haptics = useHaptics();
  const {
    isLoading,
    isConnecting,
    detectedApps,
    connectedApps,
    quickConnect,
    totalConnected,
    totalBalance,
  } = useConnectionEngine();

  const [phase, setPhase] = useState<'detecting' | 'ready' | 'connecting' | 'complete'>('detecting');
  const [connectingApps, setConnectingApps] = useState<Set<string>>(new Set());
  const [connectedAppNames, setConnectedAppNames] = useState<Set<string>>(new Set());

  // Update phase based on loading state
  useEffect(() => {
    if (!isLoading && phase === 'detecting') {
      setPhase('ready');
    }
  }, [isLoading, phase]);

  // Update connected apps set
  useEffect(() => {
    setConnectedAppNames(new Set(connectedApps.map(a => a.appName)));
  }, [connectedApps]);

  const handleQuickConnect = async () => {
    setPhase('connecting');
    haptics.impact();

    // Simulate sequential connection for visual effect
    for (const app of detectedApps) {
      setConnectingApps(prev => new Set([...prev, app.name]));
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const result = await quickConnect();

    if (result.success) {
      haptics.success();
      setPhase('complete');
      toast({
        title: 'All Apps Connected',
        description: `${result.synced} apps linked to FLOW`,
      });

      // Navigate after a short delay
      setTimeout(() => {
        onComplete?.();
        navigate('/home');
      }, 1500);
    } else {
      haptics.error();
      toast({
        title: 'Connection Issue',
        description: `Connected ${result.synced} apps, ${result.failed} failed`,
        variant: 'destructive',
      });
    }
  };

  const handleSkip = () => {
    onComplete?.();
    navigate('/home');
  };

  // Group detected apps by category
  const groupedApps = detectedApps.reduce((acc, app) => {
    if (!acc[app.category]) acc[app.category] = [];
    acc[app.category].push(app);
    return acc;
  }, {} as Record<string, AppDefinition[]>);

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-aurora-gradient opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-aurora-pink/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Skip button */}
      {showSkip && phase !== 'complete' && (
        <div className="absolute top-4 right-4 z-10 safe-area-top">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          {/* Detecting phase */}
          {phase === 'detecting' && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6 rounded-full aurora-gradient flex items-center justify-center"
              >
                <RefreshCw className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-semibold mb-2">Detecting Your Apps</h2>
              <p className="text-muted-foreground">Finding wallets, banks, and payment apps...</p>
            </motion.div>
          )}

          {/* Ready phase */}
          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] aurora-gradient flex items-center justify-center shadow-glow-aurora"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold mb-2">
                  Found {detectedApps.length} Apps
                </h1>
                <p className="text-muted-foreground">
                  Connect them all to FLOW with one tap
                </p>
              </div>

              {/* Detected apps by category */}
              <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                {Object.entries(groupedApps).map(([category, apps]) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {category === 'bnpl' ? 'Buy Now Pay Later' : category.charAt(0).toUpperCase() + category.slice(1)}s
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {apps.map(app => (
                        <AppPill
                          key={app.name}
                          app={app}
                          isConnecting={false}
                          isConnected={connectedAppNames.has(app.name)}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Connecting phase */}
          {phase === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] aurora-gradient flex items-center justify-center shadow-glow-aurora"
                >
                  <Zap className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-semibold mb-2">Connecting...</h2>
                <p className="text-muted-foreground">
                  Linking your apps to FLOW
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-3">
                {detectedApps.map(app => (
                  <AppPill
                    key={app.name}
                    app={app}
                    isConnecting={connectingApps.has(app.name) && !connectedAppNames.has(app.name)}
                    isConnected={connectedAppNames.has(app.name)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Complete phase */}
          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center"
              >
                <Check className="w-12 h-12 text-success" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">All Connected!</h2>
              <p className="text-muted-foreground mb-4">
                {totalConnected} apps linked • RM {totalBalance.toFixed(2)} available
              </p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Your money stays in your apps</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 relative z-10">
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Trust message */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>FLOW never holds your money. You always confirm first.</span>
            </div>

            {/* Connect button */}
            <Button
              onClick={handleQuickConnect}
              disabled={isConnecting || detectedApps.length === 0}
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Connect All {detectedApps.length} Apps
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default QuickConnectFlow;
