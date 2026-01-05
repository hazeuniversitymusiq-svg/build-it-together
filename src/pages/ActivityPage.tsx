/**
 * FLOW Activity Page
 * 
 * Shows transaction audit trail from database.
 * User-visible logs for transparency and trust.
 */

import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import { useTransactionLogs, TransactionLog } from "@/hooks/useTransactionLogs";
import { useOrchestration } from "@/contexts/OrchestrationContext";
import { ArrowUpRight, ArrowDownLeft, Store, Wallet, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ActivityPage = () => {
  const { logs, isLoading, refreshLogs } = useTransactionLogs();
  const { walletBalance } = useOrchestration();

  // Helper to get display info from log
  const getLogDisplay = (log: TransactionLog) => {
    switch (log.intent_type) {
      case 'PAY_MERCHANT':
        return {
          name: log.merchant_name || 'Merchant',
          icon: Store,
          isOutgoing: true,
        };
      case 'SEND_MONEY':
        return {
          name: log.recipient_name || 'Someone',
          icon: ArrowUpRight,
          isOutgoing: true,
        };
      case 'RECEIVE_MONEY':
        return {
          name: log.recipient_name || 'Someone',
          icon: ArrowDownLeft,
          isOutgoing: false,
        };
      default:
        return {
          name: 'Transaction',
          icon: Wallet,
          isOutgoing: true,
        };
    }
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header with Wallet Balance */}
        <header className="px-6 pt-8 pb-2 safe-area-top flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Activity</h1>
          <button 
            onClick={refreshLogs}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Wallet Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 my-4 p-5 bg-card rounded-2xl flow-card-shadow"
        >
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">FLOW Wallet</span>
          </div>
          <p className="text-3xl font-semibold text-foreground">
            ${walletBalance.toFixed(2)}
          </p>
        </motion.div>

        {/* Transactions */}
        <div className="flex-1 px-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Transaction History</p>
            <p className="text-xs text-muted-foreground">{logs.length} transactions</p>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-4 flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-secondary" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-secondary rounded mb-2" />
                    <div className="h-3 w-16 bg-secondary rounded" />
                  </div>
                  <div className="h-4 w-16 bg-secondary rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map((log, index) => {
                const display = getLogDisplay(log);
                const Icon = display.icon;

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{display.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                          {log.rail_used && (
                            <span className="text-xs text-muted-foreground/70">
                              via {log.rail_used}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className={`font-medium tabular-nums ${display.isOutgoing ? 'text-foreground' : 'text-success'}`}>
                      {display.isOutgoing ? '-' : '+'}${log.amount.toFixed(2)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!isLoading && logs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Wallet className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Your payment history will appear here
              </p>
            </motion.div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </MobileShell>
  );
};

export default ActivityPage;
