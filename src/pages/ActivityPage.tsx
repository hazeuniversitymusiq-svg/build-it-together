import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import TransactionItem, { Transaction } from "@/components/activity/TransactionItem";

const ActivityPage = () => {
  const transactions: Transaction[] = [
    {
      id: "1",
      type: "payment",
      merchant: "Starbucks KLCC",
      amount: 18.90,
      currency: "RM",
      paymentMethod: "Touch 'n Go",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: "completed",
    },
    {
      id: "2",
      type: "transfer_out",
      merchant: "Sarah L.",
      amount: 50.00,
      currency: "RM",
      paymentMethod: "DuitNow",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      status: "completed",
    },
    {
      id: "3",
      type: "payment",
      merchant: "Grab Ride",
      amount: 12.50,
      currency: "RM",
      paymentMethod: "GrabPay",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      status: "completed",
    },
    {
      id: "4",
      type: "transfer_in",
      merchant: "Ahmad R.",
      amount: 100.00,
      currency: "RM",
      paymentMethod: "DuitNow",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      status: "completed",
    },
    {
      id: "5",
      type: "payment",
      merchant: "Village Grocer",
      amount: 87.40,
      currency: "RM",
      paymentMethod: "Touch 'n Go",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      status: "completed",
    },
  ];

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full">
        {/* Minimal Header */}
        <header className="px-6 pt-8 pb-6 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Activity</h1>
        </header>

        {/* Transactions - Clean list, no filters cluttering the view */}
        <div className="flex-1 px-6 pb-6">
          <div className="divide-y divide-border/50">
            {transactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
          </div>

          {transactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-20"
            >
              <p className="text-muted-foreground">No activity yet</p>
            </motion.div>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default ActivityPage;
