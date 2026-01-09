/**
 * EMVCo QR Code Parser
 * 
 * Parses EMVCo-compliant QR codes used by:
 * - DuitNow (Malaysia)
 * - PayNow (Singapore)
 * - PromptPay (Thailand)
 * - Touch'n'Go (Malaysia)
 * - Most Southeast Asian payment QRs
 * 
 * Format: TLV (Tag-Length-Value) encoded string
 */

export interface EMVCoData {
  // Core fields
  payloadFormatIndicator: string; // Tag 00
  pointOfInitiation: 'static' | 'dynamic'; // Tag 01: 11=static, 12=dynamic
  
  // Merchant info
  merchantAccountInfo: MerchantAccountInfo[];
  merchantCategoryCode?: string; // Tag 52
  merchantName: string; // Tag 59
  merchantCity?: string; // Tag 60
  postalCode?: string; // Tag 61
  
  // Transaction
  currency: string; // Tag 53 (ISO 4217 numeric code)
  currencyCode: string; // Converted to 3-letter code
  amount?: number; // Tag 54 (optional for static QR)
  
  // Country
  countryCode: string; // Tag 58
  
  // Additional data
  additionalData?: AdditionalData; // Tag 62
  
  // CRC
  crc: string; // Tag 63
  
  // Raw parsed data
  raw: Record<string, TLVField>;
}

export interface MerchantAccountInfo {
  tag: string;
  globallyUniqueId: string; // Sub-tag 00
  paymentNetwork?: string;
  merchantId?: string;
  rawData: Record<string, TLVField>;
}

export interface AdditionalData {
  billNumber?: string; // Tag 01
  mobileNumber?: string; // Tag 02
  storeLabel?: string; // Tag 03
  loyaltyNumber?: string; // Tag 04
  referenceLabel?: string; // Tag 05
  customerLabel?: string; // Tag 06
  terminalLabel?: string; // Tag 07
  purposeOfTransaction?: string; // Tag 08
  rawData: Record<string, TLVField>;
}

export interface TLVField {
  id: string;
  length: number;
  value: string;
  nested?: Record<string, TLVField>;
}

// ISO 4217 currency codes
const CURRENCY_MAP: Record<string, string> = {
  '458': 'MYR', // Malaysian Ringgit
  '702': 'SGD', // Singapore Dollar
  '764': 'THB', // Thai Baht
  '360': 'IDR', // Indonesian Rupiah
  '608': 'PHP', // Philippine Peso
  '840': 'USD', // US Dollar
};

// Known payment network identifiers
const KNOWN_NETWORKS: Record<string, string> = {
  'com.duitnow': 'DuitNow',
  'my.com.tngdigital.ewallet': 'TouchNGo',
  'my.com.grabpay': 'GrabPay',
  'my.com.boost': 'Boost',
  'sg.com.nets': 'NETS',
  'sg.paynow': 'PayNow',
};

/**
 * Parse TLV encoded string
 */
function parseTLV(data: string): Record<string, TLVField> {
  const result: Record<string, TLVField> = {};
  let position = 0;

  while (position < data.length) {
    // Get tag (2 characters)
    const id = data.substring(position, position + 2);
    position += 2;

    // Get length (2 characters)
    const lengthStr = data.substring(position, position + 2);
    const length = parseInt(lengthStr, 10);
    position += 2;

    if (isNaN(length) || position + length > data.length) {
      break;
    }

    // Get value
    const value = data.substring(position, position + length);
    position += length;

    result[id] = { id, length, value };
  }

  return result;
}

/**
 * Parse nested TLV (for merchant account info, additional data)
 */
function parseNestedTLV(field: TLVField): TLVField {
  return {
    ...field,
    nested: parseTLV(field.value),
  };
}

/**
 * Detect payment network from globally unique identifier
 */
function detectPaymentNetwork(guid: string): string | undefined {
  const guidLower = guid.toLowerCase();
  for (const [key, name] of Object.entries(KNOWN_NETWORKS)) {
    if (guidLower.includes(key.toLowerCase())) {
      return name;
    }
  }
  
  // Check for DuitNow patterns
  if (guidLower.includes('duitnow') || guidLower.includes('my.paynet')) {
    return 'DuitNow';
  }
  
  return undefined;
}

/**
 * Parse EMVCo QR code string
 */
export function parseEMVCo(qrData: string): EMVCoData | null {
  try {
    const raw = parseTLV(qrData);

    // Validate required fields
    if (!raw['00'] || !raw['59'] || !raw['58'] || !raw['53']) {
      return null;
    }

    // Parse merchant account info (tags 26-51)
    const merchantAccountInfo: MerchantAccountInfo[] = [];
    for (let tag = 26; tag <= 51; tag++) {
      const tagStr = tag.toString().padStart(2, '0');
      if (raw[tagStr]) {
        const nested = parseNestedTLV(raw[tagStr]);
        const guid = nested.nested?.['00']?.value || '';
        merchantAccountInfo.push({
          tag: tagStr,
          globallyUniqueId: guid,
          paymentNetwork: detectPaymentNetwork(guid),
          merchantId: nested.nested?.['01']?.value || nested.nested?.['02']?.value,
          rawData: nested.nested || {},
        });
      }
    }

    // Parse additional data (tag 62)
    let additionalData: AdditionalData | undefined;
    if (raw['62']) {
      const nested = parseNestedTLV(raw['62']);
      additionalData = {
        billNumber: nested.nested?.['01']?.value,
        mobileNumber: nested.nested?.['02']?.value,
        storeLabel: nested.nested?.['03']?.value,
        loyaltyNumber: nested.nested?.['04']?.value,
        referenceLabel: nested.nested?.['05']?.value,
        customerLabel: nested.nested?.['06']?.value,
        terminalLabel: nested.nested?.['07']?.value,
        purposeOfTransaction: nested.nested?.['08']?.value,
        rawData: nested.nested || {},
      };
    }

    // Get currency
    const currencyNumeric = raw['53']?.value || '458';
    const currencyCode = CURRENCY_MAP[currencyNumeric] || 'MYR';

    // Parse amount if present
    const amount = raw['54'] ? parseFloat(raw['54'].value) : undefined;

    return {
      payloadFormatIndicator: raw['00'].value,
      pointOfInitiation: raw['01']?.value === '12' ? 'dynamic' : 'static',
      merchantAccountInfo,
      merchantCategoryCode: raw['52']?.value,
      merchantName: raw['59'].value,
      merchantCity: raw['60']?.value,
      postalCode: raw['61']?.value,
      currency: currencyNumeric,
      currencyCode,
      amount,
      countryCode: raw['58'].value,
      additionalData,
      crc: raw['63']?.value || '',
      raw,
    };
  } catch (error) {
    console.error('EMVCo parse error:', error);
    return null;
  }
}

/**
 * Check if a string looks like an EMVCo QR code
 */
export function isEMVCoQR(data: string): boolean {
  // EMVCo QRs start with "000201" (Tag 00, Length 02, Value 01)
  return data.startsWith('000201') || data.startsWith('00020101');
}

/**
 * Get primary payment network from parsed EMVCo data
 */
export function getPrimaryNetwork(data: EMVCoData): string {
  // Find first recognized network
  for (const mai of data.merchantAccountInfo) {
    if (mai.paymentNetwork) {
      return mai.paymentNetwork;
    }
  }
  
  // Default based on country
  if (data.countryCode === 'MY') return 'DuitNow';
  if (data.countryCode === 'SG') return 'PayNow';
  
  return 'Unknown';
}

/**
 * Get available payment rails from EMVCo data
 */
export function getAvailableRails(data: EMVCoData): string[] {
  const rails: string[] = [];
  
  for (const mai of data.merchantAccountInfo) {
    if (mai.paymentNetwork) {
      rails.push(mai.paymentNetwork);
    }
  }
  
  // If DuitNow, add common Malaysian wallets as options
  if (data.countryCode === 'MY') {
    if (!rails.includes('DuitNow')) rails.push('DuitNow');
    if (!rails.includes('TouchNGo')) rails.push('TouchNGo');
    if (!rails.includes('GrabPay')) rails.push('GrabPay');
    if (!rails.includes('Boost')) rails.push('Boost');
  }
  
  return rails;
}
