/**
 * FLOW App Management Page
 * 
 * Central hub for all linked apps with:
 * - Real-time balances across all wallets, banks, cards
 * - Low balance detection with visual indicators
 * - Auto top-up configuration per source
 * - One-tap top-up actions
 * - Priority reordering
 * - Link/unlink management
 * - Activity per source
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  RefreshCw, 
  ChevronRight, 
  AlertTriangle,
  Zap,
  Plus,
  Settings2,
  ArrowUpCircle,
  Check,
  X,
  TrendingUp,
  Shield,
  Sparkles,
  GripVertical
} from 'lucide-react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { getBrandedIcon } from '@/components/icons/BrandedIcons';
import { PulsingDot, SyncSpinner, ShimmerEffect } from '@/components/ui/micro-animations';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Constants for intelligence
const LOW_BALANCE_THRESHOLD = 20;
const AUTO_TOPUP_DEFAULT = 50;

interface TopUpSheetProps {
  source: {
    id: string;
    name: string;
    balance: number;
    type: string;
  } | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

function TopUpSheet({ source, open, onClose, onConfirm }: TopUpSheetProps) {
  const [amount, setAmount] = useState(AUTO_TOPUP_DEFAULT);
  const presetAmounts = [20, 50, 100, 200];

  if (!source) return null;

  const IconComponent = getBrandedIcon(source.name, source.type);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
              <IconComponent size={32} />
            </div>
            <div>
              <SheetTitle>Top Up {source.name}</SheetTitle>
              <SheetDescription>
                Current balance: RM {source.balance.toFixed(2)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Amount Selection */}
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={cn(
                  "py-3 rounded-xl font-medium text-sm transition-all",
                  amount === preset
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                RM {preset}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Custom Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                RM
              </span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="pl-12 h-12 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Source Selection Preview */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-2">From</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="font-medium text-sm">Maybank</p>
                <p className="text-xs text-muted-foreground">Available: RM 1,200.00</p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button 
            onClick={() => onConfirm(amount)}
            className="w-full h-14 text-base font-semibold rounded-2xl"
          >
            <ArrowUpCircle className="w-5 h-5 mr-2" />
            Top Up RM {amount.toFixed(2)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface SourceSettingsDialogProps {
  source: {
    id: string;
    name: string;
    balance: number;
    type: string;
    maxAutoTopUp?: number;
    requireConfirmAbove?: number;
    isLinked: boolean;
  } | null;
  open: boolean;
  onClose: () => void;
  onSave: (settings: { autoTopUp: boolean; maxAmount: number }) => void;
  onUnlink: () => void;
}

function SourceSettingsDialog({ source, open, onClose, onSave, onUnlink }: SourceSettingsDialogProps) {
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState(true);
  const [maxAutoTopUp, setMaxAutoTopUp] = useState(source?.maxAutoTopUp || 100);

  if (!source) return null;

  const IconComponent = getBrandedIcon(source.name, source.type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-sm">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
              <IconComponent size={32} />
            </div>
            <div>
              <DialogTitle>{source.name} Settings</DialogTitle>
              <DialogDescription>
                Configure auto-funding and limits
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto Top-Up Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Auto Top-Up</p>
                <p className="text-xs text-muted-foreground">
                  When balance is low
                </p>
              </div>
            </div>
            <Switch 
              checked={autoTopUpEnabled}
              onCheckedChange={setAutoTopUpEnabled}
            />
          </div>

          {/* Max Auto Top-Up Amount */}
          <AnimatePresence>
            {autoTopUpEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label className="text-xs text-muted-foreground">Max Auto Top-Up</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setMaxAutoTopUp(preset)}
                      className={cn(
                        "py-2.5 rounded-xl font-medium text-sm transition-all",
                        maxAutoTopUp === preset
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      RM {preset}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Low Balance Threshold Info */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-500">Low Balance Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll be notified when balance falls below RM {LOW_BALANCE_THRESHOLD}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onUnlink}
              className="flex-1 rounded-xl h-12"
            >
              Unlink App
            </Button>
            <Button
              onClick={() => onSave({ autoTopUp: autoTopUpEnabled, maxAmount: maxAutoTopUp })}
              className="flex-1 rounded-xl h-12"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AppSourceItemProps {
  source: {
    id: string;
    name: string;
    balance: number;
    type: string;
    priority: number;
    isLinked: boolean;
    maxAutoTopUp?: number;
  };
  isLowBalance: boolean;
  autoTopUpEnabled: boolean;
  onTopUp: () => void;
  onSettings: () => void;
  reorderEnabled?: boolean;
}

function AppSourceItem({ 
  source, 
  isLowBalance, 
  autoTopUpEnabled,
  onTopUp, 
  onSettings,
  reorderEnabled 
}: AppSourceItemProps) {
  const IconComponent = getBrandedIcon(source.name, source.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card rounded-2xl p-4 relative overflow-hidden",
        isLowBalance && "ring-1 ring-amber-500/30"
      )}
    >
      {/* Low Balance Indicator */}
      {isLowBalance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"
        />
      )}

      <div className="flex items-center gap-4">
        {/* Reorder Handle */}
        {reorderEnabled && (
          <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50">
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Icon */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center">
            <IconComponent size={36} />
          </div>
          {autoTopUpEnabled && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-foreground truncate">{source.name}</p>
            {source.priority === 1 && (
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary rounded">
                PRIMARY
              </span>
            )}
          </div>
          <p className={cn(
            "text-lg font-bold tabular-nums",
            isLowBalance ? "text-amber-500" : "text-foreground"
          )}>
            RM {source.balance.toFixed(2)}
          </p>
          {isLowBalance && autoTopUpEnabled && (
            <p className="text-xs text-amber-500/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Auto top-up triggered
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {source.type === 'wallet' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onTopUp}
              className={cn(
                "px-4 py-2 rounded-xl font-medium text-sm transition-colors",
                isLowBalance
                  ? "bg-amber-500 text-white"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              Top Up
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSettings}
            className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function AppsPage() {
  const { 
    sources, 
    totalBalance, 
    loading, 
    refetch, 
    updateBalance,
    updateLinkedStatus,
    updatePriorities 
  } = useFundingSources();
  
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [topUpSource, setTopUpSource] = useState<typeof sources[0] | null>(null);
  const [settingsSource, setSettingsSource] = useState<typeof sources[0] | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedSources, setOrderedSources] = useState<typeof sources>([]);

  // Keep ordered sources in sync
  useMemo(() => {
    if (!reorderMode && sources.length > 0) {
      setOrderedSources([...sources].sort((a, b) => a.priority - b.priority));
    }
  }, [sources, reorderMode]);

  // Derived data
  const linkedSources = useMemo(() => 
    orderedSources.filter(s => s.isLinked),
    [orderedSources]
  );

  const lowBalanceSources = useMemo(() => 
    linkedSources.filter(s => s.type === 'wallet' && s.balance < LOW_BALANCE_THRESHOLD),
    [linkedSources]
  );

  const hasLowBalance = lowBalanceSources.length > 0;

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsSyncing(true);
    await refetch();
    setTimeout(() => setIsSyncing(false), 800);
    toast({
      title: "Balances synced",
      description: "All app balances are up to date"
    });
  }, [refetch, toast]);

  const handleTopUp = useCallback(async (amount: number) => {
    if (!topUpSource) return;

    // Simulate top-up (in real app, this would call bank API)
    const newBalance = topUpSource.balance + amount;
    await updateBalance(topUpSource.id, newBalance);
    
    toast({
      title: "Top-up successful",
      description: `RM ${amount.toFixed(2)} added to ${topUpSource.name}`
    });
    
    setTopUpSource(null);
  }, [topUpSource, updateBalance, toast]);

  const handleSaveSettings = useCallback(async (settings: { autoTopUp: boolean; maxAmount: number }) => {
    if (!settingsSource) return;

    // In real app, save to user preferences
    toast({
      title: "Settings saved",
      description: `${settingsSource.name} preferences updated`
    });
    
    setSettingsSource(null);
  }, [settingsSource, toast]);

  const handleUnlink = useCallback(async () => {
    if (!settingsSource) return;

    await updateLinkedStatus(settingsSource.id, false);
    
    toast({
      title: "App unlinked",
      description: `${settingsSource.name} has been disconnected`
    });
    
    setSettingsSource(null);
  }, [settingsSource, updateLinkedStatus, toast]);

  const handleSaveOrder = useCallback(async () => {
    const orderedIds = orderedSources.map(s => s.id);
    await updatePriorities(orderedIds);
    setReorderMode(false);
    
    toast({
      title: "Priority saved",
      description: "Payment source order updated"
    });
  }, [orderedSources, updatePriorities, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted/50" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-muted/50 rounded" />
                  <div className="h-6 w-20 bg-muted/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">My Apps</h1>
              <p className="text-sm text-muted-foreground">
                {linkedSources.length} connected
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center"
            >
              {isSyncing ? (
                <SyncSpinner size={18} />
              ) : (
                <RefreshCw className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-6 relative overflow-hidden"
        >
          {/* Shimmer on sync */}
          <AnimatePresence>
            {isSyncing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                <ShimmerEffect />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-widest">
              Total Available
            </p>
            <PulsingDot color="bg-success" size="sm" />
          </div>
          
          <motion.p 
            key={totalBalance}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-foreground tracking-tight"
          >
            RM {totalBalance.toFixed(2)}
          </motion.p>

          {/* Status Indicators */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium text-success">Active</p>
              </div>
            </div>
            
            {hasLowBalance && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                  <p className="text-sm font-medium text-amber-500">
                    {lowBalanceSources.length} low balance
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Low Balance Alert Banner */}
      <AnimatePresence>
        {hasLowBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Auto Top-Up Enabled</p>
                    <p className="text-xs text-muted-foreground">
                      {lowBalanceSources.map(s => s.name).join(', ')} will auto-refill
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reorder Mode Toggle */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Payment Sources
          </p>
          <button
            onClick={() => reorderMode ? handleSaveOrder() : setReorderMode(true)}
            className={cn(
              "text-sm font-medium transition-colors",
              reorderMode ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {reorderMode ? (
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                Save Order
              </span>
            ) : (
              "Edit Priority"
            )}
          </button>
        </div>
      </div>

      {/* Source List */}
      <div className="px-4 space-y-3">
        {reorderMode ? (
          <Reorder.Group 
            axis="y" 
            values={orderedSources} 
            onReorder={setOrderedSources}
            className="space-y-3"
          >
            {orderedSources.filter(s => s.isLinked).map((source) => (
              <Reorder.Item key={source.id} value={source}>
                <AppSourceItem
                  source={source}
                  isLowBalance={source.type === 'wallet' && source.balance < LOW_BALANCE_THRESHOLD}
                  autoTopUpEnabled={true}
                  onTopUp={() => setTopUpSource(source)}
                  onSettings={() => setSettingsSource(source)}
                  reorderEnabled
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          linkedSources.map((source) => (
            <AppSourceItem
              key={source.id}
              source={source}
              isLowBalance={source.type === 'wallet' && source.balance < LOW_BALANCE_THRESHOLD}
              autoTopUpEnabled={true}
              onTopUp={() => setTopUpSource(source)}
              onSettings={() => setSettingsSource(source)}
            />
          ))
        )}

        {/* Add New App Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Link New App</span>
        </motion.button>
      </div>

      {/* Sheets & Dialogs */}
      <TopUpSheet
        source={topUpSource}
        open={!!topUpSource}
        onClose={() => setTopUpSource(null)}
        onConfirm={handleTopUp}
      />

      <SourceSettingsDialog
        source={settingsSource}
        open={!!settingsSource}
        onClose={() => setSettingsSource(null)}
        onSave={handleSaveSettings}
        onUnlink={handleUnlink}
      />
    </div>
  );
}
