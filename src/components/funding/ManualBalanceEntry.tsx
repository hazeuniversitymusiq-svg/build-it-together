/**
 * Manual Balance Entry Component
 * 
 * Allows users to manually enter their wallet/bank balances.
 * This is the real-world Option C approach.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  Check, 
  Loader2,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RealFundingSource } from '@/hooks/useFundingSources';

interface ManualBalanceEntryProps {
  sources: RealFundingSource[];
  onUpdateBalance: (sourceId: string, balance: number) => Promise<{ success: boolean; error: string | null }>;
  onUpdateLinked: (sourceId: string, linked: boolean) => Promise<{ success: boolean; error: string | null }>;
}

const typeIcons: Record<string, React.ReactNode> = {
  wallet: <Wallet className="w-5 h-5" />,
  bank: <Building2 className="w-5 h-5" />,
  debit_card: <CreditCard className="w-5 h-5" />,
  credit_card: <CreditCard className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  wallet: 'E-Wallet',
  bank: 'Bank Account',
  debit_card: 'Debit Card',
  credit_card: 'Credit Card',
};

export function ManualBalanceEntry({ 
  sources, 
  onUpdateBalance, 
  onUpdateLinked 
}: ManualBalanceEntryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (source: RealFundingSource) => {
    setEditingId(source.id);
    setEditValue(source.balance.toString());
    setError(null);
  };

  const handleSave = async (sourceId: string) => {
    const balance = parseFloat(editValue);
    if (isNaN(balance) || balance < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSaving(sourceId);
    setError(null);

    const result = await onUpdateBalance(sourceId, balance);
    
    if (result.success) {
      setEditingId(null);
      setEditValue('');
    } else {
      setError(result.error || 'Failed to save');
    }
    
    setSaving(null);
  };

  const handleToggleLink = async (source: RealFundingSource) => {
    setSaving(source.id);
    await onUpdateLinked(source.id, !source.isLinked);
    setSaving(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Your Balances</h3>
        <p className="text-xs text-muted-foreground">Tap to edit</p>
      </div>

      {sources.map((source, index) => (
        <motion.div
          key={source.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "p-4 rounded-2xl border transition-all",
            source.isLinked 
              ? "bg-card border-border" 
              : "bg-muted/30 border-dashed border-muted-foreground/30"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              source.isLinked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {typeIcons[source.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground truncate">
                  {source.name}
                </span>
                {!source.isLinked && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    Not linked
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {typeLabels[source.type]}
              </p>
            </div>

            {/* Balance / Edit */}
            <AnimatePresence mode="wait">
              {editingId === source.id ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-2"
                >
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      RM
                    </span>
                    <Input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-28 h-9 pl-10 text-right"
                      autoFocus
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSave(source.id)}
                    disabled={saving === source.id}
                    className="h-9 w-9 p-0"
                  >
                    {saving === source.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    className="h-9 px-2 text-xs"
                  >
                    Cancel
                  </Button>
                </motion.div>
              ) : source.isLinked ? (
                <motion.button
                  key="balance"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => handleEdit(source)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-foreground">
                    RM {source.balance.toFixed(2)}
                  </span>
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                </motion.button>
              ) : (
                <motion.div
                  key="link"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleLink(source)}
                    disabled={saving === source.id}
                    className="h-9"
                  >
                    {saving === source.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Link'
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && editingId === source.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mt-3 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center pt-2">
        Enter your current balances manually. FLOW will use these for payment resolution.
      </p>
    </div>
  );
}
