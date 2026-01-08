/**
 * FLOW Bills Page - Screen 11
 * 
 * Shows linked billers, allows linking new ones, creates PayBill intents.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft,
  Loader2,
  Zap,
  Wifi,
  Phone,
  Link as LinkIcon,
  Calendar,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type BillerAccount = Database['public']['Tables']['biller_accounts']['Row'];

interface BillerInfo {
  name: "Maxis" | "Unifi" | "TNB";
  icon: React.ReactNode;
  color: string;
  dueAmount?: number;
  dueDate?: Date;
  accountRef?: string;
  isLinked: boolean;
}

const billerConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  Maxis: { icon: <Phone className="w-6 h-6" />, color: "bg-green-500" },
  Unifi: { icon: <Wifi className="w-6 h-6" />, color: "bg-orange-500" },
  TNB: { icon: <Zap className="w-6 h-6" />, color: "bg-yellow-500" },
};

const BillsPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [billers, setBillers] = useState<BillerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingBiller, setLinkingBiller] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState<string | null>(null);

  // Load biller accounts
  useEffect(() => {
    const loadBillers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch linked biller accounts
      const { data: linkedBillers } = await supabase
        .from("biller_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "linked");

      // Build biller list with linked status
      const billerNames: Array<"Maxis" | "Unifi" | "TNB"> = ["Maxis", "Unifi", "TNB"];
      const billerList: BillerInfo[] = billerNames.map(name => {
        const linked = linkedBillers?.find(b => b.biller_name === name);
        const config = billerConfig[name];
        
        // Generate sample due amounts/dates for prototype
        const sampleDue = linked ? {
          dueAmount: Math.floor(Math.random() * 150) + 50,
          dueDate: addDays(new Date(), Math.floor(Math.random() * 14) + 1),
        } : {};

        return {
          name,
          icon: config.icon,
          color: config.color,
          isLinked: !!linked,
          accountRef: linked?.account_reference,
          ...sampleDue,
        };
      });

      setBillers(billerList);
      setIsLoading(false);
    };

    loadBillers();
  }, [navigate]);

  const handleLinkBiller = async (billerName: string) => {
    if (!accountNumber.trim()) {
      toast({
        title: "Missing account number",
        description: "Please enter your account number or reference",
        variant: "destructive",
      });
      return;
    }

    setIsLinking(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create biller account
      await supabase.from("biller_accounts").insert({
        user_id: user.id,
        biller_name: billerName,
        account_reference: accountNumber,
        status: "linked",
      });

      // Update local state
      setBillers(prev => prev.map(b => 
        b.name === billerName 
          ? { 
              ...b, 
              isLinked: true, 
              accountRef: accountNumber,
              dueAmount: Math.floor(Math.random() * 150) + 50,
              dueDate: addDays(new Date(), Math.floor(Math.random() * 14) + 1),
            } 
          : b
      ));

      setLinkingBiller(null);
      setAccountNumber("");

      toast({
        title: "Biller linked",
        description: `${billerName} account has been linked`,
      });
    } catch (error) {
      console.error("Error linking biller:", error);
      toast({
        title: "Failed to link",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handlePayNow = async (biller: BillerInfo) => {
    if (!biller.dueAmount) return;

    setIsCreatingIntent(biller.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Create PayBill intent
      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: user.id,
          type: "PayBill",
          amount: biller.dueAmount,
          currency: "MYR",
          payee_name: biller.name,
          payee_identifier: biller.accountRef || "",
          metadata: {
            billerType: biller.name,
            accountRef: biller.accountRef,
            railsAvailable: ["DuitNow", "BankTransfer"],
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create bill payment");
      }

      // Navigate to resolve screen
      navigate(`/resolve/${intent.id}`);
    } catch (error) {
      console.error("Error creating intent:", error);
      toast({
        title: "Error",
        description: "Failed to create bill payment",
        variant: "destructive",
      });
      setIsCreatingIntent(null);
    }
  };

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
      <div className="px-6 pt-16 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Bills
          </h1>
        </div>
      </div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 pb-6 text-muted-foreground"
      >
        FLOW can link your billers and pay in one flow.
      </motion.p>

      {/* Billers List */}
      <div className="flex-1 px-6 space-y-4">
        {billers.map((biller, index) => (
          <motion.div
            key={biller.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            {/* Biller Header */}
            <div className="flex items-center gap-4 p-4">
              <div className={`w-12 h-12 rounded-xl ${biller.color} flex items-center justify-center text-white`}>
                {biller.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{biller.name}</p>
                {biller.isLinked && biller.accountRef && (
                  <p className="text-sm text-muted-foreground">Acc: {biller.accountRef}</p>
                )}
              </div>
              {biller.isLinked && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Due</p>
                  <p className="font-semibold text-foreground">
                    RM {biller.dueAmount?.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {biller.isLinked ? (
                <motion.div
                  key="linked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-4"
                >
                  {/* Due Date */}
                  {biller.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>Due on {format(biller.dueDate, "MMM d, yyyy")}</span>
                    </div>
                  )}
                  
                  {/* Pay Now Button */}
                  <Button
                    onClick={() => handlePayNow(biller)}
                    disabled={isCreatingIntent === biller.name}
                    className="w-full rounded-xl"
                  >
                    {isCreatingIntent === biller.name ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Pay now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : linkingBiller === biller.name ? (
                <motion.div
                  key="linking"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 pb-4"
                >
                  <Input
                    type="text"
                    placeholder="Account number or reference"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="mb-3 h-12 rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLinkingBiller(null);
                        setAccountNumber("");
                      }}
                      className="flex-1 rounded-xl"
                      disabled={isLinking}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleLinkBiller(biller.name)}
                      disabled={isLinking}
                      className="flex-1 rounded-xl"
                    >
                      {isLinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Link biller
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="unlinked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 pb-4"
                >
                  <Button
                    variant="outline"
                    onClick={() => setLinkingBiller(biller.name)}
                    className="w-full rounded-xl"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Link biller
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
});
BillsPage.displayName = "BillsPage";

export default BillsPage;
