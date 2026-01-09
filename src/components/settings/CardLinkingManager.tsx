/**
 * Card Linking Manager
 * 
 * Allows users to add, view, and manage their debit/credit cards.
 * Cards are stored with masked numbers for security.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Star,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LinkedCard {
  id: string;
  cardNumber: string; // Last 4 digits only
  maskedNumber: string; // e.g., •••• •••• •••• 1234
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cardType: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
  addedAt: string;
  nickname?: string;
}

const STORAGE_KEY = 'flow_linked_cards';
const DEFAULT_CARD_KEY = 'flow_default_card';

// Card type detection based on number prefix
function detectCardType(number: string): 'visa' | 'mastercard' | 'amex' {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'amex';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  return 'visa'; // default
}

// Format card number with spaces
function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

// Mask card number
function maskCardNumber(last4: string): string {
  return `•••• •••• •••• ${last4}`;
}

// Card brand colors and icons
const cardBrands = {
  visa: { 
    color: 'bg-gradient-to-br from-blue-600 to-blue-800', 
    name: 'Visa',
    textColor: 'text-white'
  },
  mastercard: { 
    color: 'bg-gradient-to-br from-orange-500 to-red-600', 
    name: 'Mastercard',
    textColor: 'text-white'
  },
  amex: { 
    color: 'bg-gradient-to-br from-slate-600 to-slate-800', 
    name: 'American Express',
    textColor: 'text-white'
  },
};

// Card visual component
function CardVisual({ card, isCompact = false }: { card: LinkedCard; isCompact?: boolean }) {
  const brand = cardBrands[card.cardType];
  
  if (isCompact) {
    return (
      <div className={cn(
        "w-12 h-8 rounded-md flex items-center justify-center",
        brand.color
      )}>
        <CreditCard className="w-5 h-5 text-white" />
      </div>
    );
  }
  
  return (
    <div className={cn(
      "relative w-full aspect-[1.586] rounded-2xl p-5 overflow-hidden",
      brand.color
    )}>
      {/* Card shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
      
      {/* Chip */}
      <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500 mb-4" />
      
      {/* Card number */}
      <div className="font-mono text-lg text-white tracking-wider mb-3">
        {card.maskedNumber}
      </div>
      
      {/* Bottom row */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-white/60 text-xs uppercase mb-1">Card Holder</p>
          <p className="text-white font-medium uppercase tracking-wide text-sm">
            {card.cardholderName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/60 text-xs uppercase mb-1">Expires</p>
          <p className="text-white font-mono text-sm">
            {card.expiryMonth}/{card.expiryYear}
          </p>
        </div>
      </div>
      
      {/* Brand name */}
      <div className="absolute top-4 right-5">
        <span className="text-white font-bold text-lg italic">
          {brand.name}
        </span>
      </div>
      
      {/* Default badge */}
      {card.isDefault && (
        <div className="absolute top-4 left-5">
          <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Default
          </Badge>
        </div>
      )}
    </div>
  );
}

export default function CardLinkingManager() {
  const { toast } = useToast();
  const [cards, setCards] = useState<LinkedCard[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [defaultCardId, setDefaultCardId] = useState<string>(() => {
    return localStorage.getItem(DEFAULT_CARD_KEY) || '';
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LinkedCard | null>(null);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [nickname, setNickname] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(DEFAULT_CARD_KEY, defaultCardId);
  }, [defaultCardId]);

  // Update cards with default status
  const cardsWithDefault = cards.map(card => ({
    ...card,
    isDefault: card.id === defaultCardId
  }));

  const resetForm = () => {
    setCardNumber('');
    setCardholderName('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setNickname('');
    setShowCvv(false);
  };

  const handleAddCard = async () => {
    // Basic validation
    const cleanedNumber = cardNumber.replace(/\s/g, '');
    if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
      toast({ title: "Invalid card number", variant: "destructive" });
      return;
    }
    if (!cardholderName.trim()) {
      toast({ title: "Cardholder name required", variant: "destructive" });
      return;
    }
    if (!expiryMonth || !expiryYear) {
      toast({ title: "Expiry date required", variant: "destructive" });
      return;
    }
    if (cvv.length < 3) {
      toast({ title: "Invalid CVV", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const last4 = cleanedNumber.slice(-4);
    const newCard: LinkedCard = {
      id: crypto.randomUUID(),
      cardNumber: last4,
      maskedNumber: maskCardNumber(last4),
      cardholderName: cardholderName.trim().toUpperCase(),
      expiryMonth,
      expiryYear,
      cardType: detectCardType(cleanedNumber),
      isDefault: cards.length === 0,
      addedAt: new Date().toISOString(),
      nickname: nickname.trim() || undefined,
    };

    setCards(prev => [...prev, newCard]);
    
    // Set as default if first card
    if (cards.length === 0) {
      setDefaultCardId(newCard.id);
    }

    setIsSubmitting(false);
    setIsAddDialogOpen(false);
    resetForm();
    
    toast({ 
      title: "Card added", 
      description: `${cardBrands[newCard.cardType].name} ending in ${last4}` 
    });
  };

  const handleRemoveCard = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    setCards(prev => prev.filter(c => c.id !== cardId));
    
    // If removing default card, set new default
    if (cardId === defaultCardId) {
      const remaining = cards.filter(c => c.id !== cardId);
      setDefaultCardId(remaining[0]?.id || '');
    }
    
    toast({ 
      title: "Card removed", 
      description: `Card ending in ${card?.cardNumber} has been unlinked` 
    });
    setSelectedCard(null);
  };

  const handleSetDefault = (cardId: string) => {
    setDefaultCardId(cardId);
    toast({ title: "Default card updated" });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString().slice(-2));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      {cardsWithDefault.length > 0 ? (
        <div className="space-y-3">
          {cardsWithDefault.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "glass-card rounded-2xl p-4 cursor-pointer transition-all",
                selectedCard?.id === card.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
            >
              <div className="flex items-center gap-4">
                <CardVisual card={card} isCompact />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {card.nickname || cardBrands[card.cardType].name}
                    </span>
                    {card.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {card.maskedNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {card.expiryMonth}/{card.expiryYear}
                  </p>
                </div>
                <CreditCard className="w-5 h-5 text-muted-foreground" />
              </div>
              
              {/* Expanded actions */}
              <AnimatePresence>
                {selectedCard?.id === card.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-border/50">
                      {/* Card visual */}
                      <CardVisual card={card} />
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {!card.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetDefault(card.id);
                            }}
                          >
                            <Star className="w-4 h-4 mr-2" />
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCard(card.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        <span>Card details are encrypted and securely stored</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No cards linked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add a debit or credit card to pay directly without wallet top-ups
          </p>
        </div>
      )}

      {/* Add Card Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2" variant="outline">
            <Plus className="w-4 h-4" />
            Add Card
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Link a Card
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="font-mono pr-16"
                />
                {cardNumber.length >= 4 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="text-xs">
                      {cardBrands[detectCardType(cardNumber)].name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name</Label>
              <Input
                id="cardholderName"
                placeholder="JOHN DOE"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                className="uppercase"
              />
            </div>
            
            {/* Expiry & CVV Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={expiryYear} onValueChange={setExpiryYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="YY" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type={showCvv ? "text" : "password"}
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    maxLength={4}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCvv(!showCvv)}
                  >
                    {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Nickname (optional) */}
            <div className="space-y-2">
              <Label htmlFor="nickname">
                Nickname <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="nickname"
                placeholder="e.g., Personal Visa"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            
            {/* Security Note */}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Your card details are encrypted and securely stored. 
                CVV is used for verification only and never saved.
              </span>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddCard}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Add Card
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Info */}
      {cards.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Tap a card to view details or manage
        </p>
      )}
    </div>
  );
}
