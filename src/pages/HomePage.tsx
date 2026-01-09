/**
 * FLOW Home Page
 * 
 * iOS 26 Liquid Glass design - frosted cards, aurora accents, floating shadows
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QrCode, Send, Receipt, Clock, HandCoins, Smartphone, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import QuickPayWidget from "@/components/surfaces/QuickPayWidget";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import NotificationSurface from "@/components/surfaces/NotificationSurface";
import FlowIdentityCard from "@/components/identity/FlowIdentityCard";
import { QuickBalanceSync } from "@/components/balance/QuickBalanceSync";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useTestMode } from "@/hooks/useTestMode";

interface Transaction {
  id: string;
  merchant_name: string | null;
  recipient_name: string | null;
  amount: number;
  status: string;
  intent_type: string;
  created_at: string;
}

// Aurora color variants for action cards
const actionCardStyles = {
  scan: "from-aurora-blue/20 to-aurora-cyan/10 hover:from-aurora-blue/30 hover:to-aurora-cyan/20",
  send: "from-aurora-purple/20 to-aurora-pink/10 hover:from-aurora-purple/30 hover:to-aurora-pink/20",
  request: "from-aurora-teal/20 to-aurora-blue/10 hover:from-aurora-teal/30 hover:to-aurora-blue/20",
  bills: "from-aurora-pink/20 to-aurora-purple/10 hover:from-aurora-pink/30 hover:to-aurora-purple/20",
};

const ActionCard = forwardRef<HTMLButtonElement, {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  delay: number;
  variant: keyof typeof actionCardStyles;
}>((props, ref) => {
  const { icon, label, onClick, delay, variant } = props;
  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-gradient-to-br ${actionCardStyles[variant]} glass-card shadow-float transition-all duration-300`}
    >
      <div className="w-11 h-11 rounded-2xl bg-white/80 dark:bg-white/10 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.button>
  );
});
ActionCard.displayName = "ActionCard";

const HomePage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [recentActivity, setRecentActivity] = useState<Transaction[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { isFieldTest } = useTestMode();
  
  useDeepLink();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: transactions } = await supabase
        .from("transaction_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (transactions) {
        setRecentActivity(transactions);
      }
    };

    loadData();
  }, [navigate]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-14 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground text-sm"
            >
              Good to see you
            </motion.p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              FLOW
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationSurface 
              onNotificationCount={setNotificationCount} 
            />
            <Badge 
              variant="secondary"
              className={`text-xs font-medium flex items-center gap-1.5 glass-card px-3 py-1.5 ${
                isFieldTest ? "text-aurora-blue" : "text-muted-foreground"
              }`}
            >
              {isFieldTest ? (
                <Smartphone className="w-3 h-3" />
              ) : (
                <FlaskConical className="w-3 h-3" />
              )}
              {isFieldTest ? "Field" : "Proto"}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Flow Identity Card */}
      <FlowIdentityCard className="mb-6" />

      {/* Primary Actions - 2x2 grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mt-6 mb-6"
      >
        <ActionCard
          icon={<QrCode className="w-5 h-5 text-aurora-blue" />}
          label="Scan"
          onClick={() => navigate("/scan")}
          delay={0.2}
          variant="scan"
        />
        <ActionCard
          icon={<Send className="w-5 h-5 text-aurora-purple" />}
          label="Send"
          onClick={() => navigate("/send")}
          delay={0.25}
          variant="send"
        />
        <ActionCard
          icon={<HandCoins className="w-5 h-5 text-aurora-teal" />}
          label="Request"
          onClick={() => navigate("/request")}
          delay={0.3}
          variant="request"
        />
        <ActionCard
          icon={<Receipt className="w-5 h-5 text-aurora-pink" />}
          label="Bills"
          onClick={() => navigate("/bills")}
          delay={0.35}
          variant="bills"
        />
      </motion.div>

      {/* Quick Balance Sync - FLOW Protocol Layer 2 */}
      <QuickBalanceSync className="mb-4" />

      {/* Quick Pay Surface */}
      <QuickPayWidget className="mb-4" />

      {/* Bill Reminder Surface */}
      <BillReminderSurface className="mb-6" />

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex-1"
      >
        <h2 className="text-base font-semibold text-foreground mb-4">
          Recent
        </h2>

        {recentActivity.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-3xl"
          >
            <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Your payments will appear here
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.45 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-2xl glass-card shadow-float"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.status === "success" 
                      ? "bg-success/10"
                      : tx.status === "failed"
                      ? "bg-destructive/10"
                      : "bg-muted/50"
                  }`}>
                    {tx.intent_type === "PayMerchant" ? (
                      <QrCode className={`w-5 h-5 ${
                        tx.status === "success" ? "text-success" : 
                        tx.status === "failed" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                    ) : tx.intent_type === "SendMoney" ? (
                      <Send className={`w-5 h-5 ${
                        tx.status === "success" ? "text-success" : 
                        tx.status === "failed" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                    ) : (
                      <Receipt className={`w-5 h-5 ${
                        tx.status === "success" ? "text-success" : 
                        tx.status === "failed" ? "text-destructive" : "text-muted-foreground"
                      }`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {tx.merchant_name || tx.recipient_name || "Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    RM {tx.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs capitalize ${
                    tx.status === "success" 
                      ? "text-success"
                      : tx.status === "failed"
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}>
                    {tx.status}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
});
HomePage.displayName = "HomePage";

export default HomePage;
