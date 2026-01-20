/**
 * FLOW Auto Sync - Screen 2: Connecting Apps
 * 
 * Apple Glass-inspired, production-ready implementation
 * 
 * Purpose: Show secure linking progress for each selected app
 * 
 * Connection States:
 * - waiting: Queued for connection
 * - redirecting: Opening OAuth/deep link
 * - authorizing: User is in external app granting access
 * - connected: Successfully linked
 * - needs_attention: Requires user action
 * 
 * Security Rules:
 * - Never store login credentials
 * - Never handle OTP directly
 * - OAuth 2.0 / Open Banking APIs / Official deep links only
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Loader2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Lock,
  Fingerprint,
  ChevronLeft
} from 'lucide-react';
import { APP_CATALOG, type AppConfig } from './AutoSyncSelectApps';

// ============================================
// Types
// ============================================

type ConnectionState = 
  | 'waiting' 
  | 'redirecting' 
  | 'authorizing' 
  | 'connected' 
  | 'needs_attention';

interface AppConnectionStatus {
  appId: string;
  state: ConnectionState;
  message?: string;
  progress?: number;
}

interface AutoSyncConnectingProps {
  selectedApps: string[];
  onComplete: (results: AppConnectionStatus[]) => void;
  onBack: () => void;
}

// ============================================
// State Configuration
// ============================================

const STATE_CONFIG: Record<ConnectionState, {
  label: string;
  icon: typeof Check;
  color: string;
  bgColor: string;
  animate: boolean;
}> = {
  waiting: {
    label: 'Waiting',
    icon: Loader2,
    color: 'text-white/40',
    bgColor: 'bg-white/5',
    animate: false,
  },
  redirecting: {
    label: 'Opening app...',
    icon: ExternalLink,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    animate: true,
  },
  authorizing: {
    label: 'Authorize in app',
    icon: Fingerprint,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    animate: true,
  },
  connected: {
    label: 'Connected',
    icon: Check,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    animate: false,
  },
  needs_attention: {
    label: 'Needs attention',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    animate: false,
  },
};

// ============================================
// Connection Card Component
// ============================================

interface ConnectionCardProps {
  app: AppConfig;
  status: AppConnectionStatus;
  isActive: boolean;
  index: number;
}

const ConnectionCard = ({ app, status, isActive, index }: ConnectionCardProps) => {
  const config = STATE_CONFIG[status.state];
  const Icon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`
        relative overflow-hidden rounded-2xl p-4
        transition-all duration-500
        ${isActive 
          ? 'bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-lg scale-[1.02]' 
          : 'bg-white/5 backdrop-blur-sm'
        }
      `}
    >
      {/* Active indicator glow */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      
      <div className="relative flex items-center gap-4">
        {/* App Icon */}
        <div 
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center text-2xl
            transition-all duration-300
            ${status.state === 'connected' ? 'scale-105' : ''}
          `}
          style={{ 
            background: status.state === 'connected'
              ? `linear-gradient(135deg, ${app.color}60, ${app.color}30)` 
              : 'rgba(255,255,255,0.05)',
            boxShadow: status.state === 'connected' 
              ? `0 4px 20px ${app.color}40` 
              : 'none'
          }}
        >
          {app.icon}
        </div>
        
        {/* App Info & Status */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {app.displayName}
          </h3>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div className={`
              flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
              ${config.bgColor} ${config.color}
            `}>
              <Icon 
                className={`w-3 h-3 ${config.animate ? 'animate-spin' : ''}`} 
              />
              <span>{config.label}</span>
            </div>
          </div>
          
          {/* Progress message */}
          {status.message && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs text-white/50 mt-1.5"
            >
              {status.message}
            </motion.p>
          )}
        </div>
        
        {/* State icon */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${config.bgColor}
        `}>
          {status.state === 'connected' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-5 h-5 text-emerald-400" strokeWidth={3} />
            </motion.div>
          ) : status.state === 'needs_attention' ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : isActive ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-5 h-5 text-blue-400" />
            </motion.div>
          ) : (
            <div className="w-2 h-2 rounded-full bg-white/20" />
          )}
        </div>
      </div>
      
      {/* Progress bar for active connections */}
      {isActive && status.progress !== undefined && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: '0%' }}
            animate={{ width: `${status.progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export function AutoSyncConnecting({ selectedApps, onComplete, onBack }: AutoSyncConnectingProps) {
  const [statuses, setStatuses] = useState<Map<string, AppConnectionStatus>>(
    () => new Map(selectedApps.map(id => [id, { appId: id, state: 'waiting' as ConnectionState }]))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const connectionInProgress = useRef(false);

  // Get app configs for selected apps
  const apps = selectedApps
    .map(id => APP_CATALOG.find(a => a.id === id))
    .filter((a): a is AppConfig => a !== undefined);

  // Simulate OAuth connection for an app
  const connectApp = useCallback(async (appId: string): Promise<AppConnectionStatus> => {
    const updateStatus = (state: ConnectionState, message?: string, progress?: number) => {
      setStatuses(prev => {
        const next = new Map(prev);
        next.set(appId, { appId, state, message, progress });
        return next;
      });
    };

    // Stage 1: Redirecting
    updateStatus('redirecting', 'Opening secure connection...', 20);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));

    // Stage 2: Authorizing
    updateStatus('authorizing', 'Complete authorization in the app', 50);
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

    // Stage 3: Finalizing (simulated success/failure)
    updateStatus('authorizing', 'Verifying permissions...', 80);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    // 95% success rate for demo
    const success = Math.random() > 0.05;

    if (success) {
      updateStatus('connected', 'Securely linked via OAuth 2.0', 100);
      return { appId, state: 'connected' };
    } else {
      updateStatus('needs_attention', 'Authorization was cancelled or timed out');
      return { appId, state: 'needs_attention' };
    }
  }, []);

  // Sequential connection process
  useEffect(() => {
    if (connectionInProgress.current) return;
    if (currentIndex >= apps.length) {
      setIsComplete(true);
      return;
    }

    connectionInProgress.current = true;
    const currentApp = apps[currentIndex];

    connectApp(currentApp.id).then(() => {
      connectionInProgress.current = false;
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentIndex, apps, connectApp]);

  // Handle completion
  const handleContinue = useCallback(() => {
    const results = Array.from(statuses.values());
    onComplete(results);
  }, [statuses, onComplete]);

  // Calculate progress
  const connectedCount = Array.from(statuses.values()).filter(s => s.state === 'connected').length;
  const failedCount = Array.from(statuses.values()).filter(s => s.state === 'needs_attention').length;
  const totalProgress = ((connectedCount + failedCount) / apps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col safe-area-top safe-area-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back button */}
            {!isComplete && currentIndex === 0 && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-white/60 hover:text-white mb-4 -ml-1 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Back</span>
              </button>
            )}
            
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-1 rounded-full bg-white/60" />
              <div className="w-8 h-1 rounded-full bg-white/60" />
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>
            
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isComplete ? 'Apps Connected' : 'Connecting Apps'}
            </h1>
            <p className="text-white/50 mt-2 text-base">
              {isComplete 
                ? `${connectedCount} of ${apps.length} apps linked securely`
                : 'Establishing secure connections...'
              }
            </p>
          </motion.div>

          {/* Overall Progress */}
          <motion.div 
            className="mt-6 h-1 bg-white/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"
              initial={{ width: '0%' }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        </header>

        {/* Connection Cards */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="space-y-3">
            {apps.map((app, idx) => {
              const status = statuses.get(app.id) || { appId: app.id, state: 'waiting' as ConnectionState };
              const isActive = idx === currentIndex && !isComplete;
              
              return (
                <ConnectionCard
                  key={app.id}
                  app={app}
                  status={status}
                  isActive={isActive}
                  index={idx}
                />
              );
            })}
          </div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white/90 text-sm">
                  Secure OAuth Connection
                </h4>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  FLOW uses official OAuth 2.0 and Open Banking APIs. 
                  Your login credentials are never stored or seen by FLOW.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Fixed Bottom CTA */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-20"
            >
              {/* Gradient fade */}
              <div className="h-8 bg-gradient-to-t from-black to-transparent" />
              
              <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 pb-8 pt-4 safe-area-bottom">
                {/* Success summary */}
                {failedCount > 0 && (
                  <div className="flex items-center gap-2 mb-4 text-amber-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{failedCount} app{failedCount !== 1 ? 's' : ''} need{failedCount === 1 ? 's' : ''} attention</span>
                  </div>
                )}
                
                <motion.button
                  onClick={handleContinue}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-14 rounded-2xl font-semibold text-base
                    flex items-center justify-center gap-2
                    bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 
                    text-white shadow-lg shadow-emerald-500/25"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connecting indicator (when not complete) */}
        {!isComplete && (
          <div className="fixed bottom-0 left-0 right-0 z-20">
            <div className="h-8 bg-gradient-to-t from-black to-transparent" />
            <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 pb-8 pt-4 safe-area-bottom">
              <div className="flex items-center justify-center gap-3 text-white/60">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-5 h-5" />
                </motion.div>
                <span className="text-sm">
                  Connecting {currentIndex + 1} of {apps.length}...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { ConnectionState, AppConnectionStatus };
