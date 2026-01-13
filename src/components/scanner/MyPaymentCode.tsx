/**
 * My Payment Code Component
 * 
 * Generates user's DuitNow QR code for receiving money.
 * iOS 26 Liquid Glass design.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Check, QrCode, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MyPaymentCodeProps {
  isOpen: boolean;
  onClose: () => void;
}

const MyPaymentCode = ({ isOpen, onClose }: MyPaymentCodeProps) => {
  const { toast } = useToast();
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<'DuitNow' | 'TouchNGo' | 'GrabPay'>('DuitNow');

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('phone')
          .eq('id', user.id)
          .single();
        
        if (userData?.phone) {
          setUserPhone(userData.phone);
        }
      }
    };
    
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  const handleCopy = async () => {
    if (userPhone) {
      await navigator.clipboard.writeText(userPhone);
      setCopied(true);
      toast({ title: "Copied!", description: "Phone number copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && userPhone) {
      try {
        await navigator.share({
          title: 'Pay me via FLOW',
          text: `Send money to ${userPhone} via ${selectedWallet}`,
        });
      } catch (e) {
        // User cancelled share
      }
    }
  };

  // Generate a simple QR placeholder (in production would use real DuitNow QR)
  const generateQRPattern = () => {
    const size = 180;
    const cells = 9;
    const cellSize = size / cells;
    const pattern: JSX.Element[] = [];

    // Simple deterministic pattern based on phone
    const seed = userPhone ? userPhone.split('').reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
    
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        // Position markers (top-left, top-right, bottom-left corners)
        const isCorner = (
          (x < 3 && y < 3) ||
          (x >= cells - 3 && y < 3) ||
          (x < 3 && y >= cells - 3)
        );
        
        const isCornerOuter = isCorner && (x === 0 || x === 2 || x === cells - 1 || x === cells - 3 || y === 0 || y === 2 || y === cells - 1 || y === cells - 3);
        const isCornerInner = isCorner && (x === 1 || x === cells - 2) && (y === 1 || y === cells - 2);
        
        // Data pattern
        const shouldFill = isCornerOuter || isCornerInner || ((seed + x * y) % 3 === 0 && !isCorner);
        
        if (shouldFill) {
          pattern.push(
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize - 1}
              height={cellSize - 1}
              className="fill-foreground"
              rx={2}
            />
          );
        }
      }
    }
    
    return pattern;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-background rounded-t-3xl p-6 pb-10 safe-area-bottom"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">My Payment Code</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 rounded-full glass-card"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Wallet Selector */}
          <div className="flex gap-2 mb-6">
            {(['DuitNow', 'TouchNGo', 'GrabPay'] as const).map((wallet) => (
              <button
                key={wallet}
                onClick={() => setSelectedWallet(wallet)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  selectedWallet === wallet
                    ? 'aurora-gradient text-white shadow-glow-blue'
                    : 'glass-card hover:bg-white/60 dark:hover:bg-white/10 text-foreground'
                }`}
              >
                <Wallet className="w-4 h-4" />
                {wallet === 'TouchNGo' ? 'TNG' : wallet}
              </button>
            ))}
          </div>

          {/* QR Code Display */}
          <div className="glass-card rounded-3xl p-6 mb-6 shadow-float-lg">
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* QR Code Container */}
                <div className="w-48 h-48 bg-white rounded-2xl p-3 shadow-float">
                  <svg viewBox="0 0 180 180" className="w-full h-full">
                    {generateQRPattern()}
                  </svg>
                </div>
                
                {/* Center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl aurora-gradient flex items-center justify-center shadow-glow-aurora">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-1">
                {userPhone || '+60 *** *** ***'}
              </p>
              <p className="text-sm text-muted-foreground">
                Scan to pay via {selectedWallet}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 h-12 rounded-2xl glass-card border-0"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5 mr-2 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy ID
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 h-12 rounded-2xl aurora-gradient text-white border-0 shadow-glow-aurora"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MyPaymentCode;
