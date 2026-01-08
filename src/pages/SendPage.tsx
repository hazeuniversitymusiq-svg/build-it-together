/**
 * FLOW Send Money Page - Screen 10
 * 
 * Contact selection + amount entry → Navigate to Resolve screen
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  ArrowRight, 
  Users, 
  ChevronLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactDisplayItem {
  id: string;
  name: string;
  phone: string;
  initial: string;
}

const SendPage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<ContactDisplayItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactDisplayItem | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasContactsPermission, setHasContactsPermission] = useState(false);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  // Load contacts from database
  useEffect(() => {
    const loadContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if contacts connector is available
      const { data: connector } = await supabase
        .from("connectors")
        .select("*")
        .eq("user_id", user.id)
        .eq("name", "Contacts")
        .eq("status", "available")
        .maybeSingle();

      if (connector) {
        setHasContactsPermission(true);

        // Load contacts
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
          })));
        } else {
          // Sample contacts for prototype
          setContacts([
            { id: "1", name: "Sarah", phone: "+60123456789", initial: "S" },
            { id: "2", name: "Ahmad", phone: "+60123456790", initial: "A" },
            { id: "3", name: "Wei Ming", phone: "+60123456791", initial: "W" },
            { id: "4", name: "Nurul", phone: "+60123456792", initial: "N" },
            { id: "5", name: "Raj", phone: "+60123456793", initial: "R" },
          ]);
        }
      } else {
        setHasContactsPermission(false);
      }

      setIsLoading(false);
    };

    loadContacts();
  }, [navigate]);

  const handleAllowContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create contacts connector
    await supabase.from("connectors").insert({
      user_id: user.id,
      name: "Contacts",
      type: "contacts",
      status: "available",
      capabilities: { can_p2p: true },
    });

    setHasContactsPermission(true);

    // Load sample contacts for prototype
    setContacts([
      { id: "1", name: "Sarah", phone: "+60123456789", initial: "S" },
      { id: "2", name: "Ahmad", phone: "+60123456790", initial: "A" },
      { id: "3", name: "Wei Ming", phone: "+60123456791", initial: "W" },
      { id: "4", name: "Nurul", phone: "+60123456792", initial: "N" },
      { id: "5", name: "Raj", phone: "+60123456793", initial: "R" },
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

      // Create intent in database
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
            railsAvailable: ["TouchNGo", "GrabPay", "DuitNow"],
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create payment request");
      }

      // Navigate to resolve screen
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

  // Filter contacts by search
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="px-6 pt-16 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Send Money
          </h1>
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
          Choose a person.
        </p>
        <p className="text-muted-foreground">
          FLOW will deliver to the best supported wallet.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* No Contacts Permission State */}
        {!hasContactsPermission ? (
          <motion.div
            key="no-permission"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-2">
              Allow contacts to send faster.
            </p>
            <p className="text-muted-foreground text-sm mb-8 max-w-xs">
              FLOW needs access to your contacts to help you send money quickly.
            </p>
            <Button onClick={handleAllowContacts} size="lg" className="rounded-2xl px-8">
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
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted border-0"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {filteredContacts.map((contact) => (
                <motion.button
                  key={contact.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedContact(
                    selectedContact?.id === contact.id ? null : contact
                  )}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    selectedContact?.id === contact.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                    selectedContact?.id === contact.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {contact.initial}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                  {selectedContact?.id === contact.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              ))}

              {filteredContacts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No contacts found</p>
                </div>
              )}
            </div>

            {/* Amount Field */}
            <div className="mb-4">
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
                  className="pl-14 h-14 text-xl font-semibold rounded-xl bg-muted border-0"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Primary Button */}
            <Button
              onClick={handleResolveAndSend}
              disabled={!selectedContact || !amount || parseFloat(amount) <= 0 || isCreatingIntent}
              size="lg"
              className="w-full h-14 text-base font-medium rounded-2xl mb-8"
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
