/**
 * FLOW Send Page
 * 
 * Contact selection + amount entry → Intent Engine SEND_MONEY flow
 * Uses same confirmation card as scan
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MobileShell from "@/components/layout/MobileShell";
import BottomNav from "@/components/layout/BottomNav";
import ConfirmationCard from "@/components/payment/ConfirmationCard";
import { useIntent } from "@/contexts/IntentContext";
import { useOrchestration } from "@/contexts/OrchestrationContext";
import { useSecurity } from "@/contexts/SecurityContext";
import { Delete, Plus } from "lucide-react";
import type { PaymentResolution } from "@/lib/orchestration";

type SendState = "input" | "confirming" | "authenticating" | "processing" | "complete";

const SendPage = () => {
  const [amount, setAmount] = useState("");
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; phone?: string } | null>(null);
  const [sendState, setSendState] = useState<SendState>("input");
  const [resolution, setResolution] = useState<PaymentResolution | null>(null);

  const { currentIntent, sendMoney, authorizeIntent, completeIntent, clearCurrentIntent } = useIntent();
  const { resolvePaymentRequest, recordPayment, topUpWallet } = useOrchestration();
  const { authorizePayment, clearAuthorization } = useSecurity();

  const recentContacts = [
    { id: "1", name: "Sarah", initial: "S", phone: "+1234567890" },
    { id: "2", name: "Ahmad", initial: "A", phone: "+1234567891" },
    { id: "3", name: "Wei Ming", initial: "W", phone: "+1234567892" },
  ];

  const handleNumberPress = (num: string) => {
    if (num === "." && amount.includes(".")) return;
    if (amount.includes(".") && amount.split(".")[1]?.length >= 2) return;
    setAmount((prev) => prev + num);
  };

  const handleDelete = () => {
    setAmount((prev) => prev.slice(0, -1));
  };

  const handleSend = () => {
    if (!selectedContact || !amount || parseFloat(amount) <= 0) return;

    // Create SEND_MONEY intent
    const intent = sendMoney(
      { name: selectedContact.name, phone: selectedContact.phone },
      parseFloat(amount),
      '$'
    );

    // Resolve payment
    const paymentResolution = resolvePaymentRequest({
      amount: parseFloat(amount),
      currency: '$',
      intentId: intent.id,
      recipientId: selectedContact.id,
    });

    setResolution(paymentResolution);
    setSendState("confirming");
  };

  const handleConfirm = async () => {
    if (!currentIntent || !resolution) return;

    if (resolution.action === 'BLOCKED' || resolution.action === 'INSUFFICIENT_FUNDS') {
      console.error(resolution.blockedReason);
      return;
    }

    setSendState("authenticating");

    const authSuccess = await authorizePayment();
    if (!authSuccess) {
      setSendState("confirming");
      return;
    }

    authorizeIntent(currentIntent.id);
    setSendState("processing");

    // Execute payment
    for (const step of resolution.steps) {
      if (step.action === 'top_up') {
        await new Promise(r => setTimeout(r, 400));
        topUpWallet(step.amount);
      } else if (step.action === 'charge') {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    setSendState("complete");
    completeIntent(currentIntent.id);
    recordPayment(parseFloat(amount));

    // Reset after animation
    setTimeout(() => {
      clearCurrentIntent();
      clearAuthorization();
      setResolution(null);
      setAmount("");
      setSelectedContact(null);
      setSendState("input");
    }, 2000);
  };

  const displayAmount = amount || "0";

  return (
    <MobileShell>
      <div className="flex flex-col min-h-full pb-24">
        {/* Minimal Header */}
        <header className="px-6 pt-8 pb-4 safe-area-top">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Send</h1>
        </header>

        <AnimatePresence mode="wait">
          {sendState === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1"
            >
              {/* Recent Contacts */}
              <div className="px-6 py-4">
                <div className="flex gap-5">
                  {recentContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="flex flex-col items-center"
                    >
                      <motion.div
                        animate={{ 
                          scale: selectedContact?.id === contact.id ? 1.05 : 1,
                          opacity: selectedContact?.id === contact.id ? 1 : 0.6
                        }}
                        className={`w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium text-lg ${
                          selectedContact?.id === contact.id ? "ring-2 ring-foreground" : ""
                        }`}
                      >
                        {contact.initial}
                      </motion.div>
                      <span className={`text-xs mt-2 transition-opacity ${
                        selectedContact?.id === contact.id ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {contact.name}
                      </span>
                    </button>
                  ))}
                  
                  {/* Add new contact */}
                  <button className="flex flex-col items-center opacity-40">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-xs mt-2 text-muted-foreground">Add</span>
                  </button>
                </div>
              </div>

              {/* Amount Display */}
              <div className="flex-1 flex items-center justify-center px-6">
                <motion.p
                  key={amount}
                  initial={{ scale: 1.02 }}
                  animate={{ scale: 1 }}
                  className="text-5xl font-semibold text-foreground tabular-nums"
                >
                  ${displayAmount}
                </motion.p>
              </div>

              {/* Keypad */}
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

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!amount || !selectedContact || parseFloat(amount) <= 0}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-medium text-lg disabled:opacity-30 transition-opacity"
                >
                  Send
                </motion.button>
              </div>
            </motion.div>
          )}

          {sendState !== "input" && currentIntent && resolution && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center px-6"
            >
              <ConfirmationCard
                recipient={selectedContact?.name || ''}
                recipientType="person"
                amount={parseFloat(amount)}
                currency="$"
                resolution={resolution}
                onConfirm={handleConfirm}
                isAuthenticating={sendState === "authenticating"}
                isProcessing={sendState === "processing"}
                isComplete={sendState === "complete"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <BottomNav />
    </MobileShell>
  );
};

export default SendPage;
