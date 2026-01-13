/**
 * Flow Card Activity Page
 * 
 * Full list of card payment events with filtering.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFlowCard, CardEventStatus } from '@/hooks/useFlowCard';
import { FlowCardEventItem } from '@/components/flowcard/FlowCardEventItem';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'all' | CardEventStatus;

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'evaluating', label: 'Pending' },
];

export default function FlowCardActivityPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { events, loading, approveEvent, declineEvent } = useFlowCard();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredEvents = events.filter((event) => {
    if (activeFilter === 'all') return true;
    return event.event_status === activeFilter;
  });

  const handleApprove = async (eventId: string) => {
    const success = await approveEvent(eventId);
    if (success) {
      toast({
        title: 'Payment Approved',
        description: 'Transaction completed successfully',
      });
    }
  };

  const handleDecline = async (eventId: string) => {
    const success = await declineEvent(eventId);
    if (success) {
      toast({
        title: 'Payment Declined',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/flow-card')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="font-semibold">Card Activity</h1>
            <p className="text-xs text-muted-foreground">
              {events.length} transactions
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter.value
                  ? 'aurora-gradient text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-aurora-blue/30 border-t-aurora-blue rounded-full"
            />
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <FlowCardEventItem
                event={event}
                onApprove={
                  event.event_status === 'evaluating'
                    ? () => handleApprove(event.id)
                    : undefined
                }
                onDecline={
                  event.event_status === 'evaluating'
                    ? () => handleDecline(event.id)
                    : undefined
                }
              />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
