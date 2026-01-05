import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  ChevronRight,
  Check,
  Plus,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface FundingSourceConfig {
  id: string;
  type: 'wallet' | 'bank' | 'card';
  label: string;
  description: string;
  icon: React.ReactNode;
  linked: boolean;
}

const sourceConfigs: Record<string, Omit<FundingSourceConfig, 'linked'>> = {
  wallet: {
    id: 'wallet',
    type: 'wallet',
    label: 'Digital Wallet',
    description: 'Connect Apple Pay, Google Pay, or PayPal',
    icon: <Wallet className="w-6 h-6" />,
  },
  bank: {
    id: 'bank',
    type: 'bank',
    label: 'Bank Account',
    description: 'Link your bank for direct payments',
    icon: <Building2 className="w-6 h-6" />,
  },
  card: {
    id: 'card',
    type: 'card',
    label: 'Debit or Credit Card',
    description: 'Add Visa, Mastercard, or Amex',
    icon: <CreditCard className="w-6 h-6" />,
  },
};

const LinkFundingPage = () => {
  const navigate = useNavigate();
  const [fundingOrder, setFundingOrder] = useState<string[]>(['wallet', 'bank', 'card']);
  const [linkedSources, setLinkedSources] = useState<Set<string>>(new Set());
  const [currentLinking, setCurrentLinking] = useState<string | null>(null);

  useEffect(() => {
    // Load the user's preferred funding order
    const savedOrder = localStorage.getItem('flow_funding_stack');
    if (savedOrder) {
      try {
        setFundingOrder(JSON.parse(savedOrder));
      } catch {
        // Use default order
      }
    }
  }, []);

  const handleLinkSource = async (sourceId: string) => {
    setCurrentLinking(sourceId);
    
    // Simulate linking process
    // In production, this would open the appropriate linking flow
    // (Plaid for banks, Stripe for cards, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLinkedSources(prev => new Set([...prev, sourceId]));
    setCurrentLinking(null);
    
    const sourceLabel = sourceConfigs[sourceId]?.label || 'Source';
    toast.success(`${sourceLabel} linked successfully`);
  };

  const handleContinue = () => {
    // Store linked sources
    localStorage.setItem('flow_linked_sources', JSON.stringify([...linkedSources]));
    
    // Navigate to main app
    navigate('/scan');
  };

  const handleSkip = () => {
    toast.info('You can link payment methods later in Settings');
    navigate('/scan');
  };

  const hasLinkedAtLeastOne = linkedSources.size > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
          Link your payment methods
        </h1>
        <p className="text-muted-foreground">
          Connect at least one to start paying with FLOW.
        </p>
      </motion.div>

      {/* Funding Sources to Link */}
      <div className="flex-1 py-4 space-y-3">
        {fundingOrder.map((sourceId, index) => {
          const config = sourceConfigs[sourceId];
          if (!config) return null;

          const isLinked = linkedSources.has(sourceId);
          const isLinking = currentLinking === sourceId;

          return (
            <motion.div
              key={sourceId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <button
                onClick={() => !isLinked && !isLinking && handleLinkSource(sourceId)}
                disabled={isLinked || isLinking}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isLinked 
                    ? 'bg-success/5 border-success/20' 
                    : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5'
                } ${isLinking ? 'opacity-70' : ''}`}
              >
                {/* Priority Badge */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isLinked 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {isLinked ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </div>

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  isLinked 
                    ? 'bg-success/10 text-success' 
                    : 'bg-primary/5 text-primary'
                }`}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-medium text-foreground">{config.label}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {isLinked ? 'Connected' : config.description}
                  </p>
                </div>

                {/* Action */}
                <div className="text-muted-foreground">
                  {isLinking ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                    />
                  ) : isLinked ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}

        {/* Trust Statement */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 p-4 rounded-2xl bg-muted/50"
        >
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            FLOW connects to your payment methods securely.
            <br />
            We never store your credentials or balances.
          </p>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="py-8 space-y-3"
      >
        <AnimatePresence mode="wait">
          {hasLinkedAtLeastOne ? (
            <motion.div
              key="continue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                onClick={handleContinue}
                className="w-full h-14 text-base font-medium rounded-2xl bg-success hover:bg-success/90"
              >
                Start using FLOW
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="skip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button
                onClick={handleContinue}
                disabled={true}
                className="w-full h-14 text-base font-medium rounded-2xl"
              >
                Link at least one method to continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={handleSkip}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default LinkFundingPage;
