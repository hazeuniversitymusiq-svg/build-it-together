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
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import { WalletBalanceCard } from "@/components/home/WalletBalanceCard";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import { DemoHighlight } from "@/components/demo/DemoHighlight";

// Apple-style Quick Action Button with Liquid Glass
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
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="flex-1 flex flex-col items-center gap-2.5 py-3"
    >
      <div className={`w-14 h-14 rounded-[1.25rem] ${color} flex items-center justify-center shadow-lg`}
        style={{
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.2), inset 0 1px 0 0 rgba(255,255,255,0.3)'
        }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground/80">{label}</span>
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
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col px-5 safe-area-top safe-area-bottom pb-28">
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
          
          {/* Liquid Glass Status Pill */}
          <div className="liquid-pill px-3 py-1.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-medium text-success">Active</span>
          </div>
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

      {/* Apple-style Quick Actions Row - Liquid Glass */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="liquid-glass flex items-center justify-around py-1 mb-4"
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
