/**
 * FLOW Activity Page
 * 
 * Shows transaction history from Intent Engine.
 * Clean, minimal list.
 */

import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import { useIntent } from "@/contexts/IntentContext";
import { useOrchestration } from "@/contexts/OrchestrationContext";
import { ArrowUpRight, ArrowDownLeft, Store, Wallet } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ActivityPage = () => {
  const { intentHistory } = useIntent();
  const { walletBalance } = useOrchestration();

  // Helper to get display info from intent
  const getIntentDisplay = (intent: typeof intentHistory[0]) => {
    switch (intent.type) {
      case 'PAY_MERCHANT':
        return {
          name: intent.merchant.name,
          icon: Store,
          isOutgoing: true,
          amount: intent.amount.value,
          currency: intent.amount.currency,
        };
      case 'SEND_MONEY':
        return {
          name: intent.recipient.name,
          icon: ArrowUpRight,
          isOutgoing: true,
          amount: intent.amount.value,
          currency: intent.amount.currency,
        };
      case 'RECEIVE_MONEY':
        return {
          name: intent.from?.name || 'Someone',
          icon: ArrowDownLeft,
          isOutgoing: false,
          amount: intent.amount?.value || 0,
          currency: intent.amount?.currency || '$',
        };
    }
  };

  // Mock transactions for demo (since no real backend yet)
  const mockTransactions = [
    {
      id: '1',
      type: 'PAY_MERCHANT' as const,
      merchant: { id: '1', name: 'Starbucks KLCC' },
      amount: { value: 18.90, currency: '$' },
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      status: 'completed' as const,
    },
    {
      id: '2',
      type: 'SEND_MONEY' as const,
      recipient: { name: 'Sarah L.' },
      amount: { value: 50.00, currency: '$' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      status: 'completed' as const,
    },
    {
      id: '3',
      type: 'PAY_MERCHANT' as const,
      merchant: { id: '2', name: 'Grab Ride' },
      amount: { value: 12.50, currency: '$' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: 'completed' as const,
    },
  ];

  // Combine real history with mock for demo
  const transactions = intentHistory.length > 0 ? intentHistory : mockTransactions;

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Header with Wallet Balance */}
        <header className="px-6 pt-8 pb-2 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Activity</h1>
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
          <p className="text-sm text-muted-foreground mb-4">Recent</p>
          
          <div className="divide-y divide-border/50">
            {transactions.map((intent, index) => {
              const display = intent.type === 'PAY_MERCHANT' 
                ? { name: intent.merchant.name, icon: Store, isOutgoing: true, amount: intent.amount.value, currency: intent.amount.currency }
                : intent.type === 'SEND_MONEY'
                ? { name: intent.recipient.name, icon: ArrowUpRight, isOutgoing: true, amount: intent.amount.value, currency: intent.amount.currency }
                : { name: 'Someone', icon: ArrowDownLeft, isOutgoing: false, amount: 0, currency: '$' };
              
              const Icon = display.icon;

              return (
                <motion.div
                  key={intent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{display.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(intent.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <p className={`font-medium tabular-nums ${display.isOutgoing ? 'text-foreground' : 'text-success'}`}>
                    {display.isOutgoing ? '-' : '+'}{display.currency}{display.amount.toFixed(2)}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {transactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-20"
            >
              <p className="text-muted-foreground">No activity yet</p>
            </motion.div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </MobileShell>
  );
};

export default ActivityPage;
