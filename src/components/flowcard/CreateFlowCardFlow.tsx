/**
 * Create Flow Card Flow
 * 
 * Step-by-step card creation with clear explanations.
 * Follows Apple-level simplicity.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Shield, 
  Fingerprint, 
  CheckCircle2, 
  ArrowRight,
  Smartphone,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useOrchestration } from '@/contexts/OrchestrationContext';
import { FlowCardVisual } from './FlowCardVisual';

interface CreateFlowCardFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

const steps = [
  {
    id: 'intro',
    title: 'What is Flow Card?',
    icon: CreditCard,
  },
  {
    id: 'security',
    title: 'Device & Security',
    icon: Shield,
  },
  {
    id: 'sources',
    title: 'Funding Sources',
    icon: Wallet,
  },
  {
    id: 'complete',
    title: 'All Set',
    icon: CheckCircle2,
  },
];

export function CreateFlowCardFlow({ onComplete, onCancel }: CreateFlowCardFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const { createFlowCard, deviceId, eligibleSources } = useFlowCard();
  const { sources } = useOrchestration();

  const linkedSources = sources.filter(s => s.isLinked);

  const handleNext = async () => {
    if (currentStep === steps.length - 2) {
      // Create the card
      setIsCreating(true);
      const success = await createFlowCard();
      setIsCreating(false);
      
      if (success) {
        setCurrentStep(prev => prev + 1);
      }
    } else if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onCancel();
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      <div className="p-6 pt-8">
        <div className="flex gap-2 max-w-xs mx-auto">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                idx <= currentStep ? 'aurora-gradient' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Step 1: Introduction */}
            {currentStep === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <div className="w-20 h-20 rounded-full aurora-gradient flex items-center justify-center mb-6 mx-auto shadow-glow-blue">
                    <CreditCard size={36} className="text-white" />
                  </div>
                  <h1 className="text-2xl font-bold mb-4">Flow Card</h1>
                  <p className="text-muted-foreground max-w-sm leading-relaxed">
                    Flow Card lets Flow decide the best way to pay using your authorised wallets and banks.
                  </p>
                </motion.div>

                <div className="space-y-4 max-w-sm w-full">
                  <div className="glass-card rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-aurora-blue/10 flex items-center justify-center flex-shrink-0">
                      <Shield size={16} className="text-aurora-blue" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">Not a wallet</p>
                      <p className="text-xs text-muted-foreground">Flow Card does not hold money</p>
                    </div>
                  </div>
                  
                  <div className="glass-card rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-aurora-purple/10 flex items-center justify-center flex-shrink-0">
                      <Fingerprint size={16} className="text-aurora-purple" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">You're in control</p>
                      <p className="text-xs text-muted-foreground">Every payment requires your confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {currentStep === 1 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 mx-auto">
                    <Shield size={36} className="text-success" />
                  </div>
                  <h1 className="text-2xl font-bold mb-4">Device & Security</h1>
                  <p className="text-muted-foreground max-w-sm leading-relaxed">
                    Flow Card is tied to this device and protected by biometrics.
                  </p>
                </motion.div>

                <div className="space-y-4 max-w-sm w-full">
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Smartphone size={20} className="text-foreground" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-sm">This Device</p>
                      <p className="text-xs text-muted-foreground font-mono">{deviceId}</p>
                    </div>
                    <CheckCircle2 size={20} className="text-success" />
                  </div>
                  
                  <div className="glass-card rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Fingerprint size={20} className="text-foreground" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-sm">Biometric Protection</p>
                      <p className="text-xs text-muted-foreground">Face ID or Fingerprint</p>
                    </div>
                    <CheckCircle2 size={20} className="text-success" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-6 max-w-xs">
                  If your device changes, Flow Card will re-bind safely.
                </p>
              </div>
            )}

            {/* Step 3: Funding Sources */}
            {currentStep === 2 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 rounded-full bg-aurora-teal/10 flex items-center justify-center mb-6 mx-auto">
                    <Wallet size={36} className="text-aurora-teal" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Funding Sources</h1>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Flow Card will use your linked sources in priority order
                  </p>
                </motion.div>

                <div className="space-y-3 max-w-sm w-full">
                  {linkedSources.length > 0 ? (
                    linkedSources.map((source, idx) => (
                      <motion.div
                        key={source.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="glass-card rounded-xl p-4 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-sm">{source.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{source.type}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          RM {source.balance.toFixed(2)}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <div className="glass-card rounded-xl p-6 text-center">
                      <p className="text-muted-foreground text-sm">No linked sources yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        You can link sources in Settings
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-success flex items-center justify-center mb-6 mx-auto shadow-glow-success"
                  >
                    <CheckCircle2 size={40} className="text-white" />
                  </motion.div>
                  <h1 className="text-2xl font-bold mb-2">You're All Set</h1>
                  <p className="text-muted-foreground max-w-sm">
                    Your Flow Card is ready. One tap when the world needs a card.
                  </p>
                </motion.div>

                <div className="max-w-sm w-full">
                  <FlowCardVisual status="created" mode="in_app" />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-auto pt-6 space-y-3">
          <Button
            onClick={handleNext}
            disabled={isCreating}
            className="w-full h-14 rounded-2xl aurora-gradient text-white font-semibold text-lg shadow-glow-blue"
          >
            {isCreating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : currentStep === steps.length - 1 ? (
              'Done'
            ) : (
              <>
                Continue
                <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </Button>
          
          {currentStep < steps.length - 1 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full h-12"
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
