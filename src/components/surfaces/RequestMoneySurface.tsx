/**
 * Request Money Surface - Payment Surface
 * 
 * Allows users to request money from contacts.
 * Creates RequestMoney intents.
 * The receiver will get a notification to pay via FLOW.
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  HandCoins, 
  ChevronLeft, 
  Search, 
  ArrowRight, 
  Loader2,
  Check,
  Copy,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  initial: string;
}

const RequestMoneySurface = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [requestCreated, setRequestCreated] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadContacts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

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
        ]);
      }

      setIsLoading(false);
    };

    loadContacts();
  }, [navigate]);

  const handleCreateRequest = async () => {
    if (!selectedContact || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Missing details",
        description: "Please select a contact and enter an amount",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Create RequestMoney intent
      const { data: intent, error } = await supabase
        .from("intents")
        .insert({
          user_id: user.id,
          type: "RequestMoney",
          amount: parseFloat(amount),
          currency: "MYR",
          payee_name: selectedContact.name,
          payee_identifier: selectedContact.phone,
          metadata: {
            source: "request_money_surface",
            requesterId: user.id,
            recipientId: selectedContact.id,
            note: note || undefined,
          },
        })
        .select("id")
        .single();

      if (error || !intent) {
        throw new Error("Failed to create request");
      }

      // Generate shareable link (deep link)
      const baseUrl = window.location.origin;
      const paymentLink = `${baseUrl}/pay?request=${intent.id}`;

      setRequestCreated({ id: intent.id, link: paymentLink });

      toast({
        title: "Request created",
        description: `Payment request sent to ${selectedContact.name}`,
      });
    } catch (error) {
      console.error("Create request error:", error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!requestCreated) return;
    
    try {
      await navigator.clipboard.writeText(requestCreated.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied",
        description: "Payment link copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!requestCreated || !selectedContact) return;

    const shareData = {
      title: "FLOW Payment Request",
      text: `${selectedContact.name}, you have a payment request for RM ${parseFloat(amount).toFixed(2)}`,
      url: requestCreated.link,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch {
      // User cancelled share
    }
  };

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
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Request Money
          </h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {requestCreated ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-success" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Request Sent
            </h2>
            <p className="text-muted-foreground mb-8">
              RM {parseFloat(amount).toFixed(2)} from {selectedContact?.name}
            </p>

            {/* Payment Link */}
            <div className="w-full max-w-sm bg-muted rounded-xl p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">Payment Link</p>
              <p className="text-sm font-mono text-foreground break-all">
                {requestCreated.link}
              </p>
            </div>

            <div className="flex gap-3 w-full max-w-sm">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-1 rounded-xl"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                onClick={handleShare}
                className="flex-1 rounded-xl"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <button
              onClick={() => navigate("/home")}
              className="mt-8 text-sm text-muted-foreground hover:text-foreground"
            >
              Back to Home
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col px-6"
          >
            {/* Helper Text */}
            <p className="text-muted-foreground mb-6">
              Request money from a contact. They'll receive a payment link.
            </p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search contacts"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted border-0"
              />
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-48">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(
                    selectedContact?.id === contact.id ? null : contact
                  )}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                    selectedContact?.id === contact.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    selectedContact?.id === contact.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {contact.initial}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground text-sm">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.phone}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Amount Field */}
            <div className="mb-3">
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

            {/* Note Field */}
            <div className="mb-6">
              <label className="block text-sm text-muted-foreground mb-2">Note (optional)</label>
              <Input
                type="text"
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-xl bg-muted border-0"
              />
            </div>

            {/* Create Request Button */}
            <Button
              onClick={handleCreateRequest}
              disabled={!selectedContact || !amount || parseFloat(amount) <= 0 || isCreating}
              size="lg"
              className="w-full h-14 text-base font-medium rounded-2xl mb-8"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <HandCoins className="w-5 h-5 mr-2" />
                  Request money
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
RequestMoneySurface.displayName = "RequestMoneySurface";

export default RequestMoneySurface;
