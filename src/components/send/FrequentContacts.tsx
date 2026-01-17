/**
 * Frequent Contacts Component
 * 
 * Shows horizontally scrollable frequent/recent contacts
 * with smart amount suggestions based on history
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FrequentContact {
  id: string;
  name: string;
  phone: string;
  initial: string;
  sendCount: number;
  lastSent: Date | null;
  averageAmount: number;
  suggestedAmount: number;
}

interface FrequentContactsProps {
  onSelect: (contact: FrequentContact) => void;
  selectedId?: string;
}

const FrequentContacts = ({ onSelect, selectedId }: FrequentContactsProps) => {
  const [frequentContacts, setFrequentContacts] = useState<FrequentContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadFrequentContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get send transaction history grouped by recipient
      const { data: transactionData } = await supabase
        .from('transaction_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('intent_type', 'SendMoney')
        .eq('status', 'success')
        .order('created_at', { ascending: false });

      // Also get contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id);

      // Aggregate by recipient
      const recipientMap = new Map<string, {
        count: number;
        lastSent: Date;
        amounts: number[];
        name: string;
        phone: string;
      }>();

      if (transactionData) {
        transactionData.forEach(tx => {
          const key = tx.recipient_id || tx.recipient_name || '';
          const existing = recipientMap.get(key);
          
          if (existing) {
            existing.count++;
            existing.amounts.push(Number(tx.amount));
            if (new Date(tx.created_at) > existing.lastSent) {
              existing.lastSent = new Date(tx.created_at);
            }
          } else {
            recipientMap.set(key, {
              count: 1,
              lastSent: new Date(tx.created_at),
              amounts: [Number(tx.amount)],
              name: tx.recipient_name || 'Unknown',
              phone: tx.recipient_id || '',
            });
          }
        });
      }

      // Convert to array and sort by frequency + recency
      const frequent: FrequentContact[] = [];
      
      recipientMap.forEach((value, key) => {
        const avgAmount = value.amounts.reduce((a, b) => a + b, 0) / value.amounts.length;
        // Suggest the most common amount (mode) or average
        const amountCounts = new Map<number, number>();
        value.amounts.forEach(amt => {
          const rounded = Math.round(amt / 10) * 10; // Round to nearest 10
          amountCounts.set(rounded, (amountCounts.get(rounded) || 0) + 1);
        });
        let suggestedAmount = avgAmount;
        let maxCount = 0;
        amountCounts.forEach((count, amt) => {
          if (count > maxCount) {
            maxCount = count;
            suggestedAmount = amt;
          }
        });

        frequent.push({
          id: key,
          name: value.name,
          phone: value.phone,
          initial: value.name.charAt(0).toUpperCase(),
          sendCount: value.count,
          lastSent: value.lastSent,
          averageAmount: avgAmount,
          suggestedAmount,
        });
      });

      // Sort by recency first, then frequency
      frequent.sort((a, b) => {
        const recencyScore = (b.lastSent?.getTime() || 0) - (a.lastSent?.getTime() || 0);
        const frequencyScore = b.sendCount - a.sendCount;
        return recencyScore * 0.6 + frequencyScore * 0.4 > 0 ? 1 : -1;
      });

      // If no transaction history, use contacts with demo data
      if (frequent.length === 0 && contactsData) {
        contactsData.slice(0, 5).forEach((c, i) => {
          frequent.push({
            id: c.id,
            name: c.name,
            phone: c.phone,
            initial: c.name.charAt(0).toUpperCase(),
            sendCount: 5 - i,
            lastSent: new Date(Date.now() - i * 86400000),
            averageAmount: [50, 100, 30, 75, 150][i] || 50,
            suggestedAmount: [50, 100, 30, 75, 150][i] || 50,
          });
        });
      }

      setFrequentContacts(frequent.slice(0, 8));
      setIsLoading(false);
    };

    loadFrequentContacts();
  }, []);

  if (isLoading || frequentContacts.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Recent</span>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
        {frequentContacts.map((contact, index) => (
          <motion.button
            key={contact.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(contact)}
            className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl transition-all min-w-[80px] ${
              selectedId === contact.id
                ? 'aurora-gradient-soft aurora-border shadow-glow-blue'
                : 'glass-card hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium mb-2 ${
              selectedId === contact.id
                ? 'aurora-gradient text-white'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {contact.initial}
            </div>
            <p className="text-xs font-medium text-foreground truncate max-w-[70px]">
              {contact.name}
            </p>
            {contact.suggestedAmount > 0 && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                RM {contact.suggestedAmount}
              </p>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FrequentContacts;
