/**
 * Apple Intelligence-Style Onboarding Flow
 * 
 * Full-screen immersive onboarding with floating app constellation,
 * fluid animations, and liquid glass effects inspired by Apple's
 * iCloud/Apple Intelligence initialization screens.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  ChevronRight,
  Check,
  Fingerprint,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { FloatingAppsOrbit } from './FloatingAppsOrbit';

interface OnboardingPhase {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
}

const PHASES: OnboardingPhase[] = [
  {
    id: 'welcome',
    title: 'Welcome to FLOW',
    subtitle: 'Your unified payment intelligence layer',
    gradient: 'from-aurora-blue via-aurora-purple to-aurora-pink',
  },
  {
    id: 'discover',
    title: 'Discovering Your Apps',
    subtitle: 'Finding your wallets, banks, and payment apps',
    gradient: 'from-aurora-teal to-aurora-blue',
  },
  {
    id: 'connect',
    title: 'Connecting Everything',
    subtitle: 'Linking your payment sources to FLOW',
    gradient: 'from-aurora-purple to-aurora-pink',
  },
  {
    id: 'ready',
    title: 'You\'re All Set',
    subtitle: 'One tap. Best rail. Every time.',
    gradient: 'from-aurora-teal via-aurora-blue to-aurora-purple',
  },
];

const FEATURES = [
  { icon: Zap, text: 'Smart payment routing' },
  { icon: Shield, text: 'Bank-grade security' },
  { icon: Fingerprint, text: 'Biometric protection' },
];

export function AppleOnboardingFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasCompleted, completeOnboarding, isLoading } = useOnboarding();
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [orbitPhase, setOrbitPhase] = useState<'idle' | 'detecting' | 'syncing' | 'complete'>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const phase = PHASES[currentPhase];

  // Auto-advance through phases with elegant timing
  useEffect(() => {
    if (currentPhase === 0) {
      // Welcome phase - wait for user interaction or auto-advance
      const timer = setTimeout(() => {
        handleNext();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentPhase]);

  useEffect(() => {
    // Update orbit phase based on current phase
    if (currentPhase === 0) {
      setOrbitPhase('idle');
    } else if (currentPhase === 1) {
      setOrbitPhase('detecting');
    } else if (currentPhase === 2) {
      setOrbitPhase('syncing');
    } else if (currentPhase === 3) {
      setOrbitPhase('complete');
    }
  }, [currentPhase]);

  const handleNext = () => {
    if (isTransitioning) return;
    
    if (currentPhase < PHASES.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentPhase(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSyncComplete = () => {
    // Move to ready phase after sync animation completes
    if (currentPhase === 2) {
      setCurrentPhase(3);
    }
  };

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
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-aurora-teal/10 blur-[80px]"
        />
      </div>

      {/* Skip button */}
      {currentPhase < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
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
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 safe-area-top safe-area-bottom">
        {/* Floating Apps Constellation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <FloatingAppsOrbit 
            phase={orbitPhase} 
            onSyncComplete={handleSyncComplete}
          />
        </motion.div>

        {/* Phase content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="text-center max-w-sm"
          >
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-foreground mb-3 tracking-tight"
            >
              {phase.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-lg"
            >
              {phase.subtitle}
            </motion.p>

            {/* Features (only on ready phase) */}
            {currentPhase === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 space-y-3"
              >
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="flex items-center justify-center gap-3 text-sm text-muted-foreground"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <span>{feature.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex gap-2"
        >
          {PHASES.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentPhase ? 24 : 8,
                backgroundColor: i <= currentPhase 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--muted))',
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </motion.div>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 w-full max-w-xs"
        >
          {currentPhase === 3 ? (
            <Button
              onClick={handleGetStarted}
              className="w-full h-14 rounded-2xl aurora-gradient text-white text-base font-medium shadow-glow-aurora"
            >
              Get Started
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          ) : currentPhase === 0 ? (
            <Button
              onClick={handleNext}
              className="w-full h-14 rounded-2xl aurora-gradient text-white text-base font-medium shadow-glow-aurora"
            >
              Begin Setup
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          ) : currentPhase === 1 ? (
            <Button
              onClick={handleNext}
              variant="ghost"
              className="w-full h-14 rounded-2xl text-base font-medium"
            >
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Scanning...
              </motion.span>
            </Button>
          ) : (
            <div className="h-14 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* Glass overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/50" />
    </motion.div>
  );
}
