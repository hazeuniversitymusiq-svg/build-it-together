/**
 * QR to Intent Converter
 * 
 * Converts parsed QR data into FLOW payment intents.
 * Supports:
 * - EMVCo (DuitNow, PayNow, etc.)
 * - FLOW custom URLs
 * - Touch'n'Go specific formats
 */

import { parseEMVCo, isEMVCoQR, getPrimaryNetwork, getAvailableRails, type EMVCoData } from './emvco-parser';
import { supabase } from '@/integrations/supabase/client';

export interface ParsedQRIntent {
  success: boolean;
  error?: string;
  
  // Intent data
  type: 'PayMerchant' | 'SendMoney';
  merchantName: string;
  merchantId: string;
  amount?: number;
  currency: string;
  reference?: string;
  
  // Routing info
  primaryRail: string;
  availableRails: string[];
  
  // Raw data for debugging
  rawQR: string;
  parsedEMVCo?: EMVCoData;
}

/**
 * Parse any QR code and convert to FLOW intent data
 */
export function parseQRToIntent(qrData: string): ParsedQRIntent {
  const trimmedData = qrData.trim();
  
  // Try FLOW custom URL first
  if (trimmedData.startsWith('flow://')) {
    return parseFlowURL(trimmedData);
  }
  
  // Try EMVCo format (DuitNow, TouchNGo, etc.)
  if (isEMVCoQR(trimmedData)) {
    return parseEMVCoToIntent(trimmedData);
  }
  
  // Try to detect other formats
  
  // Touch'n'Go sometimes uses different prefixes
  if (trimmedData.includes('tngdigital') || trimmedData.includes('TNG')) {
    return parseEMVCoToIntent(trimmedData);
  }
  
  // Unknown format - try EMVCo anyway as fallback
  const emvResult = parseEMVCoToIntent(trimmedData);
  if (emvResult.success) {
    return emvResult;
  }
  
  return {
    success: false,
    error: 'Unrecognized QR code format. Supported: DuitNow, Touch\'n\'Go, GrabPay, Boost',
    type: 'PayMerchant',
    merchantName: 'Unknown',
    merchantId: 'unknown',
    currency: 'MYR',
    primaryRail: 'DuitNow',
    availableRails: [],
    rawQR: trimmedData,
  };
}

/**
 * Parse FLOW custom URL format
 * Format: flow://pay/{merchant}/{amount}[/{reference}]
 */
function parseFlowURL(url: string): ParsedQRIntent {
  try {
    // flow://pay/merchant-name/12.50/REF-001
    const parts = url.replace('flow://pay/', '').split('/');
    const merchantName = decodeURIComponent(parts[0] || 'Unknown');
    const amount = parts[1] ? parseFloat(parts[1]) : undefined;
    const reference = parts[2] ? decodeURIComponent(parts[2]) : undefined;
    
    return {
      success: true,
      type: 'PayMerchant',
      merchantName,
      merchantId: merchantName.toLowerCase().replace(/\s+/g, '_'),
      amount,
      currency: 'MYR',
      reference,
      primaryRail: 'TouchNGo',
      availableRails: ['TouchNGo', 'GrabPay', 'Boost', 'DuitNow'],
      rawQR: url,
    };
  } catch {
    return {
      success: false,
      error: 'Invalid FLOW URL format',
      type: 'PayMerchant',
      merchantName: 'Unknown',
      merchantId: 'unknown',
      currency: 'MYR',
      primaryRail: 'DuitNow',
      availableRails: [],
      rawQR: url,
    };
  }
}

/**
 * Parse EMVCo QR to FLOW intent
 */
function parseEMVCoToIntent(qrData: string): ParsedQRIntent {
  const parsed = parseEMVCo(qrData);
  
  if (!parsed) {
    return {
      success: false,
      error: 'Failed to parse payment QR code',
      type: 'PayMerchant',
      merchantName: 'Unknown',
      merchantId: 'unknown',
      currency: 'MYR',
      primaryRail: 'DuitNow',
      availableRails: [],
      rawQR: qrData,
    };
  }
  
  const primaryRail = getPrimaryNetwork(parsed);
  const availableRails = getAvailableRails(parsed);
  
  // Generate merchant ID from name or use reference
  const merchantId = parsed.additionalData?.referenceLabel || 
                     parsed.additionalData?.terminalLabel ||
                     parsed.merchantName.toLowerCase().replace(/\s+/g, '_');
  
  return {
    success: true,
    type: 'PayMerchant',
    merchantName: parsed.merchantName,
    merchantId,
    amount: parsed.amount,
    currency: parsed.currencyCode,
    reference: parsed.additionalData?.referenceLabel || parsed.additionalData?.billNumber,
    primaryRail,
    availableRails,
    rawQR: qrData,
    parsedEMVCo: parsed,
  };
}

/**
 * Create a database intent from parsed QR data
 */
export async function createIntentFromParsedQR(
  userId: string,
  parsedQR: ParsedQRIntent,
  options?: {
    selectedFundingSourceId?: string | null;
    selectedFundingSourceName?: string;
  }
): Promise<{ success: boolean; intentId?: string; error?: string }> {
  if (!parsedQR.success) {
    return { success: false, error: parsedQR.error };
  }

  try {
    // Create intent in database
    const { data: intent, error } = await supabase
      .from('intents')
      .insert({
        user_id: userId,
        type: parsedQR.type,
        amount: parsedQR.amount || 0,
        currency: parsedQR.currency,
        payee_name: parsedQR.merchantName,
        payee_identifier: parsedQR.merchantId,
        metadata: {
          reference: parsedQR.reference,
          primaryRail: parsedQR.primaryRail,
          availableRails: parsedQR.availableRails,
          rawQR: parsedQR.rawQR,
          parsedAt: new Date().toISOString(),
          userSelectedFundingSourceId: options?.selectedFundingSourceId,
          userSelectedFundingSourceName: options?.selectedFundingSourceName,
        },
      })
      .select('id')
      .single();

    if (error || !intent) {
      return { success: false, error: 'Failed to create payment intent' };
    }

    return { success: true, intentId: intent.id };
  } catch (err) {
    console.error('Create intent error:', err);
    return { success: false, error: 'Database error' };
  }
}
