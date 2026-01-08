/**
 * Surface B: OS Share Sheet Invocation
 * 
 * Handles content shared via OS share sheet:
 * - Payment links
 * - QR images
 * - Payment requests
 * - Contacts
 * 
 * Always routes to Resolve screen, never executes directly.
 */

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SharedContent {
  type: 'payment_link' | 'qr_image' | 'payment_request' | 'contact' | 'unknown';
  rawContent: string;
  parsed?: {
    merchantId?: string;
    merchantName?: string;
    recipientName?: string;
    recipientPhone?: string;
    amount?: number;
    currency?: string;
    reference?: string;
  };
}

export const useShareSheetSurface = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Parse shared content into structured data
  const parseSharedContent = useCallback((content: string): SharedContent => {
    const trimmed = content.trim();
    
    // Check for payment links (flow:// or https with payment params)
    if (trimmed.startsWith('flow://pay/') || trimmed.startsWith('flow://request/')) {
      const isRequest = trimmed.includes('/request/');
      const path = trimmed.replace('flow://pay/', '').replace('flow://request/', '');
      const [merchantOrRecipient, ...rest] = path.split('/');
      const params = new URLSearchParams(rest.join('/').split('?')[1] || '');
      
      return {
        type: isRequest ? 'payment_request' : 'payment_link',
        rawContent: content,
        parsed: {
          merchantId: isRequest ? undefined : merchantOrRecipient,
          merchantName: isRequest ? undefined : decodeURIComponent(merchantOrRecipient),
          recipientName: isRequest ? decodeURIComponent(merchantOrRecipient) : undefined,
          amount: params.get('amount') ? parseFloat(params.get('amount')!) : undefined,
          currency: params.get('currency') || 'MYR',
          reference: params.get('ref') || undefined,
        },
      };
    }

    // Check for HTTPS payment links
    if (trimmed.includes('flow.app/pay') || trimmed.includes('flow.app/request')) {
      try {
        const url = new URL(trimmed);
        const isRequest = url.pathname.includes('/request');
        const pathParts = url.pathname.split('/').filter(Boolean);
        const merchantOrRecipient = pathParts[pathParts.length - 1];
        
        return {
          type: isRequest ? 'payment_request' : 'payment_link',
          rawContent: content,
          parsed: {
            merchantId: isRequest ? undefined : merchantOrRecipient,
            merchantName: isRequest ? undefined : decodeURIComponent(merchantOrRecipient),
            recipientName: isRequest ? decodeURIComponent(merchantOrRecipient) : undefined,
            amount: url.searchParams.get('amount') ? parseFloat(url.searchParams.get('amount')!) : undefined,
            currency: url.searchParams.get('currency') || 'MYR',
            reference: url.searchParams.get('ref') || undefined,
          },
        };
      } catch {
        // Not a valid URL
      }
    }

    // Check for contact format (phone number or contact card)
    const phoneRegex = /^(\+?6?01)[0-9]{8,9}$/;
    if (phoneRegex.test(trimmed.replace(/\s|-/g, ''))) {
      return {
        type: 'contact',
        rawContent: content,
        parsed: {
          recipientPhone: trimmed.replace(/\s|-/g, ''),
          recipientName: 'Unknown Contact',
        },
      };
    }

    // Check for vCard format
    if (trimmed.includes('BEGIN:VCARD')) {
      const nameMatch = trimmed.match(/FN:(.+)/);
      const phoneMatch = trimmed.match(/TEL[^:]*:(.+)/);
      
      if (nameMatch || phoneMatch) {
        return {
          type: 'contact',
          rawContent: content,
          parsed: {
            recipientName: nameMatch?.[1]?.trim() || 'Unknown Contact',
            recipientPhone: phoneMatch?.[1]?.replace(/\s|-/g, '').trim(),
          },
        };
      }
    }

    // Check for QR data patterns (base64 image or raw QR content)
    if (trimmed.startsWith('data:image/') || trimmed.includes('MERCHANT:')) {
      // For QR images, we'd need to decode - for now treat as potential QR
      const merchantMatch = trimmed.match(/MERCHANT:([^|]+)/);
      const amountMatch = trimmed.match(/AMOUNT:([^|]+)/);
      
      return {
        type: 'qr_image',
        rawContent: content,
        parsed: merchantMatch ? {
          merchantId: merchantMatch[1],
          merchantName: merchantMatch[1],
          amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
          currency: 'MYR',
        } : undefined,
      };
    }

    return {
      type: 'unknown',
      rawContent: content,
    };
  }, []);

  // Log share sheet usage to PaymentSurfaces
  const logShareSheetUsage = useCallback(async (userId: string) => {
    try {
      const { data: existing } = await supabase
        .from('payment_surfaces')
        .select('id')
        .eq('user_id', userId)
        .eq('surface_type', 'share_sheet')
        .single();

      if (existing) {
        await supabase
          .from('payment_surfaces')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('payment_surfaces')
          .insert({
            user_id: userId,
            surface_type: 'share_sheet',
            enabled: true,
            last_used_at: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Failed to log share sheet usage:', error);
    }
  }, []);

  // Create intent from parsed shared content
  const createIntentFromSharedContent = useCallback(async (
    userId: string,
    content: SharedContent
  ): Promise<string | null> => {
    if (!content.parsed) {
      return null;
    }

    const { parsed } = content;
    
    let intentType: 'PayMerchant' | 'SendMoney' | 'RequestMoney';
    let payeeName: string;
    let payeeIdentifier: string;

    switch (content.type) {
      case 'payment_link':
      case 'qr_image':
        intentType = 'PayMerchant';
        payeeName = parsed.merchantName || 'Unknown Merchant';
        payeeIdentifier = parsed.merchantId || 'unknown';
        break;
      case 'payment_request':
        intentType = 'RequestMoney';
        payeeName = parsed.recipientName || 'Unknown';
        payeeIdentifier = parsed.recipientPhone || 'unknown';
        break;
      case 'contact':
        intentType = 'SendMoney';
        payeeName = parsed.recipientName || 'Unknown Contact';
        payeeIdentifier = parsed.recipientPhone || 'unknown';
        break;
      default:
        return null;
    }

    const { data, error } = await supabase
      .from('intents')
      .insert({
        user_id: userId,
        type: intentType,
        payee_name: payeeName,
        payee_identifier: payeeIdentifier,
        amount: parsed.amount || 0,
        currency: parsed.currency || 'MYR',
        metadata: {
          source: 'share_sheet',
          reference: parsed.reference,
          raw_content: content.rawContent,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create intent from shared content:', error);
      return null;
    }

    return data.id;
  }, []);

  // Handle shared content from OS share sheet
  const handleSharedContent = useCallback(async (rawContent: string) => {
    setIsProcessing(true);
    setLastError(null);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Store for after login
        sessionStorage.setItem('pendingSharedContent', rawContent);
        toast.info('Please sign in to complete this payment');
        navigate('/auth');
        return;
      }

      // Parse the shared content
      const parsed = parseSharedContent(rawContent);

      if (parsed.type === 'unknown' || !parsed.parsed) {
        setLastError('Unable to recognize this payment format');
        toast.error('Unable to recognize this payment format', {
          description: 'The shared content could not be parsed as a payment.',
        });
        return;
      }

      // Log share sheet usage
      await logShareSheetUsage(user.id);

      // Create intent
      const intentId = await createIntentFromSharedContent(user.id, parsed);

      if (!intentId) {
        setLastError('Failed to create payment intent');
        toast.error('Failed to create payment', {
          description: 'Please try again or use the scanner.',
        });
        return;
      }

      // Navigate to resolve screen
      toast.success('Payment loaded', {
        description: `Ready to ${parsed.type === 'contact' ? 'send to' : 'pay'} ${parsed.parsed?.merchantName || parsed.parsed?.recipientName}`,
      });
      navigate(`/resolve/${intentId}`);

    } catch (error) {
      console.error('Error handling shared content:', error);
      setLastError('An unexpected error occurred');
      toast.error('Something went wrong', {
        description: 'Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [navigate, parseSharedContent, logShareSheetUsage, createIntentFromSharedContent]);

  // Listen for app URL open events (share sheet invocations)
  useEffect(() => {
    const setupListener = async () => {
      try {
        // Listen for URLs opened via share sheet
        const listener = await App.addListener('appUrlOpen', async (event) => {
          const { url } = event;
          
          // Check if this is a share sheet invocation
          if (url.includes('share=') || url.includes('content=')) {
            const urlObj = new URL(url);
            const sharedContent = urlObj.searchParams.get('share') || 
                                  urlObj.searchParams.get('content') || 
                                  url;
            await handleSharedContent(decodeURIComponent(sharedContent));
          } else {
            // Treat the entire URL as potential shared content
            await handleSharedContent(url);
          }
        });

        return () => {
          listener.remove();
        };
      } catch (error) {
        // Not running in Capacitor, provide simulation support
        console.log('Share sheet listener: Running in web mode');
      }
    };

    setupListener();
  }, [handleSharedContent]);

  // Check for pending shared content after auth
  useEffect(() => {
    const checkPendingContent = async () => {
      const pending = sessionStorage.getItem('pendingSharedContent');
      if (pending) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          sessionStorage.removeItem('pendingSharedContent');
          await handleSharedContent(pending);
        }
      }
    };

    checkPendingContent();
  }, [handleSharedContent]);

  // Simulate share sheet for testing in web
  const simulateShareSheet = useCallback(async (content: string) => {
    await handleSharedContent(content);
  }, [handleSharedContent]);

  return {
    isProcessing,
    lastError,
    parseSharedContent,
    simulateShareSheet,
  };
};
