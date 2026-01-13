/**
 * Contact Send History Component
 * 
 * Shows past transactions with a specific contact inline
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronUp, Check, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TransactionRecord {
  id: string;
  amount: number;
  createdAt: Date;
  status: string;
  railUsed: string | null;
  note: string | null;
}

interface ContactSendHistoryProps {
  contactId: string;
  contactName: string;
  contactPhone: string;
}

const ContactSendHistory = ({ contactId, contactName, contactPhone }: ContactSendHistoryProps) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalSent: number;
    transactionCount: number;
    averageAmount: number;
    lastSent: Date | null;
  } | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get transactions to this contact
      const { data } = await supabase
        .from('transaction_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('intent_type', 'SendMoney')
        .or(`recipient_id.eq.${contactId},recipient_name.eq.${contactName}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        const records: TransactionRecord[] = data.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          createdAt: new Date(tx.created_at),
          status: tx.status,
          railUsed: tx.rail_used,
          note: tx.note,
        }));

        setTransactions(records);

        // Calculate stats
        const successfulTx = records.filter(tx => tx.status === 'success');
        const totalSent = successfulTx.reduce((sum, tx) => sum + tx.amount, 0);
        
        setStats({
          totalSent,
          transactionCount: successfulTx.length,
          averageAmount: successfulTx.length > 0 ? totalSent / successfulTx.length : 0,
          lastSent: records.length > 0 ? records[0].createdAt : null,
        });
      } else {
        // Demo data for prototype
        const demoTx: TransactionRecord[] = [
          { id: '1', amount: 50, createdAt: new Date(Date.now() - 86400000 * 2), status: 'success', railUsed: 'TouchNGo', note: 'Lunch' },
          { id: '2', amount: 100, createdAt: new Date(Date.now() - 86400000 * 7), status: 'success', railUsed: 'DuitNow', note: null },
          { id: '3', amount: 50, createdAt: new Date(Date.now() - 86400000 * 14), status: 'success', railUsed: 'TouchNGo', note: 'Coffee' },
        ];
        setTransactions(demoTx);
        setStats({
          totalSent: 200,
          transactionCount: 3,
          averageAmount: 66.67,
          lastSent: demoTx[0].createdAt,
        });
      }

      setIsLoading(false);
    };

    if (contactId) {
      loadHistory();
    }
  }, [contactId, contactName]);

  if (isLoading || !stats || stats.transactionCount === 0) {
    return null;
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return format(date, 'MMM d');
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass-subtle rounded-2xl p-3 flex items-center justify-between transition-all hover:bg-white/60 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-aurora-purple/10 flex items-center justify-center">
            <History className="w-4 h-4 text-aurora-purple" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              Sent {stats.transactionCount}x • Total RM {stats.totalSent.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">
              Usually RM {stats.averageAmount.toFixed(0)} • Last {formatTimeAgo(stats.lastSent!)}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            {transactions.slice(0, 5).map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 glass-subtle rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.status === 'success' ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    {tx.status === 'success' ? (
                      <ArrowUpRight className="w-4 h-4 text-success" />
                    ) : (
                      <Check className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      RM {tx.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.railUsed || 'FLOW'} • {formatTimeAgo(tx.createdAt)}
                      {tx.note && ` • "${tx.note}"`}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContactSendHistory;
