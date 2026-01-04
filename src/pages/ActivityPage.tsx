import { useState } from "react";
import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import TransactionItem, { Transaction } from "@/components/activity/TransactionItem";
import { Filter } from "lucide-react";

const ActivityPage = () => {
  const [filter, setFilter] = useState<"all" | "payments" | "transfers">("all");

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

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "payments") return t.type === "payment";
    return t.type === "transfer_in" || t.type === "transfer_out";
  });

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "payments", label: "Payments" },
    { key: "transfers", label: "Transfers" },
  ] as const;

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full safe-area-top">
        {/* Header */}
        <header className="px-6 pt-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity</h1>
              <p className="text-sm text-muted-foreground">Your recent transactions</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === option.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {/* Transactions List */}
        <div className="flex-1 px-6 pb-6">
          <div className="space-y-3">
            {filteredTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                index={index}
              />
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                <Filter size={24} className="text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No transactions found</p>
            </motion.div>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default ActivityPage;
