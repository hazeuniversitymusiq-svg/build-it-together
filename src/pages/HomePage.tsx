/**
 * FLOW Home Page
 * 
 * Simplified, clean design - focus on core actions
 * Interactive Demo Layer - tap highlighted elements to learn.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QrCode, Send, Receipt, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import BillReminderSurface from "@/components/surfaces/BillReminderSurface";
import { WalletBalanceCard } from "@/components/home/WalletBalanceCard";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useDemo } from "@/contexts/DemoContext";
import { useToast } from "@/hooks/use-toast";
import { DemoHighlight } from "@/components/demo/DemoHighlight";

// Aurora color variants for action cards
const actionCardStyles = {
  scan: "from-aurora-blue/20 to-aurora-cyan/10 hover:from-aurora-blue/30 hover:to-aurora-cyan/20",
  send: "from-aurora-purple/20 to-aurora-pink/10 hover:from-aurora-purple/30 hover:to-aurora-pink/20",
  request: "from-aurora-teal/20 to-aurora-blue/10 hover:from-aurora-teal/30 hover:to-aurora-blue/20",
  bills: "from-aurora-pink/20 to-aurora-purple/10 hover:from-aurora-pink/30 hover:to-aurora-purple/20",
};

const ActionCard = ({
  icon,
  label,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant: keyof typeof actionCardStyles;
}) => {
  return (
    <motion.button
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

      {/* Primary Actions - 2x2 grid */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-2 gap-3 mb-4"
      >
        <DemoHighlight
          id="scan-action"
          title="Scan to Pay"
          description="Scan any QR code — DuitNow, TnG, GrabPay. FLOW detects the type and routes payment automatically."
          onTryIt={() => !isDemoMode && navigate("/scan")}
          position="bottom"
        >
          <ActionCard
            icon={<QrCode className="w-5 h-5 text-aurora-blue" />}
            label="Scan"
            onClick={() => !isDemoMode && navigate("/scan")}
            variant="scan"
          />
        </DemoHighlight>
        
        <DemoHighlight
          id="send-action"
          title="Send Money"
          description="Send to any contact. FLOW finds their preferred wallet and delivers instantly."
          onTryIt={() => !isDemoMode && navigate("/send")}
          position="bottom"
        >
          <ActionCard
            icon={<Send className="w-5 h-5 text-aurora-purple" />}
            label="Send"
            onClick={() => !isDemoMode && navigate("/send")}
            variant="send"
          />
        </DemoHighlight>
        
        <DemoHighlight
          id="receive-action"
          title="Receive Money"
          description="Generate a QR code for others to pay you. Works with any wallet or bank app."
          onTryIt={() => !isDemoMode && navigate("/receive")}
          position="top"
        >
          <ActionCard
            icon={<QrCode className="w-5 h-5 text-aurora-teal" />}
            label="Receive"
            onClick={() => !isDemoMode && navigate("/receive")}
            variant="request"
          />
        </DemoHighlight>
        
        <DemoHighlight
          id="bills-action"
          title="Pay Bills"
          description="Link billers like TNB, Unifi, Maxis. FLOW reminds you before due dates."
          onTryIt={() => !isDemoMode && navigate("/bills")}
          position="top"
        >
          <ActionCard
            icon={<Receipt className="w-5 h-5 text-aurora-pink" />}
            label="Bills"
            onClick={() => !isDemoMode && navigate("/bills")}
            variant="bills"
          />
        </DemoHighlight>
      </motion.div>

      {/* Bill Reminder Surface - Only shows if there are upcoming bills */}
      <BillReminderSurface />
    </div>
  );
};

export default HomePage;
