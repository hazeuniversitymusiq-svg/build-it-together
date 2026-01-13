/**
 * Funding Source Picker for Scan Flow
 * 
 * Allows users to choose which wallet/bank/card to pay FROM.
 * iOS 26 Liquid Glass design.
 */

import { motion } from 'framer-motion';
import { Wallet, Building2, CreditCard, Check } from 'lucide-react';
import type { RealFundingSource } from '@/hooks/useFundingSources';

interface FundingSourcePickerProps {
  sources: RealFundingSource[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  merchantRails?: string[];
}

const sourceIcons: Record<string, React.ReactNode> = {
  wallet: <Wallet className="w-5 h-5" />,
  bank: <Building2 className="w-5 h-5" />,
  card: <CreditCard className="w-5 h-5" />,
};

const walletColors: Record<string, string> = {
  'Touch\'n Go': 'from-blue-500 to-blue-600',
  'TouchNGo': 'from-blue-500 to-blue-600',
  'GrabPay': 'from-green-500 to-green-600',
  'Boost': 'from-red-500 to-red-600',
  'DuitNow': 'from-purple-500 to-purple-600',
};

const FundingSourcePicker = ({ 
  sources, 
  selectedId, 
  onSelect,
  merchantRails = []
}: FundingSourcePickerProps) => {
  // Sort: linked first, then by priority
  const sortedSources = [...sources]
    .filter(s => s.isLinked && s.isAvailable)
    .sort((a, b) => a.priority - b.priority);

  if (sortedSources.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-4 text-center">
        <p className="text-muted-foreground text-sm">No payment methods linked</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-muted-foreground mb-2">Pay from</label>
      <div className="grid grid-cols-2 gap-2">
        {sortedSources.map((source, index) => {
          const isSelected = selectedId === source.id;
          const colorClass = walletColors[source.name] || 'from-gray-500 to-gray-600';
          const isMerchantSupported = merchantRails.length === 0 || 
            merchantRails.some(r => source.name.toLowerCase().includes(r.toLowerCase()));

          return (
            <motion.button
              key={source.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(source.id)}
              disabled={!isMerchantSupported}
              className={`relative flex flex-col items-start p-3 rounded-xl transition-all ${
                isSelected
                  ? 'aurora-gradient-soft aurora-border shadow-glow-blue'
                  : 'glass-card hover:bg-white/60 dark:hover:bg-white/10'
              } ${!isMerchantSupported ? 'opacity-40' : ''}`}
            >
              {/* Icon with gradient background */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white mb-2 shadow-float`}>
                {sourceIcons[source.type] || <Wallet className="w-5 h-5" />}
              </div>

              {/* Name & Balance */}
              <p className="font-medium text-foreground text-sm text-left">
                {source.name.replace('|', ' ')}
              </p>
              <p className="text-xs text-muted-foreground">
                RM {source.balance.toFixed(2)}
              </p>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full aurora-gradient flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}

              {/* Not supported badge */}
              {!isMerchantSupported && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
                  <span className="text-xs text-muted-foreground">Not accepted</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default FundingSourcePicker;
