/**
 * Create Flow Card Flow
 * 
 * Step-by-step card creation with eligibility checking and tiered activation.
 * - Lite tier: Wallet only (manual top-up)
 * - Full tier: Wallet + Bank (auto top-up enabled)
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
  Wallet,
  Landmark,
  AlertCircle,
  Sparkles,
  ArrowUpCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard } from '@/hooks/useFlowCard';
import { useFlowCardEligibility, FlowCardTier } from '@/hooks/useFlowCardEligibility';
import { useOrchestration } from '@/contexts/OrchestrationContext';
import { FlowCardVisual } from './FlowCardVisual';
import DebitCardLinkingFlow from './DebitCardLinkingFlow';
import { useNavigate } from 'react-router-dom';

interface CreateFlowCardFlowProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function CreateFlowCardFlow({ onComplete, onCancel }: CreateFlowCardFlowProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [showDebitCardFlow, setShowDebitCardFlow] = useState(false);
  const { createFlowCard, deviceId } = useFlowCard();
  const { sources, refetchSources } = useOrchestration();
  const eligibility = useFlowCardEligibility();

  const linkedSources = sources.filter(s => s.isLinked);
  const debitCards = linkedSources.filter(s => s.type === 'debit_card' || s.type === 'duitnow');
  const wallets = linkedSources.filter(s => s.type === 'wallet');
  const banks = linkedSources.filter(s => s.type === 'bank');

  // Dynamic steps based on eligibility
  const steps = [
    { id: 'eligibility', title: 'Eligibility Check', icon: Shield },
    { id: 'intro', title: 'What is Flow Card?', icon: CreditCard },
    { id: 'security', title: 'Device & Security', icon: Shield },
    { id: 'sources', title: 'Funding Sources', icon: Wallet },
    { id: 'complete', title: 'All Set', icon: CheckCircle2 },
  ];

  const handleNext = async () => {
    // Skip eligibility step if already eligible
    if (currentStep === 0 && !eligibility.canActivate) {
      return; // Can't proceed without meeting minimum criteria
    }
    
    if (currentStep === steps.length - 2) {
      // Create the card with appropriate tier
      setIsCreating(true);
      const success = await createFlowCard(eligibility.tier);
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

  const handleLinkBank = () => {
    navigate('/apps');
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
            {/* Step 0: Eligibility Check */}
            {currentStep === 0 && (
              <EligibilityStep 
                eligibility={eligibility}
                onLinkBank={handleLinkBank}
              />
            )}

            {/* Step 1: Introduction */}
            {currentStep === 1 && (
              <IntroStep tier={eligibility.tier} />
            )}

            {/* Step 2: Security */}
            {currentStep === 2 && (
              <SecurityStep deviceId={deviceId} />
            )}

            {/* Step 3: Funding Sources */}
            {currentStep === 3 && !showDebitCardFlow && (
              <FundingSourcesStep 
                debitCards={debitCards}
                wallets={wallets}
                banks={banks}
                tier={eligibility.tier}
                onLinkBank={handleLinkBank}
                onLinkDebitCard={() => setShowDebitCardFlow(true)}
              />
            )}

            {/* Debit Card Linking Sub-flow */}
            {currentStep === 3 && showDebitCardFlow && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1"
              >
                <DebitCardLinkingFlow
                  onComplete={() => {
                    setShowDebitCardFlow(false);
                    refetchSources?.();
                  }}
                  onSkip={() => setShowDebitCardFlow(false)}
                  showSkip
                />
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <CompleteStep tier={eligibility.tier} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Actions - Hide when in debit card sub-flow */}
        {!showDebitCardFlow && (
          <div className="mt-auto pt-6 space-y-3">
            <Button
              onClick={handleNext}
              disabled={isCreating || (currentStep === 0 && !eligibility.canActivate)}
              className="w-full h-14 rounded-2xl aurora-gradient text-white font-semibold text-lg shadow-glow-blue disabled:opacity-50"
            >
              {isCreating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : currentStep === steps.length - 1 ? (
                'Done'
              ) : currentStep === 0 && !eligibility.canActivate ? (
                'Requirements Not Met'
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
        )}
      </div>
    </div>
  );
}

// Eligibility Step Component
function EligibilityStep({ 
  eligibility, 
  onLinkBank 
}: { 
  eligibility: ReturnType<typeof useFlowCardEligibility>;
  onLinkBank: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${
          eligibility.canActivate ? 'bg-success/10' : 'bg-warning/10'
        }`}>
          {eligibility.canActivate ? (
            <CheckCircle2 size={36} className="text-success" />
          ) : (
            <AlertCircle size={36} className="text-warning" />
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">
          {eligibility.canActivate ? 'Ready to Activate' : 'Almost There'}
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          {eligibility.canActivate 
            ? `You qualify for Flow Card ${eligibility.tier === 'full' ? 'Full' : 'Lite'}`
            : 'Complete these requirements to activate Flow Card'
          }
        </p>
      </motion.div>

      {/* Tier Badge */}
      {eligibility.canActivate && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <TierBadge tier={eligibility.tier} />
        </motion.div>
      )}

      {/* Criteria List */}
      <div className="space-y-3 max-w-sm w-full">
        {eligibility.criteria.map((criterion, idx) => (
          <motion.div
            key={criterion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * idx }}
            className={`glass-card rounded-xl p-4 flex items-center gap-3 ${
              !criterion.met && criterion.required ? 'border border-warning/30' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              criterion.met ? 'bg-success/10' : criterion.required ? 'bg-warning/10' : 'bg-muted'
            }`}>
              {criterion.met ? (
                <CheckCircle2 size={16} className="text-success" />
              ) : criterion.required ? (
                <AlertCircle size={16} className="text-warning" />
              ) : (
                <ArrowUpCircle size={16} className="text-muted-foreground" />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-sm">{criterion.label}</p>
              <p className="text-xs text-muted-foreground">{criterion.description}</p>
            </div>
            {!criterion.required && !criterion.met && (
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
                For Full
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Upgrade Prompt */}
      {eligibility.canActivate && eligibility.tier === 'lite' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 max-w-sm w-full"
        >
          <button
            onClick={onLinkBank}
            className="w-full glass-card rounded-xl p-4 flex items-center gap-3 border border-aurora-purple/30 hover:bg-aurora-purple/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-aurora-purple/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-aurora-purple" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-sm">Upgrade to Full</p>
              <p className="text-xs text-muted-foreground">Link a bank for auto top-up</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Tier Badge Component
function TierBadge({ tier }: { tier: FlowCardTier }) {
  if (tier === 'full') {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full aurora-gradient text-white text-sm font-medium shadow-glow-blue">
        <Sparkles size={16} />
        Flow Card Full
      </div>
    );
  }
  
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium">
      <CreditCard size={16} />
      Flow Card Lite
    </div>
  );
}

// Introduction Step Component
function IntroStep({ tier }: { tier: FlowCardTier }) {
  return (
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
        <h1 className="text-2xl font-bold mb-2">Flow Card</h1>
        <TierBadge tier={tier} />
        <p className="text-muted-foreground max-w-sm leading-relaxed mt-4">
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

        {tier === 'full' && (
          <div className="glass-card rounded-xl p-4 flex items-start gap-3 border border-aurora-teal/30">
            <div className="w-8 h-8 rounded-full bg-aurora-teal/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-aurora-teal" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Auto Top-Up Enabled</p>
              <p className="text-xs text-muted-foreground">Bank backs up your wallet automatically</p>
            </div>
          </div>
        )}

        {tier === 'lite' && (
          <div className="glass-card rounded-xl p-4 flex items-start gap-3 border border-warning/30">
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-warning" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">Manual Top-Up Only</p>
              <p className="text-xs text-muted-foreground">Link a bank to enable auto top-up</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Security Step Component
function SecurityStep({ deviceId }: { deviceId: string }) {
  return (
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
  );
}

// Funding Sources Step Component - Shows Flow Card Priority Chain
function FundingSourcesStep({ 
  debitCards,
  wallets, 
  banks, 
  tier,
  onLinkBank,
  onLinkDebitCard
}: { 
  debitCards: { id: string; name: string; type: string; balance: number }[];
  wallets: { id: string; name: string; type: string; balance: number }[];
  banks: { id: string; name: string; type: string; balance: number }[];
  tier: FlowCardTier;
  onLinkBank: () => void;
  onLinkDebitCard: () => void;
}) {
  return (
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
        <h1 className="text-2xl font-bold mb-2">Payment Priority</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          Flow Card uses this order when you pay
        </p>
      </motion.div>

      <div className="space-y-4 max-w-sm w-full">
        {/* PRIORITY 1: Debit Card / DuitNow */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full aurora-gradient text-white text-xs flex items-center justify-center font-bold">1</span>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Primary • Debit Card / DuitNow
            </p>
          </div>
          {debitCards.length > 0 ? (
            debitCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="glass-card rounded-xl p-4 flex items-center gap-3 mb-2 border border-aurora-blue/30"
              >
                <div className="w-8 h-8 rounded-full bg-aurora-blue/10 flex items-center justify-center">
                  <CreditCard size={16} className="text-aurora-blue" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{card.name}</p>
                  <p className="text-xs text-aurora-blue">Instant bank debit</p>
                </div>
                <Sparkles size={16} className="text-aurora-blue" />
              </motion.div>
            ))
          ) : (
            <button
              onClick={onLinkDebitCard}
              className="w-full glass-card rounded-xl p-4 flex items-center gap-3 border border-dashed border-aurora-blue/30 hover:border-aurora-blue/50 hover:bg-aurora-blue/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-aurora-blue/10 flex items-center justify-center">
                <Plus size={20} className="text-aurora-blue" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm">Link Debit Card</p>
                <p className="text-xs text-muted-foreground">Set as primary payment source</p>
              </div>
              <ArrowRight size={16} className="text-aurora-blue" />
            </button>
          )}
        </div>

        {/* PRIORITY 2: E-Wallets */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-aurora-purple text-white text-xs flex items-center justify-center font-bold">2</span>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Secondary • E-Wallets
            </p>
          </div>
          {wallets.length > 0 ? (
            wallets.map((wallet, idx) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + 0.1 * idx }}
                className="glass-card rounded-xl p-4 flex items-center gap-3 mb-2"
              >
                <div className="w-8 h-8 rounded-full bg-aurora-purple/10 flex items-center justify-center">
                  <Wallet size={16} className="text-aurora-purple" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">Uses wallet balance</p>
                </div>
                <span className="text-sm font-medium">
                  RM {wallet.balance.toFixed(2)}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="glass-card rounded-xl p-3 text-center border border-warning/30">
              <p className="text-muted-foreground text-xs">No wallet linked</p>
            </div>
          )}
        </div>

        {/* PRIORITY 3: Bank (Backup) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-aurora-teal text-white text-xs flex items-center justify-center font-bold">3</span>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Backup • Bank {tier === 'full' ? '(Auto Top-Up)' : ''}
            </p>
          </div>
          {banks.length > 0 ? (
            banks.map((bank, idx) => (
              <motion.div
                key={bank.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + 0.1 * idx }}
                className="glass-card rounded-xl p-4 flex items-center gap-3 mb-2 border border-aurora-teal/30"
              >
                <div className="w-8 h-8 rounded-full bg-aurora-teal/10 flex items-center justify-center">
                  <Landmark size={16} className="text-aurora-teal" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-sm">{bank.name}</p>
                  <p className="text-xs text-aurora-teal">
                    {tier === 'full' ? 'Auto top-up enabled' : 'Available for top-up'}
                  </p>
                </div>
                {tier === 'full' && <Sparkles size={16} className="text-aurora-teal" />}
              </motion.div>
            ))
          ) : (
            <button
              onClick={onLinkBank}
              className="w-full glass-card rounded-xl p-3 flex items-center gap-3 border border-dashed border-muted-foreground/30 hover:border-aurora-purple/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Landmark size={16} className="text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-medium text-sm text-muted-foreground">Link a Bank</p>
                <p className="text-xs text-muted-foreground">Enable auto top-up</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Priority explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs text-muted-foreground mt-6 max-w-xs"
      >
        Flow automatically selects the best option at each payment
      </motion.p>
    </div>
  );
}

// Complete Step Component
function CompleteStep({ tier }: { tier: FlowCardTier }) {
  return (
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
        <TierBadge tier={tier} />
        <p className="text-muted-foreground max-w-sm mt-4">
          {tier === 'full'
            ? 'Your Flow Card Full is ready with auto top-up enabled.'
            : 'Your Flow Card Lite is ready. Link a bank anytime to upgrade.'
          }
        </p>
      </motion.div>

      <div className="max-w-sm w-full">
        <FlowCardVisual status="created" mode="in_app" />
      </div>

      {tier === 'lite' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-muted-foreground mt-4 max-w-xs"
        >
          💡 Tip: Link a bank in Settings to unlock auto top-up
        </motion.p>
      )}
    </div>
  );
}
