/**
 * Bill Payment History Component
 * 
 * Shows past bill payments for a specific biller
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronDown, ChevronUp, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PaymentRecord {
  id: string;
  amount: number;
  paidAt: Date;
  status: string;
}

interface BillPaymentHistoryProps {
  billerName: string;
  currentAmount?: number;
}

const BillPaymentHistory = ({ billerName, currentAmount }: BillPaymentHistoryProps) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalPaid: number;
    paymentCount: number;
    averageAmount: number;
    lastPaid: Date | null;
    trend: 'up' | 'down' | 'stable';
    trendPercent: number;
  } | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get bill payments for this biller
      const { data } = await supabase
        .from('transaction_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('intent_type', 'PayBill')
        .ilike('merchant_name', `%${billerName}%`)
        .order('created_at', { ascending: false })
        .limit(12);

      if (data && data.length > 0) {
        const records: PaymentRecord[] = data.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          paidAt: new Date(tx.created_at),
          status: tx.status,
        }));

        setPayments(records);

        // Calculate stats
        const successfulPayments = records.filter(p => p.status === 'success');
        const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
        const avgAmount = successfulPayments.length > 0 ? totalPaid / successfulPayments.length : 0;

        // Calculate trend (compare last 3 vs previous 3)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;
        if (successfulPayments.length >= 6) {
          const recent3 = successfulPayments.slice(0, 3);
          const previous3 = successfulPayments.slice(3, 6);
          const recentAvg = recent3.reduce((s, p) => s + p.amount, 0) / 3;
          const previousAvg = previous3.reduce((s, p) => s + p.amount, 0) / 3;
          
          if (previousAvg > 0) {
            trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100;
            if (trendPercent > 5) trend = 'up';
            else if (trendPercent < -5) trend = 'down';
          }
        }

        setStats({
          totalPaid,
          paymentCount: successfulPayments.length,
          averageAmount: avgAmount,
          lastPaid: records.length > 0 ? records[0].paidAt : null,
          trend,
          trendPercent: Math.abs(trendPercent),
        });
      } else {
        // Demo data
        const demoPayments: PaymentRecord[] = [
          { id: '1', amount: 85.50, paidAt: new Date(Date.now() - 86400000 * 30), status: 'success' },
          { id: '2', amount: 92.30, paidAt: new Date(Date.now() - 86400000 * 60), status: 'success' },
          { id: '3', amount: 78.40, paidAt: new Date(Date.now() - 86400000 * 90), status: 'success' },
        ];
        setPayments(demoPayments);
        
        const total = demoPayments.reduce((s, p) => s + p.amount, 0);
        setStats({
          totalPaid: total,
          paymentCount: 3,
          averageAmount: total / 3,
          lastPaid: demoPayments[0].paidAt,
          trend: 'up',
          trendPercent: 8,
        });
      }

      setIsLoading(false);
    };

    loadHistory();
  }, [billerName]);

  if (isLoading || !stats || stats.paymentCount === 0) {
    return null;
  }

  const formatDate = (date: Date) => format(date, 'MMM d, yyyy');

  return (
    <div className="mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass-subtle rounded-xl p-3 flex items-center justify-between transition-all hover:bg-black/5 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-aurora-blue/10 flex items-center justify-center">
            <History className="w-4 h-4 text-aurora-blue" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">
              {stats.paymentCount} payments • Avg RM {stats.averageAmount.toFixed(0)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Last: {formatDate(stats.lastPaid!)}
              </span>
              {stats.trend !== 'stable' && (
                <span className={`flex items-center gap-0.5 text-xs ${
                  stats.trend === 'up' ? 'text-warning' : 'text-success'
                }`}>
                  {stats.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stats.trendPercent.toFixed(0)}%
                </span>
              )}
            </div>
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
            {payments.slice(0, 6).map((payment, index) => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 glass-subtle rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      RM {payment.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>
                </div>
                {currentAmount && (
                  <span className={`text-xs ${
                    payment.amount < currentAmount ? 'text-success' : 
                    payment.amount > currentAmount ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {payment.amount < currentAmount && '↓'}
                    {payment.amount > currentAmount && '↑'}
                    {payment.amount === currentAmount && '='}
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillPaymentHistory;
