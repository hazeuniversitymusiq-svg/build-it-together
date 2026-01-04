import { useState } from "react";
import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import { Delete } from "lucide-react";

const SendPage = () => {
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const recentContacts = [
    { id: "1", name: "Sarah", initial: "S" },
    { id: "2", name: "Ahmad", initial: "A" },
    { id: "3", name: "Wei Ming", initial: "W" },
  ];

  const handleNumberPress = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.includes(".") && amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const displayAmount = amount || "0";

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full">
        {/* Minimal Header */}
        <header className="px-6 pt-8 pb-4 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Send</h1>
        </header>

        {/* Recent Contacts - Simple, no labels */}
        <div className="px-6 py-4">
          <div className="flex gap-5">
            {recentContacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact.id)}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ 
                    scale: selectedContact === contact.id ? 1.05 : 1,
                    opacity: selectedContact === contact.id ? 1 : 0.6
                  }}
                  className={`w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium text-lg ${
                    selectedContact === contact.id ? "ring-2 ring-foreground" : ""
                  }`}
                >
                  {contact.initial}
                </motion.div>
                <span className={`text-xs mt-2 transition-opacity ${
                  selectedContact === contact.id ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {contact.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Display - Single Focus */}
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.p
            key={amount}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
            className="text-5xl font-semibold text-foreground tabular-nums"
          >
            RM{displayAmount}
          </motion.p>
        </div>

        {/* Keypad - Clean, minimal */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-3 gap-1 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPress(num)}
                className="h-16 text-2xl font-medium text-foreground active:text-muted-foreground transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-16 flex items-center justify-center text-muted-foreground active:text-foreground transition-colors"
            >
              <Delete size={24} />
            </button>
          </div>

          {/* Send Button - Confident action */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!amount || !selectedContact}
            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-medium text-lg disabled:opacity-30 transition-opacity"
          >
            Send
          </motion.button>
        </div>
      </div>
    </MobileShell>
  );
};

export default SendPage;
