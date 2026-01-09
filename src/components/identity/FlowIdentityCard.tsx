/**
 * Flow Identity Card
 * 
 * A premium glass card showing the user's verified Flow identity status.
 * Tappable to reveal all linked wallets, banks, and cards.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Wallet, 
  Landmark, 
  CreditCard, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

interface Connection {
  id: string;
  name: string;
  type: "wallet" | "bank" | "card" | "biller" | "contacts";
  status: "available" | "unavailable" | "degraded";
  balance?: number;
}

interface FlowIdentityCardProps {
  className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  wallet: <Wallet className="w-5 h-5" />,
  bank: <Landmark className="w-5 h-5" />,
  card: <CreditCard className="w-5 h-5" />,
  biller: <CreditCard className="w-5 h-5" />,
  contacts: <ShieldCheck className="w-5 h-5" />,
};

const typeColors: Record<string, string> = {
  wallet: "bg-aurora-blue/20 text-aurora-blue",
  bank: "bg-aurora-purple/20 text-aurora-purple",
  card: "bg-aurora-teal/20 text-aurora-teal",
  biller: "bg-aurora-pink/20 text-aurora-pink",
  contacts: "bg-muted text-muted-foreground",
};

const FlowIdentityCard = forwardRef<HTMLDivElement, FlowIdentityCardProps>(
  ({ className = "" }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadConnections = async () => {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch connectors
      const { data: connectors } = await supabase
        .from("connectors")
        .select("id, name, type, status")
        .eq("user_id", user.id)
        .in("type", ["wallet", "bank", "card"]);

      // Fetch funding sources for balances
      const { data: fundingSources } = await supabase
        .from("funding_sources")
        .select("name, balance")
        .eq("user_id", user.id);

      const balanceMap = new Map(
        fundingSources?.map(fs => [fs.name, fs.balance]) || []
      );

      const mapped: Connection[] = (connectors || []).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type as Connection["type"],
        status: c.status as Connection["status"],
        balance: balanceMap.get(c.name),
      }));

      setConnections(mapped);
      setIsLoading(false);
    };

    useEffect(() => {
      if (isOpen) {
        loadConnections();
      }
    }, [isOpen]);

    const connectedCount = connections.filter(c => c.status === "available").length;

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            {/* Identity Card Visual - Now Tappable */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              className="relative mx-auto w-64 aspect-[1.6/1] rounded-2xl overflow-hidden shadow-float cursor-pointer block"
              style={{
                background: "linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 20% 18%) 50%, hsl(210 80% 35%) 100%)",
              }}
            >
              {/* Subtle gradient overlay */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  background: "radial-gradient(ellipse at 70% 80%, hsl(210 80% 45% / 0.6) 0%, transparent 60%)",
                }}
              />
              
              {/* Card Content */}
              <div className="relative h-full p-5 flex flex-col justify-between text-left">
                {/* Header */}
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-2">
                    Flow Identity
                  </p>
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-white/80" />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm text-white/80">Active</span>
                    </div>
                    <p className="text-lg font-bold text-white tracking-tight">FLOW</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
              </div>
            </motion.button>
          </SheetTrigger>

          <SheetContent side="bottom" className="rounded-t-3xl h-[70vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl aurora-gradient flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Flow Identity</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {connectedCount} connections active
                  </p>
                </div>
              </SheetTitle>
            </SheetHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto pb-8">
                {/* Wallets */}
                {connections.filter(c => c.type === "wallet").length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Wallets
                    </p>
                    <div className="space-y-2">
                      {connections.filter(c => c.type === "wallet").map(conn => (
                        <ConnectionRow key={conn.id} connection={conn} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Banks */}
                {connections.filter(c => c.type === "bank").length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Landmark className="w-4 h-4" />
                      Banks
                    </p>
                    <div className="space-y-2">
                      {connections.filter(c => c.type === "bank").map(conn => (
                        <ConnectionRow key={conn.id} connection={conn} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Cards */}
                {connections.filter(c => c.type === "card").length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Cards
                    </p>
                    <div className="space-y-2">
                      {connections.filter(c => c.type === "card").map(conn => (
                        <ConnectionRow key={conn.id} connection={conn} />
                      ))}
                    </div>
                  </div>
                )}

                {connections.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">No connections yet</p>
                    <p className="text-sm text-muted-foreground">
                      Complete onboarding to link your wallets
                    </p>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          This is not a payment card.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Flow always asks before any payment.
        </p>
      </motion.div>
    );
  }
);

FlowIdentityCard.displayName = "FlowIdentityCard";

// Connection Row Component
const ConnectionRow = ({ connection }: { connection: Connection }) => {
  const isAvailable = connection.status === "available";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 rounded-2xl glass-card"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeColors[connection.type]}`}>
          {typeIcons[connection.type]}
        </div>
        <div>
          <p className="font-medium text-foreground">{connection.name}</p>
          {connection.balance !== undefined && (
            <p className="text-sm text-muted-foreground">
              RM {connection.balance.toFixed(2)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAvailable ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <XCircle className="w-5 h-5 text-destructive" />
        )}
      </div>
    </motion.div>
  );
};

export default FlowIdentityCard;
