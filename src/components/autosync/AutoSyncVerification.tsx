/**
 * FLOW Auto Sync - Screen 3: Secure Verification (Conditional)
 * 
 * Apple Glass-inspired, production-ready implementation
 * 
 * Purpose: Handle additional authentication required by banks/wallets
 * 
 * Examples:
 * - OTP entry inside bank app
 * - Biometric confirmation
 * - App approval prompt
 * 
 * Behavior Rules:
 * - FLOW hands off to provider
 * - FLOW only receives success or failure state
 * - FLOW never handles OTP/biometrics directly
 * 
 * Microcopy: "Secure verification required by your provider."
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Smartphone, 
  ShieldCheck,
  Lock,
  ExternalLink,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import { type AppConfig } from './AutoSyncSelectApps';

// ============================================
// Types
// ============================================

type VerificationType = 'otp' | 'biometric' | 'app_approval' | 'unknown';
type VerificationStatus = 'pending' | 'waiting' | 'success' | 'failed' | 'timeout';

interface VerificationRequest {
  app: AppConfig;
  type: VerificationType;
  providerMessage?: string;
}

interface AutoSyncVerificationProps {
  request: VerificationRequest;
  onSuccess: () => void;
  onFailure: (reason: string) => void;
  onRetry: () => void;
  onCancel: () => void;
}

// ============================================
// Verification Type Configuration
// ============================================

const VERIFICATION_CONFIG: Record<VerificationType, {
  icon: typeof Fingerprint;
  title: string;
  description: string;
  instruction: string;
}> = {
  otp: {
    icon: Smartphone,
    title: 'SMS Verification',
    description: 'Your provider sent a verification code',
    instruction: 'Enter the OTP in your banking app to continue',
  },
  biometric: {
    icon: Fingerprint,
    title: 'Biometric Verification',
    description: 'Your provider requires biometric confirmation',
    instruction: 'Use Face ID or fingerprint in your app',
  },
  app_approval: {
    icon: ShieldCheck,
    title: 'App Approval',
    description: 'Your provider needs you to approve this connection',
    instruction: 'Tap "Approve" in your banking app',
  },
  unknown: {
    icon: Lock,
    title: 'Verification Required',
    description: 'Your provider requires additional verification',
    instruction: 'Complete the verification in your app',
  },
};

// ============================================
// Animated Waiting Indicator
// ============================================

const WaitingPulse = () => (
  <div className="relative w-32 h-32">
    {/* Outer rings */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border border-white/20"
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ 
          scale: [0.8, 1.2, 0.8],
          opacity: [0.6, 0, 0.6],
        }}
        transition={{
          duration: 2.5,
          delay: i * 0.4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    ))}
    
    {/* Core circle */}
    <motion.div
      className="absolute inset-4 rounded-full bg-gradient-to-br from-white/20 to-white/5 
                 backdrop-blur-xl flex items-center justify-center"
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12"
      >
        <Lock className="w-full h-full text-white/60" />
      </motion.div>
    </motion.div>
  </div>
);

// ============================================
// Success Animation
// ============================================

const SuccessAnimation = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 
               flex items-center justify-center backdrop-blur-xl"
  >
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
    >
      <Check className="w-16 h-16 text-emerald-400" strokeWidth={3} />
    </motion.div>
  </motion.div>
);

// ============================================
// Failure Animation
// ============================================

const FailureAnimation = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/20 
               flex items-center justify-center backdrop-blur-xl"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
    >
      <X className="w-16 h-16 text-red-400" strokeWidth={3} />
    </motion.div>
  </motion.div>
);

// ============================================
// Main Component
// ============================================

export function AutoSyncVerification({ 
  request, 
  onSuccess, 
  onFailure, 
  onRetry,
  onCancel 
}: AutoSyncVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minute timeout
  
  const config = VERIFICATION_CONFIG[request.type];
  const Icon = config.icon;

  // Simulate waiting for external verification
  // In production, this would poll an endpoint or listen for a callback
  useEffect(() => {
    if (status !== 'waiting') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulate receiving verification result (demo only)
    const demoTimeout = setTimeout(() => {
      // 90% success rate for demo
      if (Math.random() > 0.1) {
        setStatus('success');
        setTimeout(onSuccess, 1500);
      } else {
        setStatus('failed');
      }
    }, 4000 + Math.random() * 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(demoTimeout);
    };
  }, [status, onSuccess]);

  // Start waiting when component mounts
  useEffect(() => {
    const startDelay = setTimeout(() => {
      setStatus('waiting');
    }, 500);
    return () => clearTimeout(startDelay);
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    setStatus('pending');
    setTimeRemaining(120);
    setTimeout(() => setStatus('waiting'), 500);
    onRetry();
  }, [onRetry]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] 
                     bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 
                     rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
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
            {/* Back/Cancel button */}
            <button
              onClick={onCancel}
              className="flex items-center gap-1 text-white/60 hover:text-white mb-4 -ml-1 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Cancel</span>
            </button>
            
            {/* App indicator */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${request.app.color}40, ${request.app.color}20)`,
                }}
              >
                {request.app.icon}
              </div>
              <div>
                <p className="text-sm text-white/50">Connecting to</p>
                <h2 className="font-semibold text-white">{request.app.displayName}</h2>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
          <AnimatePresence mode="wait">
            {/* Waiting State */}
            {(status === 'pending' || status === 'waiting') && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <WaitingPulse />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 space-y-3"
                >
                  <h1 className="text-2xl font-bold text-white">
                    {config.title}
                  </h1>
                  <p className="text-white/50 max-w-xs">
                    {config.description}
                  </p>
                </motion.div>

                {/* Instruction card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 max-w-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-sm text-white/80 text-left">
                      {config.instruction}
                    </p>
                  </div>
                </motion.div>

                {/* Time remaining */}
                {status === 'waiting' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-6 text-sm text-white/40"
                  >
                    Waiting for verification • {formatTime(timeRemaining)}
                  </motion.div>
                )}

                {/* External app hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-8 flex items-center gap-2 text-xs text-white/30"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Complete verification in {request.app.displayName}</span>
                </motion.div>
              </motion.div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <SuccessAnimation />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 space-y-2"
                >
                  <h1 className="text-2xl font-bold text-white">
                    Verified Successfully
                  </h1>
                  <p className="text-white/50">
                    {request.app.displayName} is now connected
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Failed/Timeout State */}
            {(status === 'failed' || status === 'timeout') && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center text-center"
              >
                <FailureAnimation />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 space-y-2"
                >
                  <h1 className="text-2xl font-bold text-white">
                    {status === 'timeout' ? 'Verification Timed Out' : 'Verification Failed'}
                  </h1>
                  <p className="text-white/50 max-w-xs">
                    {status === 'timeout' 
                      ? 'The verification request expired. Please try again.'
                      : 'The verification was not completed. Please try again.'}
                  </p>
                </motion.div>

                {/* Retry button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleRetry}
                  className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl 
                           bg-white/10 hover:bg-white/15 transition-colors
                           text-white font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </motion.button>

                {/* Skip option */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={() => onFailure(status === 'timeout' ? 'Verification timed out' : 'Verification failed')}
                  className="mt-4 text-sm text-white/40 hover:text-white/60 transition-colors"
                >
                  Skip this app
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Footer */}
        <div className="px-6 pb-8 safe-area-bottom">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex items-center justify-center gap-2 text-xs text-white/30"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Secure verification required by your provider</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export type { VerificationType, VerificationStatus, VerificationRequest };
