/**
 * Real-time Activity Feed Component
 * 
 * Collapsible card showing recent transactions with live updates.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Store,
  Radio,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeActivityFeed, ActivityItem } from '@/hooks/useRealtimeActivityFeed';
import { formatDistanceToNow } from 'date-fns';

const typeConfig: Record<string, { icon: typeof Store; color: string; label: string }> = {
  PAY_MERCHANT: { icon: Store, color: 'text-orange-500', label: 'Payment' },
  SEND_MONEY: { icon: ArrowUpRight, color: 'text-blue-500', label: 'Sent' },
  RECEIVE_MONEY: { icon: ArrowDownLeft, color: 'text-success', label: 'Received' },
};

const ActivityItemRow = ({ item, index }: { item: ActivityItem; index: number }) => {
  const config = typeConfig[item.type] || typeConfig.PAY_MERCHANT;
  const Icon = config.icon;
  const isIncoming = item.type === 'RECEIVE_MONEY';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        transition: { delay: index * 0.03, duration: 0.2 }
      }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
      className={`
        flex items-center gap-3 py-2.5
        ${item.isNew ? 'bg-success/5 rounded-lg px-2 -mx-2' : ''}
        transition-colors duration-500
      `}
    >
      <motion.div 
        className={`
          w-9 h-9 rounded-full flex items-center justify-center
          ${item.isNew ? 'bg-success/20 ring-2 ring-success/30' : 'bg-muted/50'}
        `}
        animate={item.isNew ? { scale: [1, 1.1, 1] } : {}}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
          {item.isNew && (
            <span className="px-1.5 py-0.5 bg-success/20 rounded-full text-[10px] font-semibold text-success">
              NEW
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {config.label} • {formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </p>
      </div>

      <div className="text-right">
        <p className={`font-semibold tabular-nums text-sm ${isIncoming ? 'text-success' : 'text-foreground'}`}>
          {isIncoming ? '+' : '−'}{item.currency} {item.amount.toFixed(2)}
        </p>
        {item.railUsed && (
          <p className="text-[10px] text-muted-foreground">via {item.railUsed}</p>
        )}
      </div>
    </motion.div>
  );
};

export function RealtimeActivityFeed() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const { activities, isLoading, isConnected } = useRealtimeActivityFeed(5);

  // Summary for collapsed state
  const recentCount = activities.length;
  const latestActivity = activities[0];

  if (isLoading) {
    return (
      <div className="liquid-glass p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-20" />
            <div className="h-2 bg-muted rounded w-28" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="liquid-glass overflow-hidden"
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Activity</h3>
              {isConnected && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 rounded-full">
                  <Radio className="w-2 h-2 text-success animate-pulse" />
                  <span className="text-[9px] font-medium text-success">LIVE</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {recentCount > 0 
                ? `${recentCount} recent • Last: ${latestActivity?.name || 'None'}`
                : 'No transactions yet'
              }
            </p>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 pt-0">
              {activities.length > 0 ? (
                <>
                  <div className="divide-y divide-border/30">
                    <AnimatePresence mode="popLayout">
                      {activities.map((item, index) => (
                        <ActivityItemRow key={item.id} item={item} index={index} />
                      ))}
                    </AnimatePresence>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/activity')}
                    className="w-full mt-3 py-2 text-xs text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    See all activity →
                  </button>
                </>
              ) : (
                <div className="py-6 text-center">
                  <Store className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
