/**
 * Wallet Balance Card
 * 
 * Displays linked wallets with balances prominently on the home page.
 * Shows total balance and individual wallet breakdowns.
 */

import { motion } from 'framer-motion';
import { Wallet, Plus, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { cn } from '@/lib/utils';

interface WalletBalanceCardProps {
  className?: string;
  onLinkWallet?: () => void;
  onSyncBalance?: () => void;
}

export function WalletBalanceCard({ className, onLinkWallet, onSyncBalance }: WalletBalanceCardProps) {
  const { sources, walletBalance, totalBalance, loading, refetch } = useFundingSources();

  const linkedWallets = sources.filter(s => s.isLinked && s.type === 'wallet');
  const linkedBanks = sources.filter(s => s.isLinked && s.type === 'bank');
  const hasLowBalance = linkedWallets.some(w => w.balance < 20);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("glass-card p-5 animate-pulse", className)}
      >
        <div className="h-6 w-32 bg-muted/50 rounded mb-4" />
        <div className="h-10 w-24 bg-muted/50 rounded" />
      </motion.div>
    );
  }

  // No wallets linked state
  if (linkedWallets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={cn("glass-card overflow-hidden", className)}
      >
        <button
          onClick={onLinkWallet}
          className="w-full p-5 flex items-center gap-4 hover:bg-white/5 transition-colors"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-foreground">Link Your Wallets</p>
            <p className="text-sm text-muted-foreground">
              Connect Touch 'n Go, GrabPay & more
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn("glass-card overflow-hidden", className)}
    >
      {/* Main Balance Section */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Available</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              RM {totalBalance.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Refresh balances"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Low Balance Warning */}
        {hasLowBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg mb-4"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Wallet balance is low — FLOW will auto top-up when needed</span>
          </motion.div>
        )}

        {/* Wallet Breakdown */}
        <div className="space-y-2">
          {linkedWallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-aurora-teal/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-aurora-teal" />
                </div>
                <span className="text-sm font-medium text-foreground">{wallet.name}</span>
              </div>
              <span className={cn(
                "text-sm font-semibold",
                wallet.balance < 20 ? "text-amber-500" : "text-foreground"
              )}>
                RM {wallet.balance.toFixed(2)}
              </span>
            </motion.div>
          ))}

          {/* Bank Sources */}
          {linkedBanks.slice(0, 2).map((bank, index) => (
            <motion.div
              key={bank.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="flex items-center justify-between py-2 opacity-70"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-aurora-blue/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-aurora-blue" />
                </div>
                <span className="text-sm text-muted-foreground">{bank.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                RM {bank.balance.toFixed(2)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Sync Balance CTA */}
      <button
        onClick={onSyncBalance}
        className="w-full px-5 py-3 border-t border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg aurora-gradient flex items-center justify-center">
            <RefreshCw className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-medium text-foreground">Sync via Screenshot</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-purple/20 text-aurora-purple font-medium">
            AI
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}
