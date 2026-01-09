/**
 * FLOW Protocol - Layers 4 & 5: Smart Handoff + Confirmation
 * 
 * Opens the target wallet app and tracks when user returns.
 * The "round-trip" experience that makes FLOW feel magical.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { openWalletApp, getRailDisplayName, supportsAppHandoff } from '@/lib/core/wallet-handoff';
import { useToast } from '@/hooks/use-toast';

export type HandoffState = 
  | 'idle'           // Not started
  | 'ready'          // Ready to hand off
  | 'handed_off'     // User is in wallet app
  | 'returned'       // User came back
  | 'confirming'     // Asking user to confirm
  | 'confirmed'      // User confirmed payment
  | 'cancelled';     // User said payment failed

export interface HandoffContext {
  rail: string;
  amount: number;
  merchant?: string;
  reference?: string;
  intentId?: string;
  planId?: string;
}

export function usePaymentHandoff() {
  const { toast } = useToast();
  const [state, setState] = useState<HandoffState>('idle');
  const [context, setContext] = useState<HandoffContext | null>(null);
  const [handoffTime, setHandoffTime] = useState<Date | null>(null);
  const wasHiddenRef = useRef(false);
  const handoffTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Listen for visibility changes to detect when user returns from wallet app
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page (probably went to wallet app)
        if (state === 'handed_off') {
          wasHiddenRef.current = true;
        }
      } else {
        // User returned
        if (state === 'handed_off' && wasHiddenRef.current) {
          wasHiddenRef.current = false;
          setState('returned');
          
          // Auto-transition to confirming after a brief moment
          setTimeout(() => {
            setState('confirming');
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state]);

  /**
   * Clean up timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (handoffTimeoutRef.current) {
        clearTimeout(handoffTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Initiate handoff to wallet app
   */
  const initiateHandoff = useCallback((handoffContext: HandoffContext): boolean => {
    const { rail, amount, merchant, reference } = handoffContext;

    if (!supportsAppHandoff(rail)) {
      toast({
        title: "App not supported",
        description: `${getRailDisplayName(rail)} doesn't support app handoff`,
        variant: "destructive",
      });
      return false;
    }

    setContext(handoffContext);
    setState('ready');

    // Attempt to open the wallet app
    const result = openWalletApp(rail, { amount, merchant, reference });

    if (result.attempted) {
      setState('handed_off');
      setHandoffTime(new Date());
      wasHiddenRef.current = false;

      toast({
        title: `Opening ${getRailDisplayName(rail)}`,
        description: "Complete the payment there, then return here",
      });

      // Set a timeout - if user doesn't return in 5 minutes, reset
      handoffTimeoutRef.current = setTimeout(() => {
        if (state === 'handed_off') {
          setState('confirming');
          toast({
            title: "Still waiting",
            description: "Did you complete the payment?",
          });
        }
      }, 5 * 60 * 1000);

      return true;
    } else {
      toast({
        title: "Couldn't open app",
        description: `Please open ${getRailDisplayName(rail)} manually`,
        variant: "destructive",
      });
      setState('idle');
      return false;
    }
  }, [toast, state]);

  /**
   * User confirms payment was completed
   */
  const confirmPayment = useCallback(() => {
    setState('confirmed');
    if (handoffTimeoutRef.current) {
      clearTimeout(handoffTimeoutRef.current);
    }
    toast({
      title: "Payment recorded",
      description: "Thanks for confirming!",
    });
  }, [toast]);

  /**
   * User says payment was NOT completed
   */
  const cancelPayment = useCallback(() => {
    setState('cancelled');
    if (handoffTimeoutRef.current) {
      clearTimeout(handoffTimeoutRef.current);
    }
  }, []);

  /**
   * Reset handoff state
   */
  const resetHandoff = useCallback(() => {
    setState('idle');
    setContext(null);
    setHandoffTime(null);
    wasHiddenRef.current = false;
    if (handoffTimeoutRef.current) {
      clearTimeout(handoffTimeoutRef.current);
    }
  }, []);

  /**
   * Get time elapsed since handoff
   */
  const getElapsedTime = useCallback((): number => {
    if (!handoffTime) return 0;
    return Date.now() - handoffTime.getTime();
  }, [handoffTime]);

  /**
   * Check if handoff is supported for a rail
   */
  const canHandoff = useCallback((rail: string): boolean => {
    return supportsAppHandoff(rail);
  }, []);

  return {
    state,
    context,
    handoffTime,
    initiateHandoff,
    confirmPayment,
    cancelPayment,
    resetHandoff,
    getElapsedTime,
    canHandoff,
  };
}
