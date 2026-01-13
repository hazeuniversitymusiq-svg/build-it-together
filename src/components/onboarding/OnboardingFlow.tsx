/**
 * Onboarding Flow Component
 * 
 * Full-screen guided walkthrough for first-time users.
 * Auto-enables demo mode and introduces key features.
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  CreditCard, 
  QrCode, 
  Send, 
  Receipt,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/contexts/DemoContext';
import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route?: string;
  gradient: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to FLOW',
    description: 'Your unified payment layer that works across all your wallets and banks. One tap, any payment.',
    icon: <Sparkles className="w-12 h-12" />,
    gradient: 'from-aurora-blue via-aurora-purple to-aurora-pink',
  },
  {
    id: 'home',
    title: 'Your Wallet Hub',
    description: 'See all your balances in one place. FLOW automatically picks the best source for each payment.',
    icon: <Wallet className="w-12 h-12" />,
    route: '/home',
    gradient: 'from-aurora-teal to-aurora-blue',
  },
  {
    id: 'flow-card',
    title: 'Flow Card',
    description: 'A virtual card that taps into all your payment sources. Pay at any terminal, online or in-store.',
    icon: <CreditCard className="w-12 h-12" />,
    route: '/flow-card',
    gradient: 'from-aurora-purple to-aurora-pink',
  },
  {
    id: 'scan',
    title: 'Scan to Pay',
    description: 'Scan any QR code — DuitNow, Touch\'n\'Go, GrabPay, or Boost. FLOW handles the rest.',
    icon: <QrCode className="w-12 h-12" />,
    route: '/scan',
    gradient: 'from-aurora-blue to-aurora-teal',
  },
  {
    id: 'send',
    title: 'Send Money',
    description: 'Send to any contact. FLOW finds the best way to deliver — no matter which wallet they use.',
    icon: <Send className="w-12 h-12" />,
    route: '/send',
    gradient: 'from-aurora-pink to-aurora-purple',
  },
  {
    id: 'bills',
    title: 'Pay Bills',
    description: 'Link your billers once. FLOW reminds you when bills are due and pays them automatically.',
    icon: <Receipt className="w-12 h-12" />,
    route: '/bills',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'demo',
    title: 'Demo Mode Active',
    description: 'We\'ve enabled Demo mode for you. Look for highlighted elements — tap them to learn how features work!',
    icon: <Sparkles className="w-12 h-12" />,
    route: '/home',
    gradient: 'from-aurora-purple via-aurora-blue to-aurora-teal',
  },
];

export function OnboardingFlow() {
  const navigate = useNavigate();
  const { enableDemoMode } = useDemo();
  const { 
    currentStep, 
    nextStep, 
    prevStep, 
    completeOnboarding,
    hasCompleted,
    isLoading 
  } = useOnboarding();

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Auto-enable demo mode on last step
  useEffect(() => {
    if (isLastStep) {
      enableDemoMode();
    }
  }, [isLastStep, enableDemoMode]);

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      if (step.route) {
        navigate(step.route);
      }
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    enableDemoMode();
    completeOnboarding();
    navigate('/home');
  };

  if (isLoading || hasCompleted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-10 safe-area-top">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground"
        >
          Skip
          <X className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Progress Dots */}
      <div className="pt-14 pb-4 px-6 safe-area-top">
        <div className="flex justify-center gap-2">
          {ONBOARDING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep 
                  ? 'w-8 bg-primary' 
                  : i < currentStep 
                    ? 'w-1.5 bg-primary/50' 
                    : 'w-1.5 bg-muted'
              }`}
              animate={{ scale: i === currentStep ? 1 : 0.8 }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-sm"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`w-32 h-32 rounded-[2rem] bg-gradient-to-br ${step.gradient} 
                flex items-center justify-center mx-auto mb-8 shadow-glow-aurora text-white`}
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {step.title}
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-lg leading-relaxed">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 pb-10 safe-area-bottom">
        <div className="flex gap-3">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl glass-card border-0"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className={`h-14 rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora ${
              isFirstStep ? 'w-full' : 'flex-1'
            }`}
          >
            {isLastStep ? (
              <>
                Get Started
                <Sparkles className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Step Counter */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          {currentStep + 1} of {ONBOARDING_STEPS.length}
        </p>
      </div>
    </motion.div>
  );
}
