import { motion } from "framer-motion";

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

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Now";
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex items-center gap-4 py-4"
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">{transaction.merchant}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{transaction.paymentMethod}</p>
      </div>

      <div className="text-right">
        <p className={`font-medium tabular-nums ${isOutgoing ? "text-foreground" : "text-success"}`}>
          {isOutgoing ? "−" : "+"}
          {transaction.currency}{transaction.amount.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatTime(transaction.timestamp)}</p>
      </div>
    </motion.div>
  );
};

export default TransactionItem;
