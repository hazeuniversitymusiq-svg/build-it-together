/**
 * Bill Reminder Surface - Payment Surface
 * 
 * Displays upcoming bill due dates on HomePage.
 * Creates PayBill intents and hands off to FLOW journey.
 * Never executes payments directly.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Wifi, Phone, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isBefore, differenceInDays } from "date-fns";

interface BillReminder {
  id: string;
  billerName: string;
  accountRef: string;
  dueAmount: number;
  dueDate: Date;
  isUrgent: boolean;
}

const billerIcons: Record<string, React.ReactNode> = {
  Maxis: <Phone className="w-4 h-4" />,
  Unifi: <Wifi className="w-4 h-4" />,
  TNB: <Zap className="w-4 h-4" />,
};

const billerColors: Record<string, string> = {
  Maxis: "bg-green-500",
  Unifi: "bg-orange-500",
  TNB: "bg-yellow-500",
};

interface BillReminderSurfaceProps {
  className?: string;
}

const BillReminderSurface = forwardRef<HTMLDivElement, BillReminderSurfaceProps>(
  ({ className }, ref) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [reminders, setReminders] = useState<BillReminder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [creatingFor, setCreatingFor] = useState<string | null>(null);

    useEffect(() => {
      const loadBillReminders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get linked biller accounts
        const { data: billers } = await supabase
          .from("biller_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "linked");

        if (!billers || billers.length === 0) {
          setIsLoading(false);
          return;
        }

        // Generate sample due dates for prototype
        const now = new Date();
        const billReminders: BillReminder[] = billers.map(biller => {
          const dueDate = addDays(now, Math.floor(Math.random() * 10) + 1);
          const daysUntilDue = differenceInDays(dueDate, now);
          
          return {
            id: biller.id,
            billerName: biller.biller_name,
            accountRef: biller.account_reference,
            dueAmount: Math.floor(Math.random() * 150) + 50,
            dueDate,
            isUrgent: daysUntilDue <= 3,
          };
        });

        // Sort by urgency (urgent first) then by due date
        billReminders.sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });

        setReminders(billReminders);
        setIsLoading(false);
      };

      loadBillReminders();
    }, []);

    const handlePayBill = async (reminder: BillReminder) => {
      setCreatingFor(reminder.id);

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
            amount: reminder.dueAmount,
            currency: "MYR",
            payee_name: reminder.billerName,
            payee_identifier: reminder.accountRef,
            metadata: {
              source: "bill_reminder_surface",
              billerType: reminder.billerName,
              accountRef: reminder.accountRef,
              dueDate: reminder.dueDate.toISOString(),
              railsAvailable: ["DuitNow", "BankTransfer"],
            },
          })
          .select("id")
          .single();

        if (error || !intent) {
          throw new Error("Failed to create bill payment");
        }

        // Hand off to FLOW journey
        navigate(`/resolve/${intent.id}`);
      } catch (error) {
        console.error("Bill payment error:", error);
        toast({
          title: "Error",
          description: "Failed to start bill payment",
          variant: "destructive",
        });
        setCreatingFor(null);
      }
    };

    if (isLoading || reminders.length === 0) {
      return null;
    }

    // Only show the most urgent bill
    const urgentBill = reminders[0];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <div
          className={`p-4 rounded-2xl border ${
            urgentBill.isUrgent
              ? "bg-destructive/5 border-destructive/20"
              : "bg-card border-border"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Biller Icon */}
            <div className={`w-10 h-10 rounded-xl ${billerColors[urgentBill.billerName] || "bg-muted"} flex items-center justify-center text-white`}>
              {billerIcons[urgentBill.billerName] || <Zap className="w-4 h-4" />}
            </div>

            {/* Bill Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{urgentBill.billerName}</p>
                {urgentBill.isUrgent && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Due {format(urgentBill.dueDate, "MMM d")} • RM {urgentBill.dueAmount.toFixed(2)}
              </p>
            </div>

            {/* Pay Button */}
            <Button
              size="sm"
              onClick={() => handlePayBill(urgentBill)}
              disabled={creatingFor === urgentBill.id}
              className="rounded-xl"
            >
              {creatingFor === urgentBill.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Pay
                  <ArrowRight className="w-3 h-3 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* More bills indicator */}
          {reminders.length > 1 && (
            <button
              onClick={() => navigate("/bills")}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              +{reminders.length - 1} more bill{reminders.length > 2 ? "s" : ""} due soon →
            </button>
          )}
        </div>
      </motion.div>
    );
  }
);
BillReminderSurface.displayName = "BillReminderSurface";

export default BillReminderSurface;
