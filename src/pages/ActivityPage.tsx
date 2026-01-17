/**
 * FLOW Activity Page
 * 
 * iOS 26 Liquid Glass design - Full transaction history with filters
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
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
import { format } from "date-fns";
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

// Filter button options - extracted to avoid recreation
const FILTER_BUTTONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "payments", label: "Payments" },
  { key: "transfers", label: "Transfers" },
  { key: "bills", label: "Bills" },
];

const STATUS_BUTTONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Completed" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

const ActivityPage = () => {
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isShowingDemoData, setIsShowingDemoData] = useState(false);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Demo transactions for prototype mode
  const getDemoTransactions = useCallback((): TransactionLog[] => {
    const now = new Date();
    const userId = 'demo-user';
    
    return [
      {
        id: 'demo-1',
        user_id: userId,
        intent_id: 'intent-1',
        intent_type: 'PayMerchant',
        amount: 12.50,
        currency: 'MYR',
        status: 'success',
        merchant_id: 'm-1',
        merchant_name: 'Ah Seng Mamak',
        recipient_id: null,
        recipient_name: null,
        rail_used: 'TouchNGo',
        reference: 'TXN-ASM-001',
        note: null,
        trigger: 'qr_scan',
        created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      },
      {
        id: 'demo-2',
        user_id: userId,
        intent_id: 'intent-2',
        intent_type: 'SendMoney',
        amount: 50.00,
        currency: 'MYR',
        status: 'success',
        merchant_id: null,
        merchant_name: null,
        recipient_id: 'c-1',
        recipient_name: 'Sarah',
        rail_used: 'DuitNow',
        reference: 'TXN-P2P-002',
        note: 'Lunch money 🍜',
        trigger: 'contact',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        id: 'demo-3',
        user_id: userId,
        intent_id: 'intent-3',
        intent_type: 'PayBill',
        amount: 88.00,
        currency: 'MYR',
        status: 'success',
        merchant_id: 'b-1',
        merchant_name: 'Unifi',
        recipient_id: null,
        recipient_name: null,
        rail_used: 'Maybank',
        reference: 'BILL-UNI-003',
        note: null,
        trigger: 'bill_reminder',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        id: 'demo-4',
        user_id: userId,
        intent_id: 'intent-4',
        intent_type: 'RequestMoney',
        amount: 25.00,
        currency: 'MYR',
        status: 'success',
        merchant_id: null,
        merchant_name: null,
        recipient_id: 'c-2',
        recipient_name: 'Ahmad',
        rail_used: 'TouchNGo',
        reference: 'REQ-004',
        note: 'Movie tickets',
        trigger: 'request',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      },
      {
        id: 'demo-5',
        user_id: userId,
        intent_id: 'intent-5',
        intent_type: 'PayMerchant',
        amount: 156.80,
        currency: 'MYR',
        status: 'success',
        merchant_id: 'm-2',
        merchant_name: 'Pharmacy',
        recipient_id: null,
        recipient_name: null,
        rail_used: 'GrabPay',
        reference: 'TXN-PHR-005',
        note: null,
        trigger: 'qr_scan',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      },
      {
        id: 'demo-6',
        user_id: userId,
        intent_id: 'intent-6',
        intent_type: 'PayBill',
        amount: 45.00,
        currency: 'MYR',
        status: 'pending',
        merchant_id: 'b-2',
        merchant_name: 'Maxis',
        recipient_id: null,
        recipient_name: null,
        rail_used: null,
        reference: 'BILL-MAX-006',
        note: null,
        trigger: 'scheduled',
        created_at: new Date(now.getTime() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
      },
    ];
  }, []);

  const loadLogs = useCallback(async (showRefresh = false) => {
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

    // Use real data first, fall back to demo data if empty
    if (!error && data && data.length > 0) {
      setLogs(data);
      setIsShowingDemoData(false);
    } else {
      setLogs(getDemoTransactions());
      setIsShowingDemoData(true);
    }

    setIsLoading(false);
    setIsRefreshing(false);
  }, [navigate, getDemoTransactions]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => {
    if (typeFilter !== "all") {
      if (typeFilter === "payments" && log.intent_type !== "PayMerchant") return false;
      if (typeFilter === "transfers" && log.intent_type !== "SendMoney") return false;
      if (typeFilter === "bills" && log.intent_type !== "PayBill") return false;
    }
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    return true;
  });

  const getLogDisplay = useCallback((log: TransactionLog) => {
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
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <div className="px-6 pt-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Activity
          </h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-full transition-all shadow-float ${
                showFilters 
                  ? "aurora-gradient text-white" 
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Filter className="w-5 h-5 mx-auto" />
            </button>
            <button 
              onClick={() => loadLogs(true)}
              disabled={isRefreshing}
              className="w-10 h-10 rounded-full glass-card text-muted-foreground hover:text-foreground transition-colors shadow-float"
            >
              <RefreshCw className={`w-5 h-5 mx-auto ${isRefreshing ? 'animate-spin' : ''}`} />
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
                  {FILTER_BUTTONS.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setTypeFilter(btn.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        typeFilter === btn.key
                          ? "aurora-gradient text-white shadow-glow-blue"
                          : "glass-card text-muted-foreground hover:text-foreground"
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
                  {STATUS_BUTTONS.map(btn => (
                    <button
                      key={btn.key}
                      onClick={() => setStatusFilter(btn.key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        statusFilter === btn.key
                          ? "aurora-gradient text-white shadow-glow-blue"
                          : "glass-card text-muted-foreground hover:text-foreground"
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

      {/* Transaction Count & Demo Indicator */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredLogs.length} transaction{filteredLogs.length !== 1 ? "s" : ""}
            {(typeFilter !== "all" || statusFilter !== "all") && (
              <span className="text-xs ml-1">(filtered)</span>
            )}
          </p>
          {isShowingDemoData && (
            <span className="text-xs px-2 py-1 rounded-full bg-aurora-purple/10 text-aurora-purple font-medium">
              Sample Data
            </span>
          )}
        </div>
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
              className="glass-card rounded-2xl p-4 shadow-float"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl aurora-gradient-soft flex items-center justify-center">
                    <Icon className="w-6 h-6 text-aurora-blue" />
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
              <div className="flex items-center justify-between text-sm border-t border-border/30 pt-3">
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

              {/* Note */}
              {log.note && (
                <div className="mt-3 pt-3 border-t border-border/30">
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
            className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-3xl"
          >
            <div className="w-16 h-16 rounded-full aurora-gradient-soft flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-aurora-purple" />
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
    </div>
  );
};

export default ActivityPage;
