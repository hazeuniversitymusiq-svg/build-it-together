import { useState } from "react";
import { motion } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import { User, Phone, AtSign, ArrowRight, Delete } from "lucide-react";

const SendPage = () => {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const recentContacts = [
    { id: "1", name: "Sarah L.", initial: "S", color: "bg-accent" },
    { id: "2", name: "Ahmad R.", initial: "A", color: "bg-success" },
    { id: "3", name: "Wei Ming", initial: "W", color: "bg-warning" },
  ];

  const handleNumberPress = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.includes(".") && amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full safe-area-top">
        {/* Header */}
        <header className="px-6 pt-4 pb-6">
          <h1 className="text-2xl font-bold text-foreground">Send Money</h1>
          <p className="text-sm text-muted-foreground">Transfer to anyone instantly</p>
        </header>

        {/* Recipient Input */}
        <div className="px-6 mb-4">
          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Phone number or name"
              className="w-full bg-secondary rounded-2xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          </div>
        </div>

        {/* Recent Contacts */}
        <div className="px-6 mb-6">
          <p className="text-sm text-muted-foreground mb-3">Recent</p>
          <div className="flex gap-4">
            {recentContacts.map((contact, index) => (
              <motion.button
                key={contact.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setRecipient(contact.name)}
                className="flex flex-col items-center"
              >
                <div className={`w-14 h-14 rounded-2xl ${contact.color} flex items-center justify-center text-white font-semibold text-lg mb-1`}>
                  {contact.initial}
                </div>
                <span className="text-xs text-muted-foreground">{contact.name.split(" ")[0]}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Amount Display */}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <motion.p
              key={amount}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-5xl font-semibold text-foreground"
            >
              RM{amount || "0.00"}
            </motion.p>
          </div>
        </div>

        {/* Keypad */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberPress(num)}
                className="h-14 bg-secondary rounded-xl text-xl font-medium text-foreground active:bg-muted transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-14 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground active:bg-muted transition-colors"
            >
              <Delete size={24} />
            </button>
          </div>

          {/* Send Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={!amount || !recipient}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Continue</span>
            <ArrowRight size={20} />
          </motion.button>
        </div>
      </div>
    </MobileShell>
  );
};

export default SendPage;
