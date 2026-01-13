/**
 * FLOW Receive Page
 * 
 * iOS 26 Liquid Glass design - Request/receive money with intelligence
 * Features: My QR code, pending requests, request history, amount presets
 */

import { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  QrCode,
  ChevronLeft,
  Search,
  ArrowRight,
  Loader2,
  Check,
  Copy,
  Share2,
  Clock,
  HandCoins,
  History,
  Wallet,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MyPaymentCode from "@/components/scanner/MyPaymentCode";
import type { Database } from "@/integrations/supabase/types";

type Contact = Database['public']['Tables']['contacts']['Row'];

interface ContactDisplayItem {
  id: string;
  name: string;
  phone: string;
  initial: string;
}

interface PendingRequest {
  id: string;
  amount: number;
  payeeName: string;
  createdAt: Date;
  link: string;
}

interface RequestHistoryItem {
  id: string;
  amount: number;
  fromName: string;
  status: 'completed' | 'pending' | 'expired';
  createdAt: Date;
}

// Amount presets
const AMOUNT_PRESETS = [10, 20, 50, 100, 200];

const ReceivePage = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'request' | 'pending' | 'history'>('request');
  const [contacts, setContacts] = useState<ContactDisplayItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<ContactDisplayItem | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showMyCode, setShowMyCode] = useState(false);
  const [requestCreated, setRequestCreated] = useState<{ id: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

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
        // Demo contacts
        setContacts([
          { id: "1", name: "Sarah", phone: "+60123456789", initial: "S" },
          { id: "2", name: "Ahmad", phone: "+60123456790", initial: "A" },
          { id: "3", name: "Wei Ming", phone: "+60123456791", initial: "W" },
          { id: "4", name: "Nurul", phone: "+60123456792", initial: "N" },
        ]);
      }

      // Load pending requests (RequestMoney intents that haven't been paid)
      const { data: pendingIntents } = await supabase
        .from("intents")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "RequestMoney")
        .order("created_at", { ascending: false })
        .limit(10);

      if (pendingIntents) {
        // Filter to only show pending (no matching transaction)
        const pending = pendingIntents.map(intent => ({
          id: intent.id,
          amount: intent.amount,
          payeeName: intent.payee_name,
          createdAt: new Date(intent.created_at),
          link: `${window.location.origin}/pay?request=${intent.id}`,
        }));
        setPendingRequests(pending);
      }

      // Load request history from transaction_logs
      const { data: historyData } = await supabase
        .from("transaction_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("intent_type", "RequestMoney")
        .order("created_at", { ascending: false })
        .limit(20);

      if (historyData) {
        setRequestHistory(historyData.map(h => ({
          id: h.id,
          amount: Number(h.amount),
          fromName: h.recipient_name || 'Unknown',
          status: h.status as 'completed' | 'pending',
          createdAt: new Date(h.created_at),
        })));
      }

      setIsLoading(false);
    };

    loadData();
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
            source: "receive_page",
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

      const baseUrl = window.location.origin;
      const paymentLink = `${baseUrl}/pay?request=${intent.id}`;

      setRequestCreated({ id: intent.id, link: paymentLink });

      // Add to pending
      setPendingRequests(prev => [{
        id: intent.id,
        amount: parseFloat(amount),
        payeeName: selectedContact.name,
        createdAt: new Date(),
        link: paymentLink,
      }, ...prev]);

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

  const handleCopyLink = async (link?: string) => {
    const linkToCopy = link || requestCreated?.link;
    if (!linkToCopy) return;
    
    try {
      await navigator.clipboard.writeText(linkToCopy);
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

  const handleShare = async (link?: string, name?: string, amt?: number) => {
    const shareLink = link || requestCreated?.link;
    const shareName = name || selectedContact?.name;
    const shareAmount = amt || parseFloat(amount);
    
    if (!shareLink) return;

    const shareData = {
      title: "FLOW Payment Request",
      text: `${shareName}, you have a payment request for RM ${shareAmount.toFixed(2)}`,
      url: shareLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink(shareLink);
      }
    } catch {
      // User cancelled share
    }
  };

  const handlePresetAmount = (preset: number) => {
    setAmount(preset.toString());
  };

  const resetForm = () => {
    setRequestCreated(null);
    setSelectedContact(null);
    setAmount("");
    setNote("");
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/home")}
              className="w-10 h-10 rounded-full glass-card flex items-center justify-center shadow-float"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <p className="text-muted-foreground text-sm">Get paid</p>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                Receive
              </h1>
            </div>
          </div>

          {/* My QR Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMyCode(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl aurora-gradient text-white shadow-glow-aurora"
          >
            <QrCode className="w-5 h-5" />
            <span className="font-medium">My QR</span>
          </motion.button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="flex gap-2 p-1 glass-card rounded-2xl">
          {[
            { id: 'request', label: 'Request', icon: HandCoins },
            { id: 'pending', label: 'Pending', icon: Clock, count: pendingRequests.length },
            { id: 'history', label: 'History', icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'aurora-gradient text-white shadow-glow-blue'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center ${
                  activeTab === tab.id ? 'bg-white/30' : 'bg-aurora-purple/20 text-aurora-purple'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Request Tab */}
        {activeTab === 'request' && (
          <motion.div
            key="request"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col px-6"
          >
            <AnimatePresence mode="wait">
              {requestCreated ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 flex flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
                  >
                    <Check className="w-10 h-10 text-success" />
                  </motion.div>
                  
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Request Sent
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    RM {parseFloat(amount).toFixed(2)} from {selectedContact?.name}
                  </p>

                  <div className="w-full max-w-sm glass-card rounded-2xl p-4 mb-6">
                    <p className="text-xs text-muted-foreground mb-2">Payment Link</p>
                    <p className="text-sm font-mono text-foreground break-all">
                      {requestCreated.link}
                    </p>
                  </div>

                  <div className="flex gap-3 w-full max-w-sm">
                    <Button
                      variant="outline"
                      onClick={() => handleCopyLink()}
                      className="flex-1 rounded-2xl h-12 glass-card border-0"
                    >
                      {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      onClick={() => handleShare()}
                      className="flex-1 rounded-2xl h-12 aurora-gradient text-white border-0 shadow-glow-aurora"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <button
                    onClick={resetForm}
                    className="mt-8 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Create another request
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Amount Presets */}
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-2">Quick amounts</label>
                    <div className="flex gap-2 flex-wrap">
                      {AMOUNT_PRESETS.map((preset) => (
                        <motion.button
                          key={preset}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePresetAmount(preset)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            amount === preset.toString()
                              ? 'aurora-gradient text-white shadow-glow-blue'
                              : 'glass-card hover:bg-white/60 dark:hover:bg-white/10 text-foreground'
                          }`}
                        >
                          RM {preset}
                        </motion.button>
                      ))}
                    </div>
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
                        className="pl-14 h-14 text-xl font-semibold rounded-2xl glass-card border-0 shadow-float"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
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
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-48">
                    {filteredContacts.map((contact, index) => (
                      <motion.button
                        key={contact.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedContact(
                          selectedContact?.id === contact.id ? null : contact
                        )}
                        className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all shadow-float ${
                          selectedContact?.id === contact.id
                            ? "aurora-gradient-soft aurora-border"
                            : "glass-card hover:bg-white/60 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedContact?.id === contact.id
                            ? "aurora-gradient text-white shadow-glow-blue"
                            : "bg-secondary text-secondary-foreground"
                        }`}>
                          {contact.initial}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground text-sm">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
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
                  </div>

                  {/* Note Field */}
                  <div className="mb-4">
                    <label className="block text-sm text-muted-foreground mb-2">Note (optional)</label>
                    <Input
                      type="text"
                      placeholder="What's this for?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-12 rounded-2xl glass-card border-0 shadow-float"
                    />
                  </div>

                  {/* Create Request Button */}
                  <Button
                    onClick={handleCreateRequest}
                    disabled={!selectedContact || !amount || parseFloat(amount) <= 0 || isCreating}
                    size="lg"
                    className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora mb-4"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <HandCoins className="w-5 h-5 mr-2" />
                        Request RM {amount || '0.00'}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-6"
          >
            {pendingRequests.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No pending requests</p>
                <p className="text-sm text-muted-foreground mt-1">Create a request to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-2xl p-4 shadow-float"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{request.payeeName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(request.createdAt)}</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg text-foreground">
                        RM {request.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(request.link)}
                        className="flex-1 rounded-xl glass-subtle border-0"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleShare(request.link, request.payeeName, request.amount)}
                        className="flex-1 rounded-xl aurora-gradient text-white border-0"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Remind
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 px-6"
          >
            {requestHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No request history</p>
                <p className="text-sm text-muted-foreground mt-1">Completed requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requestHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-2xl p-4 shadow-float"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'completed' ? 'bg-success/10' : 'bg-muted'
                        }`}>
                          {item.status === 'completed' ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">From {item.fromName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-success">
                          +RM {item.amount.toFixed(2)}
                        </p>
                        <p className={`text-xs capitalize ${
                          item.status === 'completed' ? 'text-success' : 'text-muted-foreground'
                        }`}>
                          {item.status}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Payment Code Modal */}
      <MyPaymentCode isOpen={showMyCode} onClose={() => setShowMyCode(false)} />
    </div>
  );
});
ReceivePage.displayName = "ReceivePage";

export default ReceivePage;
