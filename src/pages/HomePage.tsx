/**
 * FLOW Home Page
 * 
 * Simplified, clean design - focus on core actions
 * Prototype mode - entire app runs in demo context.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Send, ArrowDownLeft, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import { WalletBalanceCard } from "@/components/home/WalletBalanceCard";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useToast } from "@/hooks/use-toast";
import { FlowLogo } from "@/components/brand/FlowLogo";

// Apple-style Minimal Quick Action Button
const QuickAction = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex-1 flex flex-col items-center gap-2 py-3"
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center transition-colors">
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground/70">{label}</span>
    </motion.button>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  useDeepLink();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const simulateIncomingPayment = useCallback(() => {
    const senders = ['Sarah', 'Ahmad', 'Chen Wei', 'Priya'];
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const amount = (Math.floor(Math.random() * 200) + 20).toFixed(2);
    
    toast({
      title: `💸 Payment Received`,
      description: `${sender} sent you RM ${amount}`,
    });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-5 safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-4 pb-2"
      >
        <div className="flex items-center justify-between">
          <FlowLogo variant="full" size="sm" animate={false} />
          
          {/* Liquid Glass Status Pill */}
          <div className="liquid-pill px-3 py-1.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-medium text-success">Active</span>
          </div>
        </div>
      </motion.div>

      {/* Wallet Balance Card - Primary Focus */}
      <WalletBalanceCard 
        className="mb-4" 
        onLinkWallet={() => navigate("/auto-sync")}
      />

      {/* Apple-style Quick Actions Row - Liquid Glass */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="liquid-glass flex items-center justify-around py-1 mb-4"
      >
        <QuickAction
          icon={<Send className="w-5 h-5 text-blue-500" strokeWidth={1.8} />}
          label="Send"
          onClick={() => navigate("/send")}
        />
        
        <QuickAction
          icon={<ArrowDownLeft className="w-5 h-5 text-blue-500" strokeWidth={1.8} />}
          label="Receive"
          onClick={() => navigate("/receive")}
        />
        
        <QuickAction
          icon={<FileText className="w-5 h-5 text-blue-500" strokeWidth={1.8} />}
          label="Bills"
          onClick={() => navigate("/bills")}
        />
      </motion.div>

      {/* Bill Reminder Surface - Only shows if there are upcoming bills */}
      <BillReminderSurface />
    </div>
  );
};

export default HomePage;
