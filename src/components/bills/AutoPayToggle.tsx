/**
 * Auto Pay Toggle Component
 * 
 * Allows users to set up automatic bill payments
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Calendar, AlertCircle, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface AutoPayToggleProps {
  billerName: string;
  accountRef: string;
  isEnabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

const AutoPayToggle = ({ billerName, accountRef, isEnabled = false, onToggle }: AutoPayToggleProps) => {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(isEnabled);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleToggle = (newValue: boolean) => {
    if (newValue && !enabled) {
      // Show confirmation for enabling
      setShowConfirm(true);
    } else {
      // Disable directly
      setEnabled(false);
      onToggle?.(false);
      toast({
        title: 'Auto-pay disabled',
        description: `${billerName} will no longer be paid automatically`,
      });
    }
  };

  const confirmEnable = () => {
    setEnabled(true);
    setShowConfirm(false);
    onToggle?.(true);
    toast({
      title: 'Auto-pay enabled',
      description: `${billerName} bills will be paid 3 days before due`,
    });
  };

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            enabled ? 'bg-aurora-purple/20' : 'bg-white/20 dark:bg-white/10'
          }`}>
            <Zap className={`w-4 h-4 ${enabled ? 'text-aurora-purple' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Auto-pay</p>
            <p className="text-xs text-muted-foreground">
              {enabled ? 'Pays 3 days before due' : 'Pay automatically'}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-aurora-purple"
        />
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-4 glass-card rounded-2xl border border-aurora-purple/20"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full aurora-gradient-soft flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-aurora-purple" />
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Enable Auto-Pay?</p>
                <p className="text-sm text-muted-foreground">
                  FLOW will automatically pay your {billerName} bill 3 days before the due date using your preferred funding source.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-xl">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Account: {accountRef}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl glass-card text-sm font-medium text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnable}
                className="flex-1 py-2.5 rounded-xl aurora-gradient text-white text-sm font-medium flex items-center justify-center gap-2 shadow-glow-aurora"
              >
                <Check className="w-4 h-4" />
                Enable
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AutoPayToggle;
