/**
 * Flow Card Visual Component
 * 
 * Digital card representation with status indicators.
 * Apple-level design with aurora gradient and glass effects.
 * Includes reveal/copy functionality for card credentials.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, Fingerprint, Shield, Pause, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PulsingDot } from '@/components/ui/micro-animations';
import type { FlowCardStatus, FlowCardMode } from '@/hooks/useFlowCard';
import flowCardLogo from '@/assets/flowcard-logo.png';

interface FlowCardVisualProps {
  status: FlowCardStatus;
  mode: FlowCardMode;
  lastFourDigits?: string;
  cardNumber?: string | null;
  cardCvv?: string | null;
  cardExpiry?: string | null;
  cardBrand?: 'visa' | 'mastercard' | null;
  isCompact?: boolean;
  showCredentials?: boolean;
}

const statusConfig: Record<FlowCardStatus, { label: string; color: string; icon: typeof Shield }> = {
  not_created: { label: 'Not Created', color: 'text-muted-foreground', icon: Shield },
  created: { label: 'Active', color: 'text-success', icon: Shield },
  suspended: { label: 'Suspended', color: 'text-warning', icon: Pause },
  terminated: { label: 'Terminated', color: 'text-destructive', icon: Shield },
};

const modeLabels: Record<FlowCardMode, string> = {
  in_app: 'In-App',
  network_placeholder: 'Network Ready',
  network_live: 'Network Live',
};

function formatCardNumber(number: string): string {
  return number.replace(/(.{4})/g, '$1 ').trim();
}

function maskCardNumber(number: string): string {
  return `•••• •••• •••• ${number.slice(-4)}`;
}

export function FlowCardVisual({ 
  status, 
  mode, 
  lastFourDigits = '••••',
  cardNumber,
  cardCvv,
  cardExpiry,
  cardBrand = 'visa',
  isCompact = false,
  showCredentials = true,
}: FlowCardVisualProps) {
  const { toast } = useToast();
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const config = statusConfig[status];
  const isActive = status === 'created';
  const isSuspended = status === 'suspended';
  const hasCredentials = !!cardNumber && !!cardCvv && !!cardExpiry;

  const copyToClipboard = useCallback(async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast({
        title: 'Copied!',
        description: `${fieldName} copied to clipboard`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy manually',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-full h-20 rounded-xl overflow-hidden ${
          isSuspended ? 'grayscale opacity-60' : ''
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 aurora-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img 
              src={flowCardLogo} 
              alt="Flow Card" 
              className="h-12 w-auto object-contain brightness-0 invert"
            />
            <div>
              <p className="text-white/70 text-xs">{modeLabels[mode]}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            <config.icon size={14} />
            <span className="text-xs font-medium text-white/90">{config.label}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`relative w-full aspect-[1.586/1] max-w-sm mx-auto ${
          isSuspended ? 'grayscale opacity-70' : ''
        }`}
        style={{ perspective: 1000 }}
      >
        {/* Card body */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-float-lg">
          {/* Aurora gradient background */}
          <div className="absolute inset-0 aurora-gradient animate-aurora" />
          
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10" />
          
          {/* Shimmer effect on active cards */}
          {isActive && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                repeatDelay: 2,
                ease: "easeInOut" 
              }}
            />
          )}
          
          {/* Subtle pattern */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          
          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <img 
                  src={flowCardLogo} 
                  alt="Flow Card" 
                  className="h-14 w-auto object-contain brightness-0 invert drop-shadow-lg"
                />
                <p className="text-white/70 text-sm mt-1">{modeLabels[mode]}</p>
              </div>
              
              {/* Status indicator with pulse */}
              <motion.div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-black/20'
                }`}
              >
                <PulsingDot 
                  color={isActive ? 'bg-green-400' : isSuspended ? 'bg-yellow-400' : 'bg-gray-400'} 
                  size="sm" 
                />
                <span className="text-white text-xs font-medium">{config.label}</span>
              </motion.div>
            </div>
            
            {/* Chip & NFC */}
            <div className="flex items-center gap-4">
              {/* Chip with subtle animation */}
              <motion.div 
                className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-400/80 shadow-sm overflow-hidden relative"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-full h-full rounded-md border border-yellow-600/30 grid grid-cols-3 gap-0.5 p-1">
                  {[...Array(6)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="bg-yellow-600/30 rounded-sm"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
              
              {/* NFC indicator with wave animation */}
              <motion.div
                animate={isActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="relative"
              >
                <Wifi size={24} className="text-white/80 rotate-90" />
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white/30"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </motion.div>
            </div>
            
            {/* Footer */}
            <div className="flex items-end justify-between">
              {/* Card number */}
              <div className="text-white/90 font-mono tracking-[0.15em] text-base">
                {isRevealed && cardNumber 
                  ? formatCardNumber(cardNumber)
                  : maskCardNumber(cardNumber || `0000${lastFourDigits}`)
                }
              </div>
              
              {/* Brand & Biometric */}
              <div className="flex items-center gap-2">
                {cardBrand === 'visa' && (
                  <span className="text-white font-bold text-lg italic tracking-tight">VISA</span>
                )}
                {cardBrand === 'mastercard' && (
                  <div className="flex -space-x-2">
                    <div className="w-5 h-5 rounded-full bg-red-500/80" />
                    <div className="w-5 h-5 rounded-full bg-yellow-500/80" />
                  </div>
                )}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Fingerprint size={18} className="text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Glow effect */}
        {isActive && (
          <div className="absolute -inset-1 aurora-gradient rounded-2xl blur-xl opacity-30 -z-10" />
        )}
      </motion.div>

      {/* Credential Details Panel */}
      {showCredentials && hasCredentials && isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4 space-y-3"
        >
          {/* Reveal Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Card Details</span>
            <button
              onClick={() => setIsRevealed(!isRevealed)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isRevealed ? 'revealed' : 'hidden'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {/* Card Number */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Card Number</p>
                  <p className="font-mono text-sm">
                    {isRevealed ? formatCardNumber(cardNumber!) : maskCardNumber(cardNumber!)}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(cardNumber!, 'Card Number')}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                >
                  {copiedField === 'Card Number' ? (
                    <Check size={16} className="text-success" />
                  ) : (
                    <Copy size={16} className="text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry</p>
                    <p className="font-mono text-sm">
                      {isRevealed ? cardExpiry : '••/••'}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cardExpiry!, 'Expiry')}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    {copiedField === 'Expiry' ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">CVV</p>
                    <p className="font-mono text-sm">
                      {isRevealed ? cardCvv : '•••'}
                    </p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cardCvv!, 'CVV')}
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                  >
                    {copiedField === 'CVV' ? (
                      <Check size={16} className="text-success" />
                    ) : (
                      <Copy size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Usage note */}
              <p className="text-xs text-muted-foreground text-center pt-2">
                Use these credentials for Apple Pay / Google Pay enrollment
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
