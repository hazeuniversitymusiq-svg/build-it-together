/**
 * Merchant History Component
 * 
 * Shows past transactions with a scanned merchant.
 * Provides intelligence about spending patterns.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, TrendingUp, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface MerchantHistoryProps {
  merchantName: string;
  merchantId: string;
  userId: string;
}

interface PastTransaction {
  id: string;
  amount: number;
  created_at: string;
  status: string;
}

const MerchantHistory = ({ merchantName, merchantId, userId }: MerchantHistoryProps) => {
  const [history, setHistory] = useState<PastTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      
      // Query transaction_logs for this merchant
      const { data } = await supabase
        .from('transaction_logs')
        .select('id, amount, created_at, status')
        .eq('user_id', userId)
        .or(`merchant_name.ilike.%${merchantName}%,merchant_id.eq.${merchantId}`)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(5);

      setHistory(data || []);
      setLoading(false);
    };

    if (merchantName || merchantId) {
      fetchHistory();
    }
  }, [merchantName, merchantId, userId]);

  if (loading) {
    return null;
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full aurora-gradient-soft flex items-center justify-center">
          <Star className="w-5 h-5 text-aurora-blue" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">First time here!</p>
          <p className="text-xs text-muted-foreground">New merchant discovered</p>
        </div>
      </motion.div>
    );
  }

  const totalSpent = history.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = totalSpent / history.length;
  const lastVisit = history[0]?.created_at;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          You've paid here {history.length} time{history.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg aurora-gradient-soft flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-aurora-blue" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg spend</p>
            <p className="text-sm font-medium text-foreground">
              RM {avgAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg aurora-gradient-soft flex items-center justify-center">
            <Clock className="w-4 h-4 text-aurora-purple" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last visit</p>
            <p className="text-sm font-medium text-foreground">
              {lastVisit ? formatDistanceToNow(new Date(lastVisit), { addSuffix: true }) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion based on history */}
      {avgAmount > 0 && (
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            💡 Your usual spend: <span className="text-foreground font-medium">RM {avgAmount.toFixed(2)}</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MerchantHistory;
