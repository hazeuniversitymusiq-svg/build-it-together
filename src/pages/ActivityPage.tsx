/**
 * FLOW Activity Page
 * 
 * Full transaction history with filters and detailed cards.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft,
  ArrowUpRight, 
  ArrowDownLeft, 
  Store, 
  Wallet, 
  RefreshCw,
  Receipt,
  Filter,
  Check,
  X,
  Clock,
  AlertCircle,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type TransactionLog = Database['public']['Tables']['transaction_logs']['Row'];

type FilterType = "all" | "payments" | "transfers" | "bills";
type StatusFilter = "all" | "success" | "pending" | "failed";

const intentTypeLabels: Record<string, string> = {
  PayMerchant: "Payment",
  SendMoney: "Transfer",
  RequestMoney: "Request",
  PayBill: "Bill",
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  success: { 
    icon: <Check className="w-3 h-3" />, 
    color: "bg-success/20 text-success", 
    label: "Completed" 
  },
  pending: { 
    icon: <Clock className="w-3 h-3" />, 
    color: "bg-warning/20 text-warning", 
    label: "Pending" 
  },
  failed: { 
    icon: <X className="w-3 h-3" />, 
    color: "bg-destructive/20 text-destructive", 
    label: "Failed" 
  },
  cancelled: { 
    icon: <AlertCircle className="w-3 h-3" />, 
    color: "bg-muted text-muted-foreground", 
    label: "Cancelled" 
  },
};

const ActivityPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Load transaction logs
  const loadLogs = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("transaction_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLogs(data);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadLogs();
  }, [navigate]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "payments" && log.intent_type !== "PayMerchant") return false;
      if (typeFilter === "transfers" && log.intent_type !== "SendMoney") return false;
      if (typeFilter === "bills" && log.intent_type !== "PayBill") return false;
    }
    
    // Status filter
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    
    return true;
  });

  // Get display info
  const getLogDisplay = (log: TransactionLog) => {
    const isOutgoing = log.intent_type !== "RequestMoney";
    
    let icon = Wallet;
    let name = "Transaction";
    
    switch (log.intent_type) {
      case "PayMerchant":
        icon = Store;
        name = log.merchant_name || "Merchant";
        break;
      case "SendMoney":
        icon = ArrowUpRight;
        name = log.recipient_name || "Contact";
        break;
      case "RequestMoney":
        icon = ArrowDownLeft;
        name = log.recipient_name || "Contact";
        break;
      case "PayBill":
        icon = Zap;
        name = log.merchant_name || "Biller";
        break;
    }
    
    return { icon, name, isOutgoing };
  };

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "payments", label: "Payments" },
    { key: "transfers", label: "Transfers" },
    { key: "bills", label: "Bills" },
  ];

  const statusButtons: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "success", label: "Completed" },
    { key: "pending", label: "Pending" },
    { key: "failed", label: "Failed" },
  ];

  if (isLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="px-6 pt-16 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/home")}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Activity
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${
                showFilters ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={() => loadLogs(true)}
              disabled={isRefreshing}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Type Filters */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Type</p>
                <div className="flex gap-2 flex-wrap">
                  {filterButtons.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setTypeFilter(btn.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        typeFilter === btn.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {statusButtons.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setStatusFilter(btn.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        statusFilter === btn.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction Count */}
      <div className="px-6 pb-4">
        <p className="text-sm text-muted-foreground">
          {filteredLogs.length} transaction{filteredLogs.length !== 1 ? "s" : ""}
          {(typeFilter !== "all" || statusFilter !== "all") && (
            <span className="text-xs ml-1">(filtered)</span>
          )}
        </p>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3">
        {filteredLogs.map((log, index) => {
          const display = getLogDisplay(log);
          const Icon = display.icon;
          const status = statusConfig[log.status] || statusConfig.success;

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-card border border-border rounded-2xl p-4"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{display.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {intentTypeLabels[log.intent_type] || log.intent_type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-semibold tabular-nums ${
                    display.isOutgoing ? "text-foreground" : "text-success"
                  }`}>
                    {display.isOutgoing ? "-" : "+"}RM {Number(log.amount).toFixed(2)}
                  </p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </div>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <div className="flex items-center gap-4 text-muted-foreground">
                  {log.rail_used && (
                    <span>via {log.rail_used}</span>
                  )}
                  {log.reference && (
                    <span className="font-mono text-xs">Ref: {log.reference.substring(0, 8)}</span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {format(new Date(log.created_at), "MMM d, h:mm a")}
                </span>
              </div>

              {/* Note (if any) */}
              {log.note && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground italic">"{log.note}"</p>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Empty State */}
        {filteredLogs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No transactions found</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {logs.length === 0 
                ? "Your payment history will appear here after your first transaction."
                : "Try adjusting your filters to see more transactions."
              }
            </p>
            {logs.length > 0 && (typeFilter !== "all" || statusFilter !== "all") && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  );
});
ActivityPage.displayName = "ActivityPage";

export default ActivityPage;
