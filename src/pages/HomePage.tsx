import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QrCode, Send, Receipt, Clock, HandCoins, Smartphone, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import QuickPayWidget from "@/components/surfaces/QuickPayWidget";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import NotificationSurface from "@/components/surfaces/NotificationSurface";
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

const ActionCard = forwardRef<HTMLButtonElement, {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  delay: number;
}>((props, ref) => {
  const { icon, label, onClick, delay } = props;
  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:bg-accent/5 transition-all"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
  const [appMode, setAppMode] = useState("Prototype");
  const [notificationCount, setNotificationCount] = useState(0);
  const { isFieldTest } = useTestMode();
  
  // Initialize deep link handler
  useDeepLink();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user mode
      const { data: userData } = await supabase
        .from("users")
        .select("app_mode")
        .eq("id", user.id)
        .single();

      if (userData) {
        setAppMode(userData.app_mode);
      }

      // Get recent transactions
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
    <div ref={ref} className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-16 pb-2"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Home
          </h1>
          <div className="flex items-center gap-2">
            <NotificationSurface 
              onNotificationCount={setNotificationCount} 
            />
            <Badge 
              variant={isFieldTest ? "default" : "secondary"} 
              className={`text-xs font-medium flex items-center gap-1 ${
                isFieldTest ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {isFieldTest ? (
                <Smartphone className="w-3 h-3" />
              ) : (
                <FlaskConical className="w-3 h-3" />
              )}
              {isFieldTest ? "Field Test" : "Prototype"}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Greeting */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-muted-foreground mb-8"
      >
        Good to see you.
      </motion.p>

      {/* Primary Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <ActionCard
          icon={<QrCode className="w-6 h-6" />}
          label="Scan"
          onClick={() => navigate("/scan")}
          delay={0.2}
        />
        <ActionCard
          icon={<Send className="w-6 h-6" />}
          label="Send"
          onClick={() => navigate("/send")}
          delay={0.3}
        />
        <ActionCard
          icon={<HandCoins className="w-6 h-6" />}
          label="Request"
          onClick={() => navigate("/request")}
          delay={0.35}
        />
        <ActionCard
          icon={<Receipt className="w-6 h-6" />}
          label="Bills"
          onClick={() => navigate("/bills")}
          delay={0.4}
        />
      </div>

      {/* Quick Pay Surface */}
      <QuickPayWidget className="mb-6" />

      {/* Bill Reminder Surface */}
      <BillReminderSurface className="mb-6" />

      {/* Recent Activity Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex-1"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent activity
        </h2>

        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-1">No activity yet.</p>
            <p className="text-sm text-muted-foreground">
              Your first payment will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.status === "success" 
                      ? "bg-success/10 text-success"
                      : tx.status === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {tx.intent_type === "PayMerchant" ? (
                      <QrCode className="w-5 h-5" />
                    ) : tx.intent_type === "SendMoney" ? (
                      <Send className="w-5 h-5" />
                    ) : (
                      <Receipt className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {tx.merchant_name || tx.recipient_name || "Payment"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(tx.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
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
