import { motion } from "framer-motion";
import { Store, Send, ArrowUpRight, ArrowDownLeft } from "lucide-react";

export interface Transaction {
  id: string;
  type: "payment" | "transfer_out" | "transfer_in";
  merchant: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
}

interface TransactionItemProps {
  transaction: Transaction;
  index: number;
}

const TransactionItem = ({ transaction, index }: TransactionItemProps) => {
  const isOutgoing = transaction.type !== "transfer_in";
  
  const getIcon = () => {
    switch (transaction.type) {
      case "payment":
        return <Store size={20} />;
      case "transfer_out":
        return <ArrowUpRight size={20} />;
      case "transfer_in":
        return <ArrowDownLeft size={20} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 bg-card rounded-2xl"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        isOutgoing ? "bg-secondary text-foreground" : "bg-success-soft text-success"
      }`}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{transaction.merchant}</p>
        <p className="text-sm text-muted-foreground">{transaction.paymentMethod}</p>
      </div>

      <div className="text-right">
        <p className={`font-semibold ${isOutgoing ? "text-foreground" : "text-success"}`}>
          {isOutgoing ? "-" : "+"}
          {transaction.currency}
          {transaction.amount.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(transaction.timestamp)}</p>
      </div>
    </motion.div>
  );
};

export default TransactionItem;
