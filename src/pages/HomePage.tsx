/**
 * FLOW Home Page
 * 
 * Simplified, clean design - focus on core actions
 * Interactive Demo Layer - tap highlighted elements to learn.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Send, ArrowDownLeft, Receipt, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import { WalletBalanceCard } from "@/components/home/WalletBalanceCard";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import { DemoHighlight } from "@/components/demo/DemoHighlight";

// Apple-style Quick Action Button
const QuickAction = ({
  icon,
  label,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: string;
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="flex-1 flex flex-col items-center gap-2 py-4"
    >
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm`}>
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </motion.button>
  );
};

const HomePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDemoMode } = useDemo();
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
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-4 pb-2"
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
      <DemoHighlight
        id="wallet-balance"
        title="Wallet Balance"
        description="Your unified balance across all linked wallets. FLOW syncs automatically from TnG, GrabPay, and bank accounts."
        onTryIt={simulateIncomingPayment}
        position="bottom"
      >
        <WalletBalanceCard 
          className="mb-4" 
          onLinkWallet={() => !isDemoMode && navigate("/auto-sync")}
        />
      </DemoHighlight>

      {/* Apple-style Quick Actions Row */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-card flex items-center justify-around py-2 mb-4"
      >
        <DemoHighlight
          id="send-action"
          title="Send Money"
          description="Send to any contact. FLOW finds their preferred wallet and delivers instantly."
          onTryIt={() => !isDemoMode && navigate("/send")}
          position="bottom"
        >
          <QuickAction
            icon={<Send className="w-6 h-6 text-white" />}
            label="Send"
            onClick={() => !isDemoMode && navigate("/send")}
            color="bg-gradient-to-br from-aurora-purple to-aurora-pink"
          />
        </DemoHighlight>
        
        <DemoHighlight
          id="receive-action"
          title="Receive Money"
          description="Generate a QR code for others to pay you. Works with any wallet or bank app."
          onTryIt={() => !isDemoMode && navigate("/receive")}
          position="bottom"
        >
          <QuickAction
            icon={<ArrowDownLeft className="w-6 h-6 text-white" />}
            label="Receive"
            onClick={() => !isDemoMode && navigate("/receive")}
            color="bg-gradient-to-br from-aurora-teal to-aurora-blue"
          />
        </DemoHighlight>
        
        <DemoHighlight
          id="bills-action"
          title="Pay Bills"
          description="Link billers like TNB, Unifi, Maxis. FLOW reminds you before due dates."
          onTryIt={() => !isDemoMode && navigate("/bills")}
          position="bottom"
        >
          <QuickAction
            icon={<Receipt className="w-6 h-6 text-white" />}
            label="Bills"
            onClick={() => !isDemoMode && navigate("/bills")}
            color="bg-gradient-to-br from-aurora-pink to-aurora-purple"
          />
        </DemoHighlight>
      </motion.div>

      {/* Bill Reminder Surface - Only shows if there are upcoming bills */}
      <BillReminderSurface />
    </div>
  );
};

export default HomePage;
