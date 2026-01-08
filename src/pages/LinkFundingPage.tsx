import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  GripVertical,
  Check,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface PriorityItem {
  id: string;
  type: 'wallet' | 'bank' | 'debit_card' | 'credit_card';
  label: string;
}

interface LinkableSource {
  id: string;
  label: string;
  type: 'wallet' | 'bank' | 'debit_card' | 'credit_card';
}

const priorityItems: PriorityItem[] = [
  { id: 'wallet', type: 'wallet', label: 'Wallets' },
  { id: 'bank', type: 'bank', label: 'Bank account' },
  { id: 'debit_card', type: 'debit_card', label: 'Debit card' },
  { id: 'credit_card', type: 'credit_card', label: 'Credit card' },
];

const linkableSources: LinkableSource[] = [
  { id: 'tng', label: "Link Touch 'n Go", type: 'wallet' },
  { id: 'grabpay', label: 'Link GrabPay', type: 'wallet' },
  { id: 'bank', label: 'Link bank', type: 'bank' },
  { id: 'card', label: 'Link card', type: 'credit_card' },
];

const LinkFundingPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [priority, setPriority] = useState<PriorityItem[]>(priorityItems);
  const [maxAutoTopUp, setMaxAutoTopUp] = useState('200');
  const [extraConfirmAbove, setExtraConfirmAbove] = useState('300');
  const [linkedSources, setLinkedSources] = useState<Set<string>>(new Set());
  const [linkingSource, setLinkingSource] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPriority = [...priority];
    const draggedItem = newPriority[draggedIndex];
    newPriority.splice(draggedIndex, 1);
    newPriority.splice(index, 0, draggedItem);
    setPriority(newPriority);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleLink = async (source: LinkableSource) => {
    setLinkingSource(source.id);
    
    // Simulate linking in Prototype mode
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLinkedSources(prev => new Set([...prev, source.id]));
    setLinkingSource(null);
    toast.success(`${source.label.replace('Link ', '')} linked`);
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Update funding sources with new priority and limits
      const updates = priority.map((item, index) => ({
        user_id: user.id,
        type: item.type,
        priority: index + 1,
        max_auto_topup_amount: parseFloat(maxAutoTopUp) || 200,
        require_extra_confirm_amount: parseFloat(extraConfirmAbove) || 300,
      }));

      // Update each funding source
      for (const update of updates) {
        await supabase
          .from('funding_sources')
          .update({
            priority: update.priority,
            max_auto_topup_amount: update.max_auto_topup_amount,
            require_extra_confirm_amount: update.require_extra_confirm_amount,
          })
          .eq('user_id', user.id)
          .eq('type', update.type);
      }

      // In Prototype mode, mark linked sources
      if (linkedSources.size > 0) {
        // Map linkable source IDs to funding source types
        const typeMapping: Record<string, 'wallet' | 'bank' | 'debit_card' | 'credit_card'> = {
          tng: 'wallet',
          grabpay: 'wallet',
          bank: 'bank',
          card: 'credit_card',
        };

        for (const sourceId of linkedSources) {
          const type = typeMapping[sourceId];
          if (type) {
            await supabase
              .from('funding_sources')
              .update({ linked_status: 'linked' })
              .eq('user_id', user.id)
              .eq('type', type);
          }
        }
      }

      navigate('/permissions', { replace: true });
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    toast.info('You can set up funding sources later');
    navigate('/permissions', { replace: true });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Main content */}
      <div className="flex-1 pt-12 pb-6 max-w-md mx-auto w-full overflow-y-auto">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-foreground tracking-tight mb-4"
        >
          Your payment order
        </motion.h1>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-base text-muted-foreground mb-8"
        >
          FLOW will use this order to resolve payments automatically.
        </motion.p>

        {/* Priority Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-sm font-medium text-foreground mb-4">Priority</p>
          <div className="space-y-2">
            {priority.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 bg-secondary rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-opacity ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-base text-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Limits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="max-topup" className="text-sm font-medium">
              Max auto top up
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                RM
              </span>
              <Input
                id="max-topup"
                type="number"
                value={maxAutoTopUp}
                onChange={(e) => setMaxAutoTopUp(e.target.value)}
                className="pl-12 h-14 rounded-2xl"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              FLOW will not top up more than this without asking.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra-confirm" className="text-sm font-medium">
              Extra confirmation above
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                RM
              </span>
              <Input
                id="extra-confirm"
                type="number"
                value={extraConfirmAbove}
                onChange={(e) => setExtraConfirmAbove(e.target.value)}
                className="pl-12 h-14 rounded-2xl"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              For larger amounts, FLOW adds an extra confirmation step.
            </p>
          </div>
        </motion.div>

        {/* Links Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <div className="space-y-2">
            {linkableSources.map((source) => {
              const isLinked = linkedSources.has(source.id);
              const isLinking = linkingSource === source.id;

              return (
                <button
                  key={source.id}
                  onClick={() => !isLinked && !isLinking && handleLink(source)}
                  disabled={isLinked || isLinking}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isLinked
                      ? 'bg-success/5 border-success/20'
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <span className={`text-base ${isLinked ? 'text-success' : 'text-foreground'}`}>
                    {source.label}
                  </span>
                  {isLinking ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : isLinked ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="pb-6 max-w-md mx-auto w-full space-y-3"
      >
        <Button
          onClick={handleContinue}
          disabled={isSaving}
          className="w-full h-14 text-base font-medium rounded-2xl"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Continue'
          )}
        </Button>

        <button
          onClick={handleSkip}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
};

export default LinkFundingPage;
