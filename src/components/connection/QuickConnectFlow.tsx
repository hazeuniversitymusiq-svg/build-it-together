/**
 * Quick Connect Flow Component
 * 
 * Honest connection flow with user-controlled app selection:
 * Select Apps → Connecting (real DB writes) → Complete
 * 
 * No fake "detecting" animations - users choose their apps.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Check,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  CircleCheck,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useConnectionEngine } from '@/hooks/useConnectionEngine';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/hooks/useHaptics';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';
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

const CATEGORY_LABELS: Record<string, string> = {
  wallet: 'E-Wallets',
  bank: 'Banks',
  bnpl: 'Buy Now Pay Later',
  biller: 'Bills & Utilities',
};

// Smart defaults - popular apps pre-selected
const POPULAR_APPS = ['TouchNGo', 'GrabPay', 'Maybank', 'DuitNow', 'Atome'];

// Individual app row with connection status (for connecting phase)
function AppConnectionRow({ 
  app, 
  status,
  index,
}: { 
  app: AppDefinition; 
  status: AppStatus;
  index: number;
}) {
  const BrandIcon = getBrandedIcon(app.name, app.category);
  
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
      {/* App branded icon */}
      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
        <BrandIcon size={40} />
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

// Selectable app pill for the select phase
function SelectableAppPill({ 
  app, 
  isSelected,
  onToggle,
  isPopular,
}: { 
  app: AppDefinition; 
  isSelected: boolean;
  onToggle: () => void;
  isPopular?: boolean;
}) {
  const BrandIcon = getBrandedIcon(app.name, app.category);
  
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm
        transition-all duration-200 relative
        ${isSelected 
          ? 'bg-success/10 ring-2 ring-success/30' 
          : 'bg-muted/50 ring-1 ring-muted-foreground/10 hover:bg-muted/70'
        }
      `}
    >
      {/* Brand icon */}
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
        <BrandIcon size={32} />
      </div>
      
      <span className={`font-medium ${isSelected ? 'text-success' : 'text-foreground'}`}>
        {app.displayName}
      </span>
      
      {/* Selection indicator */}
      {isSelected ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
          className="ml-1"
        >
          <Check className="w-4 h-4 text-success" />
        </motion.div>
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground/30 ml-1" />
      )}
      
      {/* Popular indicator */}
      {isPopular && !isSelected && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-aurora-blue ring-2 ring-background" />
      )}
    </motion.button>
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
    totalBalance,
  } = useConnectionEngine();

  // Start directly on 'select' phase - no fake detecting
  const [phase, setPhase] = useState<'select' | 'connecting' | 'complete'>('select');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [appStates, setAppStates] = useState<Map<string, AppConnectionState>>(new Map());
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);

  // Initialize selected apps with smart defaults when apps are loaded
  useEffect(() => {
    if (detectedApps.length > 0 && selectedApps.size === 0) {
      const defaults = new Set<string>();
      detectedApps.forEach(app => {
        // Pre-select popular apps
        if (POPULAR_APPS.includes(app.name)) {
          defaults.add(app.name);
        }
      });
      // If no popular apps found, select first 4
      if (defaults.size === 0) {
        detectedApps.slice(0, 4).forEach(app => defaults.add(app.name));
      }
      setSelectedApps(defaults);
      
      // Initialize app states
      const initialStates = new Map<string, AppConnectionState>();
      detectedApps.forEach(app => {
        initialStates.set(app.name, { status: 'pending' });
      });
      setAppStates(initialStates);
    }
  }, [detectedApps, selectedApps.size]);

  // Mark already connected apps
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

  const toggleApp = useCallback((appName: string) => {
    haptics.selection();
    setSelectedApps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appName)) {
        newSet.delete(appName);
      } else {
        newSet.add(appName);
      }
      return newSet;
    });
  }, [haptics]);

  const selectAll = useCallback(() => {
    haptics.impact();
    setSelectedApps(new Set(detectedApps.map(app => app.name)));
  }, [haptics, detectedApps]);

  const deselectAll = useCallback(() => {
    haptics.selection();
    setSelectedApps(new Set());
  }, [haptics]);

  const allSelected = detectedApps.length > 0 && selectedApps.size === detectedApps.length;

  const updateAppStatus = useCallback((appName: string, status: AppStatus, message?: string) => {
    setAppStates(prev => {
      const newStates = new Map(prev);
      newStates.set(appName, { status, message });
      return newStates;
    });
  }, []);

  const handleQuickConnect = async () => {
    if (selectedApps.size === 0) {
      toast({
        title: 'Select Apps',
        description: 'Please select at least one app to connect.',
        variant: 'destructive',
      });
      return;
    }

    setPhase('connecting');
    haptics.impact();
    setProgress(0);
    setSuccessCount(0);

    const appsToConnect = detectedApps.filter(app => selectedApps.has(app.name));
    const totalApps = appsToConnect.length;
    let currentSuccess = 0;

    // Animate through each selected app with staggered connection
    for (let i = 0; i < appsToConnect.length; i++) {
      const app = appsToConnect[i];
      
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
        if (selectedApps.has(appResult.appName)) {
          if (appResult.isConnected) {
            updateAppStatus(appResult.appName, 'success');
            currentSuccess++;
            haptics.selection();
          } else {
            updateAppStatus(appResult.appName, 'error', appResult.error);
          }
        }
      });
    } else {
      // Fallback: mark selected as success if quickConnect succeeded
      if (result.success) {
        appsToConnect.forEach(app => {
          updateAppStatus(app.name, 'success');
          currentSuccess++;
        });
      }
    }

    setSuccessCount(currentSuccess || result.synced);
    setProgress(100);

    // Short delay before completing
    await new Promise(resolve => setTimeout(resolve, 500));

    if (result.success || result.synced > 0) {
      haptics.success();
      setPhase('complete');
      toast({
        title: 'Apps Connected!',
        description: `${currentSuccess || result.synced} apps linked to FLOW`,
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
      setPhase('select');
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

  // Get apps to display during connecting phase
  const appsToConnect = detectedApps.filter(app => selectedApps.has(app.name));

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-aurora-gradient opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-aurora-pink/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Skip button */}
      {showSkip && phase !== 'complete' && phase !== 'connecting' && (
        <div className="absolute top-4 right-4 z-10">
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
          {/* Select phase - User chooses apps */}
          {phase === 'select' && (
            <motion.div
              key="select"
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
                  Select Your Apps
                </h1>
                <p className="text-muted-foreground">
                  Tap to select the apps you use
                </p>
                
                {/* Select All / Deselect All toggle */}
                {!isLoading && detectedApps.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={allSelected ? deselectAll : selectAll}
                    className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {allSelected ? 'Deselect All' : `Select All (${detectedApps.length})`}
                  </motion.button>
                )}
              </div>

              {/* Loading state */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                /* Selectable apps by category */
                <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                  {Object.entries(groupedApps).map(([category, apps], catIndex) => (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: catIndex * 0.1 }}
                    >
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        {CATEGORY_LABELS[category] || category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {apps.map(app => (
                          <SelectableAppPill
                            key={app.name}
                            app={app}
                            isSelected={selectedApps.has(app.name)}
                            onToggle={() => toggleApp(app.name)}
                            isPopular={POPULAR_APPS.includes(app.name)}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Connecting phase - with detailed progress */}
          {phase === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-h-[85vh] flex flex-col"
            >
              {/* Header with progress */}
              <div className="text-center mb-6">
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      '0 0 20px rgba(139, 92, 246, 0.3)',
                      '0 0 40px rgba(139, 92, 246, 0.5)',
                      '0 0 20px rgba(139, 92, 246, 0.3)',
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 rounded-[1.25rem] aurora-gradient flex items-center justify-center"
                >
                  <Zap className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-xl font-semibold mb-1">Connecting Your Apps</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Linking to FLOW securely...
                </p>
                
                {/* Progress bar */}
                <div className="max-w-xs mx-auto">
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{Math.round(progress)}%</span>
                    <span>{successCount} of {appsToConnect.length} connected</span>
                  </div>
                </div>
              </div>

              {/* App list with status */}
              <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                {appsToConnect.map((app, index) => (
                  <AppConnectionRow
                    key={app.name}
                    app={app}
                    status={appStates.get(app.name)?.status || 'pending'}
                    index={index}
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
              {/* Success animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="relative w-24 h-24 mx-auto mb-6"
              >
                {/* Ripple effect */}
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
                
                {/* Check icon */}
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
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
              >
                All Connected!
              </motion.h2>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-muted-foreground mb-2">
                  {successCount} apps linked to FLOW
                </p>
                <p className="text-lg font-medium text-foreground">
                  RM {totalBalance.toFixed(2)} available
                </p>
              </motion.div>

              {/* Connected apps summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex flex-wrap justify-center gap-2"
              >
                {appsToConnect.slice(0, 5).map((app, i) => (
                  <motion.div
                    key={app.name}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 text-success text-sm"
                  >
                    <CircleCheck className="w-4 h-4" />
                    <span>{app.displayName}</span>
                  </motion.div>
                ))}
                {appsToConnect.length > 5 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 1.1 }}
                    className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm"
                  >
                    +{appsToConnect.length - 5} more
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
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
      <div className="px-6 pb-8 relative z-10">
        {phase === 'select' && (
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
              disabled={isConnecting || selectedApps.size === 0 || isLoading}
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora"
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Connect {selectedApps.size} App{selectedApps.size !== 1 ? 's' : ''}
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
