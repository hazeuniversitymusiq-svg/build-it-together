/**
 * Flow Card Event Item
 * 
 * Displays a single card payment event with status and explainability.
 */

import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ChevronRight
} from 'lucide-react';
import type { CardPaymentEvent, CardEventStatus } from '@/hooks/useFlowCard';

interface FlowCardEventItemProps {
  event: CardPaymentEvent;
  onApprove?: () => void;
  onDecline?: () => void;
}

const statusConfig: Record<CardEventStatus, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof CheckCircle2 
}> = {
  received: { label: 'Received', color: 'text-muted-foreground', bgColor: 'bg-muted', icon: Clock },
  evaluating: { label: 'Confirm', color: 'text-aurora-blue', bgColor: 'bg-aurora-blue/10', icon: Loader2 },
  approved: { label: 'Approved', color: 'text-success', bgColor: 'bg-success/10', icon: CheckCircle2 },
  declined: { label: 'Declined', color: 'text-destructive', bgColor: 'bg-destructive/10', icon: XCircle },
};

export function FlowCardEventItem({ event, onApprove, onDecline }: FlowCardEventItemProps) {
  const config = statusConfig[event.event_status];
  const Icon = config.icon;
  const isPending = event.event_status === 'evaluating';
  
  const formattedDate = new Date(event.created_at).toLocaleString('en-MY', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedAmount = new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: event.currency,
  }).format(event.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-xl p-4 ${isPending ? 'ring-2 ring-aurora-blue/50' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon 
            size={20} 
            className={`${config.color} ${event.event_status === 'evaluating' ? 'animate-spin' : ''}`} 
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {event.merchant_name || 'Unknown Merchant'}
              </p>
              <p className="text-xs text-muted-foreground">
                {event.event_type === 'terminal_tap' ? 'Terminal Tap' : event.event_type}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-semibold">{formattedAmount}</p>
              <p className="text-xs text-muted-foreground">{formattedDate}</p>
            </div>
          </div>
          
          {/* Explainability */}
          {event.explainability_summary && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              {event.explainability_summary}
            </p>
          )}
          
          {/* Pending Actions */}
          {isPending && onApprove && onDecline && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={onDecline}
                className="flex-1 py-2 px-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                Decline
              </button>
              <button
                onClick={onApprove}
                className="flex-1 py-2 px-3 rounded-lg aurora-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Approve
              </button>
            </div>
          )}
        </div>
        
        {/* Chevron for completed events */}
        {!isPending && (
          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
        )}
      </div>
    </motion.div>
  );
}
