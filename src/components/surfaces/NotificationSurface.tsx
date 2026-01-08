/**
 * Notification Surface - Payment Surface
 * 
 * Displays payment-related notifications.
 * Creates intents when user acts on notifications.
 * Hands off to FLOW journey - never executes directly.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  X, 
  ArrowRight, 
  HandCoins, 
  AlertCircle,
  Clock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface PaymentNotification {
  id: string;
  type: "payment_request" | "bill_due" | "payment_reminder";
  title: string;
  message: string;
  amount?: number;
  payee?: string;
  payeeIdentifier?: string;
  intentType: "SendMoney" | "PayBill" | "PayMerchant";
  metadata?: Record<string, unknown>;
  createdAt: Date;
  isRead: boolean;
}

interface NotificationSurfaceProps {
  className?: string;
  onNotificationCount?: (count: number) => void;
}

const NotificationSurface = forwardRef<HTMLDivElement, NotificationSurfaceProps>(
  ({ className, onNotificationCount }, ref) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [actingOn, setActingOn] = useState<string | null>(null);

    useEffect(() => {
      const loadNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // For prototype, generate sample notifications based on data
        const sampleNotifications: PaymentNotification[] = [];

        // Check for payment requests (RequestMoney intents where user is the payer)
        const { data: requests } = await supabase
          .from("intents")
          .select("*")
          .eq("type", "RequestMoney")
          .order("created_at", { ascending: false })
          .limit(3);

        requests?.forEach(req => {
          sampleNotifications.push({
            id: `req-${req.id}`,
            type: "payment_request",
            title: "Payment Request",
            message: `${req.payee_name} requested RM ${req.amount.toFixed(2)}`,
            amount: req.amount,
            payee: req.payee_name,
            payeeIdentifier: req.payee_identifier,
            intentType: "SendMoney",
            metadata: { originalIntentId: req.id },
            createdAt: new Date(req.created_at),
            isRead: false,
          });
        });

        // Check for bill reminders
        const { data: billers } = await supabase
          .from("biller_accounts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "linked")
          .limit(2);

        billers?.forEach(biller => {
          const dueAmount = Math.floor(Math.random() * 100) + 50;
          sampleNotifications.push({
            id: `bill-${biller.id}`,
            type: "bill_due",
            title: "Bill Due Soon",
            message: `Your ${biller.biller_name} bill of RM ${dueAmount.toFixed(2)} is due in 3 days`,
            amount: dueAmount,
            payee: biller.biller_name,
            payeeIdentifier: biller.account_reference,
            intentType: "PayBill",
            metadata: { billerType: biller.biller_name },
            createdAt: new Date(),
            isRead: false,
          });
        });

        setNotifications(sampleNotifications);
        onNotificationCount?.(sampleNotifications.filter(n => !n.isRead).length);
      };

      loadNotifications();
    }, [onNotificationCount]);

    const handleActOnNotification = async (notification: PaymentNotification) => {
      setActingOn(notification.id);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        // Create intent based on notification type
        const { data: intent, error } = await supabase
          .from("intents")
          .insert({
            user_id: user.id,
            type: notification.intentType,
            amount: notification.amount || 0,
            currency: "MYR",
            payee_name: notification.payee || "",
            payee_identifier: notification.payeeIdentifier || "",
            metadata: {
              source: "notification_surface",
              notificationType: notification.type,
              ...notification.metadata,
            },
          })
          .select("id")
          .single();

        if (error || !intent) {
          throw new Error("Failed to create payment");
        }

        // Mark as read
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );

        // Hand off to FLOW journey
        navigate(`/resolve/${intent.id}`);
      } catch (error) {
        console.error("Notification action error:", error);
        toast({
          title: "Error",
          description: "Failed to start payment",
          variant: "destructive",
        });
        setActingOn(null);
      }
    };

    const handleDismiss = (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (notifications.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={className}>
        {/* Notification Bell with Badge */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>

        {/* Notification Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-14 right-0 w-80 max-h-96 overflow-y-auto bg-card border border-border rounded-2xl shadow-lg z-50"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>

              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 ${notification.isRead ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === "payment_request"
                          ? "bg-primary/10 text-primary"
                          : notification.type === "bill_due"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {notification.type === "payment_request" ? (
                          <HandCoins className="w-4 h-4" />
                        ) : notification.type === "bill_due" ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleActOnNotification(notification)}
                            disabled={actingOn === notification.id}
                            className="h-7 text-xs rounded-lg"
                          >
                            {actingOn === notification.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                Pay
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(notification.id)}
                            className="h-7 text-xs rounded-lg"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
NotificationSurface.displayName = "NotificationSurface";

export default NotificationSurface;
