/**
 * Real-time Activity Feed Component
 * 
 * Shows recent transactions with live updates and smooth animations.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Store,
  Radio,
  ChevronRight,
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
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          delay: index * 0.05,
          type: 'spring',
          stiffness: 500,
          damping: 30
        }
      }}
      exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
      className={`
        flex items-center gap-3 py-3 px-1
        ${item.isNew ? 'bg-success/5 rounded-lg -mx-1 px-2' : ''}
        transition-colors duration-500
      `}
    >
      {/* Icon */}
      <motion.div 
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${item.isNew 
            ? 'bg-success/20 ring-2 ring-success/30' 
            : 'bg-muted/50'
          }
        `}
        animate={item.isNew ? { 
          scale: [1, 1.1, 1],
          transition: { duration: 0.3 }
        } : {}}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </motion.div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground text-sm truncate">
            {item.name}
          </p>
          {item.isNew && (
            <motion.span 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-1.5 py-0.5 bg-success/20 rounded-full text-[10px] font-semibold text-success"
            >
              NEW
            </motion.span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {config.label} • {formatDistanceToNow(item.timestamp, { addSuffix: true })}
        </p>
      </div>

      {/* Amount */}
      <motion.div 
        className="text-right"
        animate={item.isNew ? {
          scale: [1, 1.15, 1],
          transition: { duration: 0.4, delay: 0.1 }
        } : {}}
      >
        <p className={`font-semibold tabular-nums text-sm ${isIncoming ? 'text-success' : 'text-foreground'}`}>
          {isIncoming ? '+' : '−'}{item.currency} {item.amount.toFixed(2)}
        </p>
        {item.railUsed && (
          <p className="text-[10px] text-muted-foreground">
            via {item.railUsed}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

export function RealtimeActivityFeed() {
  const navigate = useNavigate();
  const { activities, isLoading, isConnected } = useRealtimeActivityFeed(5);

  if (isLoading) {
    return (
      <div className="liquid-glass p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-24" />
                <div className="h-2 bg-muted rounded w-16" />
              </div>
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="liquid-glass p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Activity</h3>
          {isConnected && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-success/10 rounded-full">
              <Radio className="w-2.5 h-2.5 text-success animate-pulse" />
              <span className="text-[9px] font-medium text-success">LIVE</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => navigate('/activity')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          See all
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Activity List */}
      {activities.length > 0 ? (
        <div className="divide-y divide-border/30">
          <AnimatePresence mode="popLayout">
            {activities.map((item, index) => (
              <ActivityItemRow key={item.id} item={item} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Store className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No transactions yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Your activity will appear here
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
