/**
 * FLOW Protocol - Layer 2: Balance Sync (Screenshot)
 * 
 * Lets users take a screenshot of their wallet app and FLOW extracts the balance.
 * The "secret sauce" - no API partnerships needed!
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BalanceExtraction {
  walletName: string;
  balance: number | null;
  currency: string;
  confidence: number;
  secondaryBalances?: Array<{ label: string; amount: number }>;
  notes?: string;
}

export function useScreenshotBalance() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<BalanceExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process a screenshot image and extract balance
   */
  const extractBalanceFromScreenshot = useCallback(async (
    imageData: string, // base64 or data URL
    walletHint?: string // Optional hint about which wallet
  ): Promise<BalanceExtraction | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('screenshot-balance', {
        body: { 
          imageBase64: imageData,
          walletHint 
        }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const extraction: BalanceExtraction = {
        walletName: data.walletName,
        balance: data.balance,
        currency: data.currency || 'MYR',
        confidence: data.confidence,
        secondaryBalances: data.secondaryBalances,
        notes: data.notes,
      };

      setLastExtraction(extraction);

      // Show success feedback
      if (extraction.balance !== null && extraction.confidence > 0.5) {
        toast({
          title: `${extraction.walletName} detected`,
          description: `Balance: RM ${extraction.balance.toFixed(2)}`,
        });
      } else if (extraction.confidence <= 0.5) {
        toast({
          title: "Low confidence",
          description: "Couldn't clearly read the balance. Try a clearer screenshot.",
          variant: "destructive",
        });
      }

      return extraction;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process screenshot';
      setError(message);
      toast({
        title: "Processing failed",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  /**
   * Handle file input change (for file picker)
   */
  const handleFileSelect = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    walletHint?: string
  ): Promise<BalanceExtraction | null> => {
    const file = event.target.files?.[0];
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return null;
    }

    // Convert to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const result = await extractBalanceFromScreenshot(base64, walletHint);
        resolve(result);
      };
      reader.onerror = () => {
        toast({
          title: "Read error",
          description: "Could not read the file",
          variant: "destructive",
        });
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  }, [extractBalanceFromScreenshot, toast]);

  /**
   * Update a funding source with extracted balance
   */
  const applyExtractionToSource = useCallback(async (
    extraction: BalanceExtraction,
    sourceId: string
  ): Promise<boolean> => {
    if (extraction.balance === null) {
      toast({
        title: "No balance to apply",
        description: "The extraction didn't find a balance",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('funding_sources')
        .update({ balance: extraction.balance })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      toast({
        title: "Balance updated",
        description: `Set to RM ${extraction.balance.toFixed(2)}`,
      });

      return true;
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update balance",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  return {
    isProcessing,
    lastExtraction,
    error,
    extractBalanceFromScreenshot,
    handleFileSelect,
    applyExtractionToSource,
  };
}
