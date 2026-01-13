/**
 * FLOW Send Money Page
 * 
 * iOS 26 Liquid Glass design - Contact selection + amount entry
 * With intelligent features: frequent contacts, send history, note field
 */

import { forwardRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  ArrowRight, 
  Users, 
  ChevronLeft,
  Loader2,
  Check,
  Wallet,
  MessageSquare
} from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FrequentContacts from "@/components/send/FrequentContacts";
import ContactSendHistory from "@/components/send/ContactSendHistory";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];
type DefaultWallet = Database['public']['Enums']['default_wallet'];

interface ContactDisplayItem {
  id: string;
  name: string;
  phone: string;
  initial: string;
  supportedWallets: string[];
  defaultWallet: DefaultWallet;
}

const SendPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registerPageAction, clearPageActions } = useDemo();

  const [contacts, setContacts] = useState<ContactDisplayItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactDisplayItem | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: connector } = await supabase
        .from("connectors")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", "Contacts")
        .eq("status", "available")
        .maybeSingle();

      if (connector) {
        setHasContactsPermission(true);

        const { data: contactsData } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .order("name");

        if (contactsData && contactsData.length > 0) {
          setContacts(contactsData.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            initial: c.name.charAt(0).toUpperCase(),
            supportedWallets: (c.supported_wallets as string[]) || [],
            defaultWallet: c.default_wallet,
          })));
        } else {
          // Demo contacts with wallet data
          setContacts([
            { id: "1", name: "Sarah", phone: "+60123456789", initial: "S", supportedWallets: ["TouchNGo", "GrabPay"], defaultWallet: "TouchNGo" },
            { id: "2", name: "Ahmad", phone: "+60123456790", initial: "A", supportedWallets: ["GrabPay"], defaultWallet: "GrabPay" },
            { id: "3", name: "Wei Ming", phone: "+60123456791", initial: "W", supportedWallets: ["TouchNGo", "Boost"], defaultWallet: "TouchNGo" },
            { id: "4", name: "Nurul", phone: "+60123456792", initial: "N", supportedWallets: ["TouchNGo", "GrabPay", "Boost"], defaultWallet: "None" },
            { id: "5", name: "Raj", phone: "+60123456793", initial: "R", supportedWallets: [], defaultWallet: "None" },
          ]);
        }
      } else {
        setHasContactsPermission(false);
      }

      setIsLoading(false);
    };

    loadContacts();
  }, [navigate]);

  // Simulate selecting a contact and initiating transfer
  const simulateSendDemo = useCallback(() => {
    const demoContact: ContactDisplayItem = {
      id: "demo-1",
      name: "Sarah",
      phone: "+60123456789",
      initial: "S",
      supportedWallets: ["TouchNGo", "GrabPay"],
      defaultWallet: "TouchNGo",
    };
    
    setSelectedContact(demoContact);
    setSelectedWallet("TouchNGo");
    setAmount("50.00");
    setNote("Lunch yesterday 🍜");
    
    toast({
      title: "Demo: Contact Selected",
      description: `Selected ${demoContact.name} with RM 50.00`,
    });
  }, [toast]);

  // Register demo actions for this page
  useEffect(() => {
    registerPageAction({
      id: 'send-simulate-transfer',
      label: 'Simulate Send Money',
      description: 'Select a contact and pre-fill transfer details',
      action: simulateSendDemo,
    });

    return () => {
      clearPageActions();
    };
  }, [registerPageAction, clearPageActions, simulateSendDemo]);

  const handleAllowContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("connectors").insert({
      user_id: user.id,
      name: "Contacts",
      type: "contacts",
      status: "available",
      capabilities: { can_p2p: true },
    });

    setHasContactsPermission(true);
    // Demo contacts with wallet data
    setContacts([
      { id: "1", name: "Sarah", phone: "+60123456789", initial: "S", supportedWallets: ["TouchNGo", "GrabPay"], defaultWallet: "TouchNGo" },
      { id: "2", name: "Ahmad", phone: "+60123456790", initial: "A", supportedWallets: ["GrabPay"], defaultWallet: "GrabPay" },
      { id: "3", name: "Wei Ming", phone: "+60123456791", initial: "W", supportedWallets: ["TouchNGo", "Boost"], defaultWallet: "TouchNGo" },
      { id: "4", name: "Nurul", phone: "+60123456792", initial: "N", supportedWallets: ["TouchNGo", "GrabPay", "Boost"], defaultWallet: "None" },
      { id: "5", name: "Raj", phone: "+60123456793", initial: "R", supportedWallets: [], defaultWallet: "None" },
    ]);

    toast({
      title: "Contacts enabled",
      description: "You can now send money to your contacts",
    });
  };

  const handleResolveAndSend = async () => {
    if (!selectedContact || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Missing details",
        description: "Please select a contact and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingIntent(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Use user-selected wallet as the preferred rail
      const recipientWallets = selectedContact.supportedWallets;
      const userSelectedWallet = selectedWallet || "DuitNow";
      
      // Available rails = recipient's wallets + DuitNow as universal fallback
      const railsAvailable = recipientWallets.length > 0 
        ? [...recipientWallets, "DuitNow"] 
        : ["DuitNow"];

      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: user.id,
          type: "SendMoney",
          amount: parseFloat(amount),
          currency: "MYR",
          payee_name: selectedContact.name,
          payee_identifier: selectedContact.phone,
          metadata: {
            recipientId: selectedContact.id,
            recipientWallets: recipientWallets,
            recipientPreferredWallet: userSelectedWallet,
            userSelectedRail: userSelectedWallet,
            railsAvailable: railsAvailable,
            note: note || undefined,
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create payment request");
      }

      navigate(`/resolve/${intent.id}`);
    } catch (error) {
      console.error("Error creating intent:", error);
      toast({
        title: "Error",
        description: "Failed to create payment request",
        variant: "destructive",
      });
      setIsCreatingIntent(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full aurora-gradient opacity-30 animate-aurora" />
          <Loader2 className="w-12 h-12 text-aurora-blue animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom pb-28">
      {/* Header */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-muted-foreground text-sm">Transfer money</p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Send
            </h1>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 pb-6"
      >
        <p className="text-muted-foreground">
          FLOW delivers to the best supported wallet.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!hasContactsPermission ? (
          <motion.div
            key="no-permission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-full aurora-gradient-soft flex items-center justify-center mb-6 shadow-float-lg"
            >
              <Users className="w-12 h-12 text-aurora-purple" />
            </motion.div>
            <p className="text-foreground font-medium text-lg mb-2">
              Allow contacts to send faster
            </p>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              FLOW needs access to your contacts to help you send money quickly.
            </p>
            <Button 
              onClick={handleAllowContacts} 
              size="lg" 
              className="rounded-2xl px-8 aurora-gradient text-white border-0 shadow-glow-aurora"
            >
              Allow contacts access
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="with-permission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-6"
          >
            {/* Frequent Contacts */}
            <FrequentContacts
              onSelect={(contact) => {
                setSelectedContact({
                  id: contact.id,
                  name: contact.name,
                  phone: contact.phone,
                  initial: contact.initial,
                  supportedWallets: [],
                  defaultWallet: "None",
                });
                setAmount(contact.suggestedAmount.toString());
                setSelectedWallet("DuitNow");
              }}
              selectedId={selectedContact?.id}
            />

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl glass-card border-0 shadow-float"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {filteredContacts.map((contact, index) => (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (selectedContact?.id === contact.id) {
                      setSelectedContact(null);
                      setSelectedWallet(null);
                    } else {
                      setSelectedContact(contact);
                      // Auto-select default wallet or first available
                      if (contact.defaultWallet !== "None") {
                        setSelectedWallet(contact.defaultWallet);
                      } else if (contact.supportedWallets.length > 0) {
                        setSelectedWallet(contact.supportedWallets[0]);
                      } else {
                        setSelectedWallet("DuitNow"); // Universal fallback
                      }
                    }
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all shadow-float ${
                    selectedContact?.id === contact.id
                      ? "aurora-gradient-soft aurora-border"
                      : "glass-card hover:bg-white/60 dark:hover:bg-white/5"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
                    selectedContact?.id === contact.id
                      ? "aurora-gradient text-white shadow-glow-blue"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {contact.initial}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {contact.supportedWallets.length > 0 ? (
                        <>
                          <Wallet className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {contact.defaultWallet !== "None" 
                              ? contact.defaultWallet 
                              : contact.supportedWallets.slice(0, 2).join(", ")}
                            {contact.supportedWallets.length > 2 && contact.defaultWallet === "None" && " +more"}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                      )}
                    </div>
                  </div>
                  {selectedContact?.id === contact.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full aurora-gradient flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8 glass-card rounded-2xl">
                  <p className="text-muted-foreground">No contacts found</p>
                </div>
              )}
            </div>

            {/* Wallet Selector - shown when contact has multiple options */}
            <AnimatePresence>
              {selectedContact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <label className="block text-sm text-muted-foreground mb-2">
                    Deliver to {selectedContact.name}'s
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {/* Show recipient's wallets + DuitNow as options */}
                    {[...selectedContact.supportedWallets, ...(selectedContact.supportedWallets.length > 0 ? [] : ["DuitNow"])].map((wallet) => (
                      <motion.button
                        key={wallet}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedWallet(wallet)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedWallet === wallet
                            ? "aurora-gradient text-white shadow-glow-blue"
                            : "glass-card hover:bg-white/60 dark:hover:bg-white/10 text-foreground"
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        {wallet}
                        {selectedContact.defaultWallet === wallet && (
                          <span className="text-[10px] opacity-70">(preferred)</span>
                        )}
                      </motion.button>
                    ))}
                    {/* Always show DuitNow as universal option if recipient has wallets */}
                    {selectedContact.supportedWallets.length > 0 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedWallet("DuitNow")}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          selectedWallet === "DuitNow"
                            ? "aurora-gradient text-white shadow-glow-blue"
                            : "glass-card hover:bg-white/60 dark:hover:bg-white/10 text-foreground"
                        }`}
                      >
                        <Wallet className="w-4 h-4" />
                        DuitNow
                        <span className="text-[10px] opacity-70">(universal)</span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send History with Contact */}
            <AnimatePresence>
              {selectedContact && (
                <ContactSendHistory
                  contactId={selectedContact.id}
                  contactName={selectedContact.name}
                  contactPhone={selectedContact.phone}
                />
              )}
            </AnimatePresence>

            {/* Amount Field */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4"
            >
              <label className="block text-sm text-muted-foreground mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                  RM
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-14 h-14 text-xl font-semibold rounded-2xl glass-card border-0 shadow-float"
                  step="0.01"
                  min="0"
                />
              </div>
            </motion.div>

            {/* Note Field */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-4"
            >
              <label className="block text-sm text-muted-foreground mb-2">Note (optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="What's this for?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="pl-12 h-12 rounded-2xl glass-card border-0 shadow-float"
                />
              </div>
            </motion.div>

            {/* Primary Button */}
            <Button
              onClick={handleResolveAndSend}
              disabled={!selectedContact || !amount || parseFloat(amount) <= 0 || isCreatingIntent}
              size="lg"
              className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora disabled:opacity-50 disabled:shadow-none mb-4"
            >
              {isCreatingIntent ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Resolve and send
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
SendPage.displayName = "SendPage";

export default SendPage;
