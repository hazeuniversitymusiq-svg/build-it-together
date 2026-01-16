/**
 * Quick Connect Flow Component
 * 
 * Seamless one-tap connection experience that delivers on FLOW's promise:
 * "Connect to your existing wallets, banks, and bill apps"
 * 
 * Features:
 * - Auto-detection of installed apps
 * - One-tap connect all
 * - Visual progress feedback with real-time status
 * - Success checkmarks and animations
 * - Smart defaults
 */

import { useState, useEffect, useCallback } from 'react';
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
  CircleCheck,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FloatingAppsOrbit } from '@/components/onboarding/FloatingAppsOrbit';
import { useConnectionEngine } from '@/hooks/useConnectionEngine';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import type { AppDefinition } from '@/lib/connection/connection-engine';

interface QuickConnectFlowProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

type AppStatus = 'pending' | 'connecting' | 'success' | 'error';

interface AppConnectionState {
  status: AppStatus;
  message?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  wallet: Wallet,
  bank: Building2,
  bnpl: CreditCard,
  biller: Receipt,
};

const CATEGORY_LABELS: Record<string, string> = {
  wallet: 'E-Wallets',
  bank: 'Banks',
  bnpl: 'Buy Now Pay Later',
  biller: 'Bills & Utilities',
};

// Individual app row with connection status
function AppConnectionRow({ 
  app, 
  status,
  index,
}: { 
  app: AppDefinition; 
  status: AppStatus;
  index: number;
}) {
  const Icon = CATEGORY_ICONS[app.category] || Wallet;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl
        transition-all duration-300
        ${status === 'success' 
          ? 'bg-success/5 border border-success/20' 
          : status === 'connecting'
            ? 'bg-primary/5 border border-primary/20'
            : status === 'error'
              ? 'bg-destructive/5 border border-destructive/20'
              : 'bg-muted/30 border border-transparent'
        }
      `}
    >
      {/* App icon */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-300
        ${status === 'success' 
          ? 'bg-success/10' 
          : status === 'connecting'
            ? 'bg-primary/10'
            : 'bg-muted/50'
        }
      `}>
        <Icon className={`
          w-5 h-5 transition-colors duration-300
          ${status === 'success' 
            ? 'text-success' 
            : status === 'connecting'
              ? 'text-primary'
              : 'text-muted-foreground'
          }
        `} />
      </div>

      {/* App name */}
      <div className="flex-1">
        <p className={`
          font-medium text-sm transition-colors duration-300
          ${status === 'success' ? 'text-success' : 'text-foreground'}
        `}>
          {app.displayName}
        </p>
        {status === 'connecting' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            Linking...
          </motion.p>
        )}
        {status === 'success' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-success/80"
          >
            Connected
          </motion.p>
        )}
      </div>

      {/* Status indicator */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {status === 'pending' && (
            <motion.div
              key="pending"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Circle className="w-6 h-6 text-muted-foreground/30" />
            </motion.div>
          )}
          {status === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <CircleCheck className="w-6 h-6 text-success" />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <AlertCircle className="w-6 h-6 text-destructive" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Compact pill for the ready phase
function AppPill({ 
  app, 
  isConnected 
}: { 
  app: AppDefinition; 
  isConnected: boolean;
}) {
  const Icon = CATEGORY_ICONS[app.category] || Wallet;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-full text-sm
        transition-all duration-300 cursor-default
        ${isConnected 
          ? 'bg-success/10 text-success border border-success/20' 
          : 'bg-muted/50 border border-muted-foreground/10 hover:bg-muted/70'
        }
      `}
    >
      {isConnected ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
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
  const [appStates, setAppStates] = useState<Map<string, AppConnectionState>>(new Map());
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Initialize app states when detected apps change
  useEffect(() => {
    if (detectedApps.length > 0) {
      const initialStates = new Map<string, AppConnectionState>();
      detectedApps.forEach(app => {
        initialStates.set(app.name, { status: 'pending' });
      });
      setAppStates(initialStates);
    }
  }, [detectedApps]);

  // Update phase based on loading state
  useEffect(() => {
    if (!isLoading && phase === 'detecting') {
      setPhase('ready');
    }
  }, [isLoading, phase]);

  // Check for already connected apps
  useEffect(() => {
    if (connectedApps.length > 0) {
      setAppStates(prev => {
        const newStates = new Map(prev);
        connectedApps.forEach(app => {
          if (newStates.has(app.appName)) {
            newStates.set(app.appName, { status: 'success' });
          }
        });
        return newStates;
      });
    }
  }, [connectedApps]);

  const updateAppStatus = useCallback((appName: string, status: AppStatus, message?: string) => {
    setAppStates(prev => {
      const newStates = new Map(prev);
      newStates.set(appName, { status, message });
      return newStates;
    });
  }, []);

  const handleQuickConnect = async () => {
    setPhase('connecting');
    haptics.impact();
    setProgress(0);
    setSuccessCount(0);
    setErrorCount(0);

    const totalApps = detectedApps.length;
    let currentSuccess = 0;
    let currentError = 0;

    // Animate through each app with staggered connection
    for (let i = 0; i < detectedApps.length; i++) {
      const app = detectedApps[i];
      
      // Set to connecting
      updateAppStatus(app.name, 'connecting');
      haptics.selection();
      
      // Small delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update progress
      setProgress(((i + 0.5) / totalApps) * 100);
    }

    // Perform actual connection
    const result = await quickConnect();

    // Update individual app statuses based on results
    if (result.results && result.results.length > 0) {
      result.results.forEach((appResult) => {
        if (appResult.isConnected) {
          updateAppStatus(appResult.appName, 'success');
          currentSuccess++;
          haptics.selection();
        } else {
          updateAppStatus(appResult.appName, 'error', appResult.error);
          currentError++;
        }
      });
    } else {
      // Fallback: mark all as success if quickConnect succeeded
      if (result.success) {
        detectedApps.forEach(app => {
          updateAppStatus(app.name, 'success');
          currentSuccess++;
        });
      }
    }

    setSuccessCount(currentSuccess || result.synced);
    setErrorCount(currentError || result.failed);
    setProgress(100);

    // Short delay before completing
    await new Promise(resolve => setTimeout(resolve, 500));

    if (result.success || result.synced > 0) {
      haptics.success();
      setPhase('complete');
      toast({
        title: 'Apps Connected!',
        description: `${result.synced} apps linked to FLOW`,
      });

      // Navigate after a short delay
      setTimeout(() => {
        onComplete?.();
        navigate('/home');
      }, 2000);
    } else {
      haptics.error();
      toast({
        title: 'Connection Issue',
        description: `Could not connect apps. Please try again.`,
        variant: 'destructive',
      });
      setPhase('ready');
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

  const connectedAppNames = new Set(connectedApps.map((a) => a.appName));

  const orbitPhase: 'idle' | 'detecting' | 'syncing' | 'complete' =
    phase === 'detecting'
      ? 'detecting'
      : phase === 'connecting'
        ? 'syncing'
        : phase === 'complete'
          ? 'complete'
          : 'idle';

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, -40, 0], opacity: [0.12, 0.18, 0.12] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-aurora-purple/25 blur-[110px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 60, 0], opacity: [0.1, 0.16, 0.1] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -left-40 w-[460px] h-[460px] rounded-full bg-aurora-blue/20 blur-[110px]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[360px] rounded-full bg-aurora-teal/15 blur-[90px]"
        />
      </div>

      {/* Skip button */}
      {showSkip && phase !== 'complete' && phase !== 'connecting' && (
        <div className="absolute top-4 right-4 z-10 safe-area-top">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground/70 hover:text-foreground"
          >
            Skip
          </Button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <FloatingAppsOrbit phase={orbitPhase} />
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === 'detecting' && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-w-sm"
            >
              <h1 className="text-2xl font-semibold text-foreground">Detecting your apps</h1>
              <p className="mt-2 text-muted-foreground">Looking for wallets, banks, and billers…</p>
            </motion.div>
          )}

          {phase === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-md"
            >
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Found {detectedApps.length} apps</h1>
                <p className="mt-2 text-muted-foreground">Connect everything to FLOW in one tap.</p>
              </div>

              <div className="mt-6 space-y-4 max-h-[28vh] overflow-y-auto">
                {Object.entries(groupedApps).map(([category, apps], catIndex) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: catIndex * 0.08 }}
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {CATEGORY_LABELS[category] || category}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {apps.map((app) => (
                        <AppPill key={app.name} app={app} isConnected={connectedAppNames.has(app.name)} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center max-w-sm"
            >
              <h2 className="text-2xl font-semibold text-foreground">Connecting securely</h2>
              <p className="mt-2 text-muted-foreground">Linking your apps to FLOW…</p>

              <div className="mt-6 max-w-xs mx-auto">
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{Math.round(progress)}%</span>
                  <span>
                    {successCount} of {detectedApps.length} connected
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative w-24 h-24 mx-auto mb-6"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-success/20"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  className="absolute inset-0 rounded-full bg-success/30"
                />

                <div className="absolute inset-0 rounded-full bg-success/10 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-12 h-12 text-success" strokeWidth={3} />
                  </motion.div>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2"
              >
                All connected
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-muted-foreground mb-2">{successCount} apps linked to FLOW</p>
                <p className="text-lg font-medium text-foreground">RM {totalBalance.toFixed(2)} available</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-6"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Your money stays in your apps</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 pb-8 relative z-10 safe-area-bottom">
        {phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <span>FLOW never holds your money. You always confirm first.</span>
            </div>

            <Button
              onClick={handleQuickConnect}
              disabled={isConnecting || detectedApps.length === 0}
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-primary-foreground shadow-glow-aurora"
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
