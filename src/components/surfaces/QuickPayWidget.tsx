/**
 * Quick Pay Widget - Payment Surface
 * 
 * Displays frequent contacts and merchants for quick access.
 * Creates intents and hands off to FLOW journey.
 * Never executes payments directly.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Send, Store, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickPayItem {
  id: string;
  name: string;
  type: "contact" | "merchant";
  identifier: string;
  lastAmount?: number;
  initial: string;
}

interface FrequencyData {
  count: number;
  lastAmount?: number;
  type: "contact" | "merchant";
  name: string;
  identifier: string;
}

interface QuickPayWidgetProps {
  className?: string;
}

const QuickPayWidget = forwardRef<HTMLDivElement, QuickPayWidgetProps>(
  ({ className }, ref) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [items, setItems] = useState<QuickPayItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [creatingFor, setCreatingFor] = useState<string | null>(null);

    useEffect(() => {
      const loadFrequentItems = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get recent transaction logs to find frequent payees
        const { data: recentTx } = await supabase
          .from("transaction_logs")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(20);

        // Count frequency per payee
        const frequency: Record<string, FrequencyData> = {};
        
        recentTx?.forEach(tx => {
          const key = tx.merchant_name || tx.recipient_name || "";
          if (!key) return;
          
          if (!frequency[key]) {
            frequency[key] = {
              count: 0,
              lastAmount: tx.amount,
              type: tx.intent_type === "SendMoney" ? "contact" : "merchant",
              name: key,
              identifier: tx.merchant_id || tx.recipient_id || key,
            };
          }
          frequency[key].count++;
        });

        // Sort by frequency and take top 4
        const sorted = Object.entries(frequency)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 4)
          .map(([name, data]) => ({
            id: data.identifier,
            name: data.name,
            type: data.type,
            identifier: data.identifier,
            lastAmount: data.lastAmount,
            initial: name.charAt(0).toUpperCase(),
          }));

        // If we have less than 4 frequent items, add sample contacts
        if (sorted.length < 4) {
          const { data: contacts } = await supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .limit(4 - sorted.length);

          contacts?.forEach(c => {
            if (!sorted.find(s => s.name === c.name)) {
              sorted.push({
                id: c.id,
                name: c.name,
                type: "contact",
                identifier: c.phone,
                lastAmount: undefined,
                initial: c.name.charAt(0).toUpperCase(),
              });
            }
          });
        }

        setItems(sorted);
        setIsLoading(false);
      };

      loadFrequentItems();
    }, []);

    const handleQuickPay = async (item: QuickPayItem) => {
      // For contacts without last amount, navigate to send page
      if (item.type === "contact" && !item.lastAmount) {
        navigate("/send");
        return;
      }

      setCreatingFor(item.id);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Create intent based on type
        const intentType = item.type === "contact" ? "SendMoney" : "PayMerchant";
        const amount = item.lastAmount || 0;

        const { data: intent, error } = await supabase
          .from("intents")
          .insert({
            user_id: user.id,
            type: intentType,
            amount,
            currency: "MYR",
            payee_name: item.name,
            payee_identifier: item.identifier,
            metadata: {
              source: "quick_pay_widget",
              railsAvailable: ["TouchNGo", "GrabPay", "DuitNow"],
            },
          })
          .select("id")
          .single();

        if (error || !intent) {
          throw new Error("Failed to create intent");
        }

        // Hand off to FLOW journey
        navigate(`/resolve/${intent.id}`);
      } catch (error) {
        console.error("Quick pay error:", error);
        toast({
          title: "Error",
          description: "Failed to start payment",
          variant: "destructive",
        });
        setCreatingFor(null);
      }
    };

    if (isLoading || items.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={className}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Pay</h3>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleQuickPay(item)}
              disabled={creatingFor === item.id}
              className="flex flex-col items-center gap-2 min-w-[72px]"
            >
              <div className={`relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                creatingFor === item.id
                  ? "bg-primary/20"
                  : item.type === "contact"
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}>
                {creatingFor === item.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <>
                    {item.initial}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      item.type === "contact" ? "bg-primary" : "bg-secondary-foreground"
                    }`}>
                      {item.type === "contact" ? (
                        <Send className="w-2.5 h-2.5 text-primary-foreground" />
                      ) : (
                        <Store className="w-2.5 h-2.5 text-secondary" />
                      )}
                    </div>
                  </>
                )}
              </div>
              <span className="text-xs text-foreground truncate max-w-[72px]">
                {item.name}
              </span>
              {item.lastAmount && (
                <span className="text-[10px] text-muted-foreground">
                  RM {item.lastAmount.toFixed(0)}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
);
QuickPayWidget.displayName = "QuickPayWidget";

export default QuickPayWidget;
