/**
 * Payment Sources Manager
 * 
 * Allows users to manage their funding sources:
 * - View all sources with balances
 * - Add new sources
 * - Edit balance manually
 * - Reorder priority (drag-like tap interactions)
 * - Link/unlink sources
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  Plus, 
  ChevronUp, 
  ChevronDown,
  Pencil,
  Check,
  X,
  Link2,
  Link2Off
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useFundingSources, RealFundingSource } from "@/hooks/useFundingSources";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const railIcons = {
  wallet: Wallet,
  bank: Building2,
  debit_card: CreditCard,
  credit_card: CreditCard,
  bnpl: CreditCard,
};

const typeLabels = {
  wallet: "E-Wallet",
  bank: "Bank Account",
  debit_card: "Debit Card",
  credit_card: "Credit Card",
  bnpl: "Buy Now Pay Later",
};

interface EditingState {
  sourceId: string;
  balance: string;
}

const PaymentSourcesManager = () => {
  const { user } = useAuth();
  const { sources, loading, updateBalance, updateLinkedStatus, updatePriorities, refetch } = useFundingSources();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "wallet" as "wallet" | "bank" | "debit_card" | "credit_card",
    balance: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSource = async () => {
    if (!user || !newSource.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("funding_sources").insert({
        user_id: user.id,
        name: newSource.name.trim(),
        type: newSource.type,
        balance: parseFloat(newSource.balance) || 0,
        priority: sources.length + 1,
        linked_status: "linked",
        available: true,
      });

      if (error) throw error;

      toast.success("Payment source added");
      setIsAddDialogOpen(false);
      setNewSource({ name: "", type: "wallet", balance: "" });
      refetch();
    } catch (err) {
      toast.error("Failed to add source");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveBalance = async (sourceId: string) => {
    if (!editing) return;
    
    const newBalance = parseFloat(editing.balance);
    if (isNaN(newBalance) || newBalance < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const result = await updateBalance(sourceId, newBalance);
    if (result.success) {
      toast.success("Balance updated");
      setEditing(null);
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  const handleMovePriority = async (sourceId: string, direction: "up" | "down") => {
    const currentIndex = sources.findIndex(s => s.id === sourceId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sources.length) return;

    const newOrder = [...sources];
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    const result = await updatePriorities(newOrder.map(s => s.id));
    if (!result.success) {
      toast.error("Failed to reorder");
    }
  };

  const handleToggleLink = async (source: RealFundingSource) => {
    const result = await updateLinkedStatus(source.id, !source.isLinked);
    if (result.success) {
      toast.success(source.isLinked ? "Source unlinked" : "Source linked");
    } else {
      toast.error(result.error || "Failed to update");
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-aurora-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sources List */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden shadow-float"
      >
        {sources.length === 0 ? (
          <div className="p-6 text-center">
            <Wallet className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No payment sources yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add your wallets and bank accounts</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {sources
              .sort((a, b) => a.priority - b.priority)
              .map((source, index) => {
                const Icon = railIcons[source.type as keyof typeof railIcons] || Wallet;
                const isEditing = editing?.sourceId === source.id;
                
                return (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 ${!source.isLinked ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Priority controls */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMovePriority(source.id, "up")}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleMovePriority(source.id, "down")}
                          disabled={index === sources.length - 1}
                          className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl aurora-gradient-soft flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-aurora-blue" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium truncate">{source.name}</span>
                          <span className="text-xs text-muted-foreground/70 glass-subtle px-1.5 py-0.5 rounded">
                            #{source.priority}
                          </span>
                        </div>
                        
                        {/* Balance - editable */}
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div
                              key="editing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 mt-1"
                            >
                              <span className="text-xs text-muted-foreground">RM</span>
                              <Input
                                type="number"
                                value={editing.balance}
                                onChange={(e) => setEditing({ ...editing, balance: e.target.value })}
                                className="h-7 w-24 text-sm"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBalance(source.id)}
                                className="p-1 rounded-full bg-success/20 text-success hover:bg-success/30 transition-colors"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="p-1 rounded-full bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button
                              key="display"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onClick={() => setEditing({ sourceId: source.id, balance: source.balance.toString() })}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1 group"
                            >
                              <span>RM {source.balance.toFixed(2)}</span>
                              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Link toggle */}
                      <button
                        onClick={() => handleToggleLink(source)}
                        className={`p-2 rounded-xl transition-colors ${
                          source.isLinked 
                            ? "bg-success/10 text-success hover:bg-success/20" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {source.isLinked ? (
                          <Link2 className="w-4 h-4" />
                        ) : (
                          <Link2Off className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </motion.div>

      {/* Add Source Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-12 rounded-2xl border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-aurora-blue/50 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Payment Source
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card border-border/30">
          <DialogHeader>
            <DialogTitle>Add Payment Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Touch 'n Go, Maybank"
                value={newSource.name}
                onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={newSource.type}
                onValueChange={(value) => setNewSource({ ...newSource, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">E-Wallet</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Balance (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">RM</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newSource.balance}
                  onChange={(e) => setNewSource({ ...newSource, balance: e.target.value })}
                />
              </div>
            </div>
            <Button
              onClick={handleAddSource}
              disabled={isAdding || !newSource.name.trim()}
              className="w-full aurora-gradient text-white"
            >
              {isAdding ? "Adding..." : "Add Source"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center px-4">
        Sources are used in priority order. Tap balance to edit manually.
      </p>
    </div>
  );
};

export default PaymentSourcesManager;
