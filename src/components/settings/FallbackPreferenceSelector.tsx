/**
 * Fallback Preference Selector
 * 
 * Allows users to choose their preferred fallback behavior
 * when wallet balance is insufficient for a payment.
 */

import { motion } from 'framer-motion';
import { CreditCard, Wallet, HelpCircle, Check, Loader2 } from 'lucide-react';
import { useFallbackPreference, FALLBACK_OPTIONS, type FallbackPreference } from '@/hooks/useFallbackPreference';
import { useToast } from '@/hooks/use-toast';

const OPTION_ICONS: Record<FallbackPreference, React.ReactNode> = {
  use_card: <CreditCard className="w-5 h-5" />,
  top_up_wallet: <Wallet className="w-5 h-5" />,
  ask_each_time: <HelpCircle className="w-5 h-5" />,
};

export default function FallbackPreferenceSelector() {
  const { preference, loading, saving, updatePreference } = useFallbackPreference();
  const { toast } = useToast();

  const handleSelect = async (value: FallbackPreference) => {
    if (value === preference || saving) return;

    const result = await updatePreference(value);
    
    if (result.success) {
      toast({
        title: 'Preference updated',
        description: `Fallback set to "${FALLBACK_OPTIONS.find(o => o.value === value)?.label}"`,
      });
    } else {
      toast({
        title: 'Update failed',
        description: result.error || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-float">
      <div className="p-4 border-b border-border/30">
        <h3 className="font-medium text-foreground">When wallet balance is low</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how FLOW handles payments when your wallet can't cover the amount
        </p>
      </div>
      
      <div className="divide-y divide-border/30">
        {FALLBACK_OPTIONS.map((option, index) => {
          const isSelected = preference === option.value;
          
          return (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(option.value)}
              disabled={saving}
              className={`w-full flex items-start gap-4 p-4 text-left transition-colors ${
                isSelected 
                  ? 'bg-primary/5' 
                  : 'hover:bg-muted/50'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {OPTION_ICONS[option.value]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </span>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                    >
                      Active
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>

              {/* Selection indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected 
                  ? 'border-primary bg-primary' 
                  : 'border-muted-foreground/30'
              }`}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <Check className="w-3.5 h-3.5 text-primary-foreground" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Saving indicator */}
      {saving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 py-2 bg-muted/50 flex items-center justify-center gap-2"
        >
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Saving...</span>
        </motion.div>
      )}
    </div>
  );
}
