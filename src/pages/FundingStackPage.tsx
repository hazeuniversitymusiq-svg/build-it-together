import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  GripVertical, 
  ChevronRight,
  Check
} from 'lucide-react';

interface FundingSource {
  id: string;
  type: 'wallet' | 'bank' | 'card';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const defaultFundingSources: FundingSource[] = [
  {
    id: 'wallet',
    type: 'wallet',
    label: 'Digital Wallet',
    description: 'Apple Pay, Google Pay, PayPal',
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    id: 'bank',
    type: 'bank',
    label: 'Bank Account',
    description: 'Direct from your bank',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'card',
    type: 'card',
    label: 'Debit or Credit Card',
    description: 'Visa, Mastercard, Amex',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

const FundingStackPage = () => {
  const navigate = useNavigate();
  const [sources, setSources] = useState<FundingSource[]>(defaultFundingSources);
  const [hasReordered, setHasReordered] = useState(false);

  const handleReorder = (newOrder: FundingSource[]) => {
    setSources(newOrder);
    setHasReordered(true);
  };

  const handleContinue = () => {
    // Store the funding stack order
    const fundingOrder = sources.map(s => s.id);
    localStorage.setItem('flow_funding_stack', JSON.stringify(fundingOrder));
    
    // Navigate to link funding sources
    navigate('/link-funding');
  };

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
          How do you prefer to pay?
        </h1>
        <p className="text-muted-foreground">
          Drag to set your preferred order. FLOW will try your first choice first.
        </p>
      </motion.div>

      {/* Reorderable Funding Sources */}
      <div className="flex-1 py-4">
        <Reorder.Group
          axis="y"
          values={sources}
          onReorder={handleReorder}
          className="space-y-3"
        >
          {sources.map((source, index) => (
            <Reorder.Item
              key={source.id}
              value={source}
              className="touch-none"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}
                className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border cursor-grab active:cursor-grabbing"
              >
                {/* Drag Handle */}
                <div className="text-muted-foreground">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Position Indicator */}
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                  {source.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{source.label}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {source.description}
                  </p>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Reorder Hint */}
        <AnimatePresence>
          {!hasReordered && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center text-sm text-muted-foreground mt-6"
            >
              💡 Drag items to reorder your preferences
            </motion.p>
          )}
        </AnimatePresence>

        {/* Success Indicator */}
        <AnimatePresence>
          {hasReordered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-center gap-2 mt-6 text-success"
            >
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Order saved</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Why This Matters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="py-4"
      >
        <div className="p-4 rounded-2xl bg-muted/50">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            When you pay, FLOW will try your preferred source first.
            <br />
            If it's unavailable, we'll ask before trying the next.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="py-8 space-y-3"
      >
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-base font-medium rounded-2xl"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
        
        <button
          onClick={() => navigate('/biometric-setup')}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Go back
        </button>
      </motion.div>
    </div>
  );
};

export default FundingStackPage;
