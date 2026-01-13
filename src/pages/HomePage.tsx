/**
 * FLOW Home Page
 * 
 * Simplified, clean design - focus on core actions
 * Demo actions registered with Global Demo Intelligence.
 */

import { forwardRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QrCode, Send, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import { WalletBalanceCard } from "@/components/home/WalletBalanceCard";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";


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
  const { toast } = useToast();
  const { registerPageAction, clearPageActions } = useDemo();
  
  useDeepLink();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  // Register demo actions for this page
  useEffect(() => {
    registerPageAction({
      id: 'home-incoming-payment',
      label: 'Simulate Incoming Payment',
      description: 'Receive a payment notification',
      action: async () => {
        const senders = ['Sarah', 'Ahmad', 'Chen Wei', 'Priya'];
        const sender = senders[Math.floor(Math.random() * senders.length)];
        const amount = (Math.floor(Math.random() * 200) + 20).toFixed(2);
        
        toast({
          title: `💸 Payment Received`,
          description: `${sender} sent you RM ${amount}`,
        });
      },
    });

    return () => {
      clearPageActions();
    };
  }, [registerPageAction, clearPageActions, toast]);

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
          
          {/* Simple Active Status Badge */}
          <Badge 
            variant="secondary"
            className="text-xs font-medium flex items-center gap-1.5 glass-card px-3 py-1.5"
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-success">Active</span>
          </Badge>
        </div>
      </motion.div>

      {/* Wallet Balance Card - Primary Focus */}
      <WalletBalanceCard 
        className="mb-4" 
        onLinkWallet={() => navigate("/auto-sync")}
      />

      {/* Primary Actions - 2x2 grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-4"
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
          icon={<QrCode className="w-5 h-5 text-aurora-teal" />}
          label="Receive"
          onClick={() => navigate("/receive")}
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

      {/* Bill Reminder Surface - Only shows if there are upcoming bills */}
      <BillReminderSurface />
    </div>
  );
});
HomePage.displayName = "HomePage";

export default HomePage;
