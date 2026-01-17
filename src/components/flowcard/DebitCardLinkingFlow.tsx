/**
 * Debit Card Linking Flow
 * 
 * Streamlined flow specifically for linking debit cards as primary payment sources
 * for Flow Card. Uses the unified funding sources hook.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  Check, 
  Shield, 
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useFundingSources, type LinkedCard } from "@/hooks/useFundingSources";
import type { CardBrand } from "@/types";

// Card type detection based on number prefix
function detectCardType(number: string): CardBrand {
  const cleaned = number.replace(/\s/g, '');
  if (cleaned.startsWith('4')) return 'visa';
  if (cleaned.startsWith('34') || cleaned.startsWith('37')) return 'amex';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  return 'visa';
}

// Format card number with spaces
function formatCardNumber(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').substring(0, 19);
}

// Card brand config
const cardBrands = {
  visa: { 
    gradient: 'from-blue-600 to-blue-800', 
    name: 'Visa',
    icon: '💳'
  },
  mastercard: { 
    gradient: 'from-orange-500 to-red-600', 
    name: 'Mastercard',
    icon: '💳'
  },
  amex: { 
    gradient: 'from-slate-600 to-slate-800', 
    name: 'Amex',
    icon: '💳'
  },
};

interface DebitCardLinkingFlowProps {
  onComplete: (cardId: string) => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

type Step = 'intro' | 'form' | 'verifying' | 'success';

export default function DebitCardLinkingFlow({ 
  onComplete, 
  onSkip,
  showSkip = false 
}: DebitCardLinkingFlowProps) {
  const { toast } = useToast();
  const { cards, addCard } = useFundingSources();
  
  const [step, setStep] = useState<Step>('intro');
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedCardId, setLinkedCardId] = useState<string | null>(null);

  // Existing debit cards
  const existingDebitCards = cards.filter(c => c.fundingSourceType === 'debit_card');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString().slice(-2));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const detectedCardType = detectCardType(cardNumber);
  const brand = cardBrands[detectedCardType];

  const handleSubmit = async () => {
    // Validation
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
    setStep('verifying');

    // Simulate card verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const last4 = cleanedNumber.slice(-4);

    const result = await addCard({
      cardType: detectedCardType,
      last4,
      cardholderName: cardholderName.trim().toUpperCase(),
      expiryMonth,
      expiryYear,
      isDebit: true,
      nickname: `Debit •${last4}`,
    });

    setIsSubmitting(false);

    if (result.success && result.cardId) {
      setLinkedCardId(result.cardId);
      setStep('success');
      
      // Auto-complete after success animation
      setTimeout(() => {
        onComplete(result.cardId!);
      }, 2000);
    } else {
      setStep('form');
      toast({ 
        title: "Card verification failed", 
        description: result.error || "Please check your card details and try again",
        variant: "destructive" 
      });
    }
  };

  const handleSelectExisting = (card: LinkedCard) => {
    onComplete(card.id);
    toast({
      title: "Debit card selected",
      description: `${cardBrands[card.cardType].name} •${card.cardNumber} set as primary`
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {/* INTRO STEP */}
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Link Your Debit Card</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your debit card becomes the primary payment source for Flow Card. 
                Pay anywhere instantly.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              {[
                { icon: Zap, text: "Instant payments with no top-up needed" },
                { icon: Shield, text: "Bank-grade security with tokenization" },
                { icon: Star, text: "Primary source in Flow Card priority chain" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Existing Cards */}
            {existingDebitCards.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Or use an existing debit card:
                </p>
                <div className="space-y-2">
                  {existingDebitCards.map((card) => (
                    <motion.button
                      key={card.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectExisting(card)}
                      className="w-full flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className={cn(
                        "w-10 h-7 rounded-md flex items-center justify-center bg-gradient-to-br",
                        cardBrands[card.cardType].gradient
                      )}>
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {cardBrands[card.cardType].name} •{card.cardNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full gap-2" 
                onClick={() => setStep('form')}
              >
                <CreditCard className="w-4 h-4" />
                Add New Debit Card
              </Button>
              
              {showSkip && onSkip && (
                <Button 
                  variant="ghost" 
                  className="w-full text-muted-foreground"
                  onClick={onSkip}
                >
                  Skip for now
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* FORM STEP */}
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            {/* Card Preview */}
            <div className={cn(
              "relative w-full aspect-[1.586] rounded-2xl p-5 overflow-hidden bg-gradient-to-br",
              brand.gradient
            )}>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
              
              {/* Chip */}
              <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-300 to-amber-500 mb-4" />
              
              {/* Card number */}
              <div className="font-mono text-lg text-white tracking-wider mb-3">
                {cardNumber || '•••• •••• •••• ••••'}
              </div>
              
              {/* Bottom row */}
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/60 text-xs uppercase mb-1">Card Holder</p>
                  <p className="text-white font-medium uppercase tracking-wide text-sm">
                    {cardholderName || 'YOUR NAME'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-xs uppercase mb-1">Expires</p>
                  <p className="text-white font-mono text-sm">
                    {expiryMonth || 'MM'}/{expiryYear || 'YY'}
                  </p>
                </div>
              </div>
              
              {/* Brand */}
              <div className="absolute top-4 right-5">
                <span className="text-white font-bold text-lg italic">
                  {brand.name}
                </span>
              </div>

              {/* Debit badge */}
              <div className="absolute bottom-4 right-5">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  Debit
                </Badge>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
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
                    className="font-mono pr-20"
                    autoComplete="cc-number"
                  />
                  {cardNumber.length >= 4 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="secondary" className="text-xs">
                        {brand.name}
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
                  autoComplete="cc-name"
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
                  <Label>CVV</Label>
                  <div className="relative">
                    <Input
                      type={showCvv ? "text" : "password"}
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="font-mono pr-10"
                      autoComplete="cc-csc"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Your card details are encrypted and tokenized. We never store your full card number.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button 
                className="w-full gap-2" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Link Debit Card
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('intro')}
                disabled={isSubmitting}
              >
                Back
              </Button>
            </div>
          </motion.div>
        )}

        {/* VERIFYING STEP */}
        {step === 'verifying' && (
          <motion.div
            key="verifying"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12 text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Verifying Card</h3>
              <p className="text-sm text-muted-foreground">
                Securely connecting to your bank...
              </p>
            </div>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* SUCCESS STEP */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"
            >
              <Check className="w-10 h-10 text-green-500" />
            </motion.div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Card Linked!</h3>
              <p className="text-sm text-muted-foreground">
                Your debit card is now your primary payment source
              </p>
            </div>
            
            {/* Card summary */}
            <div className={cn(
              "inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br",
              brand.gradient
            )}>
              <CreditCard className="w-5 h-5 text-white" />
              <span className="text-white font-mono">
                •••• {cardNumber.slice(-4)}
              </span>
              <Badge className="bg-white/20 text-white border-0">
                Primary
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
