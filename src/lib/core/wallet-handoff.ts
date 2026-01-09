/**
 * FLOW Wallet Handoff
 * 
 * Deep links to Malaysian wallet/bank apps for actual payment completion.
 * This is the bridge from FLOW orchestration → real-world execution.
 */

// Deep link schemes for Malaysian payment apps
// NOTE: These are documented/known schemes - actual availability depends on device
export const WALLET_DEEP_LINKS: Record<string, {
  scheme: string;
  fallbackUrl: string;
  displayName: string;
}> = {
  TouchNGo: {
    scheme: 'tngew://', // Touch 'n Go eWallet
    fallbackUrl: 'https://www.tngdigital.com.my/wallet',
    displayName: "Touch 'n Go",
  },
  GrabPay: {
    scheme: 'grab://', // Grab super app
    fallbackUrl: 'https://www.grab.com/my/pay/',
    displayName: 'GrabPay',
  },
  Boost: {
    scheme: 'boostapp://', // Boost eWallet
    fallbackUrl: 'https://www.myboost.com.my/',
    displayName: 'Boost',
  },
  DuitNow: {
    scheme: 'duitnow://', // DuitNow (if supported by banking app)
    fallbackUrl: 'https://www.duitnow.my/',
    displayName: 'DuitNow',
  },
  Maybank: {
    scheme: 'maybank2u://', // Maybank MAE/M2U
    fallbackUrl: 'https://www.maybank2u.com.my/',
    displayName: 'Maybank',
  },
  BankTransfer: {
    scheme: '', // No specific app - use DuitNow or bank app
    fallbackUrl: 'https://www.duitnow.my/',
    displayName: 'Bank Transfer',
  },
  VisaMastercard: {
    scheme: '', // Card payments don't have app handoff
    fallbackUrl: '',
    displayName: 'Card',
  },
  Atome: {
    scheme: 'atome://', // Atome BNPL app
    fallbackUrl: 'https://www.atome.my/',
    displayName: 'Atome',
  },
  ShopeePay: {
    scheme: 'shopeepay://', // ShopeePay eWallet
    fallbackUrl: 'https://shopee.com.my/',
    displayName: 'ShopeePay',
  },
  BigPay: {
    scheme: 'bigpay://', // BigPay by AirAsia
    fallbackUrl: 'https://www.bigpayme.com/',
    displayName: 'BigPay',
  },
};

/**
 * Attempt to open wallet app via deep link
 * Falls back to web URL if app not installed
 */
export function openWalletApp(
  rail: string,
  options?: {
    amount?: number;
    merchant?: string;
    reference?: string;
  }
): { attempted: boolean; method: 'deeplink' | 'web' | 'none' } {
  const config = WALLET_DEEP_LINKS[rail];
  
  if (!config) {
    console.warn(`No deep link config for rail: ${rail}`);
    return { attempted: false, method: 'none' };
  }

  // Build deep link with optional parameters
  let deepLinkUrl = config.scheme;
  if (config.scheme && options) {
    // Some wallets support query params in deep links
    const params = new URLSearchParams();
    if (options.amount) params.set('amount', options.amount.toString());
    if (options.merchant) params.set('merchant', options.merchant);
    if (options.reference) params.set('ref', options.reference);
    
    if (params.toString()) {
      deepLinkUrl += `?${params.toString()}`;
    }
  }

  // Try deep link first (only on mobile with scheme)
  if (config.scheme) {
    try {
      // Use window.location for deep link - most reliable cross-platform method
      window.location.href = deepLinkUrl;
      return { attempted: true, method: 'deeplink' };
    } catch (e) {
      console.log('Deep link failed, trying web fallback');
    }
  }

  // Fallback to web URL
  if (config.fallbackUrl) {
    window.open(config.fallbackUrl, '_blank');
    return { attempted: true, method: 'web' };
  }

  return { attempted: false, method: 'none' };
}

/**
 * Check if we're likely on a mobile device where deep links work
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get the display name for a rail
 */
export function getRailDisplayName(rail: string): string {
  return WALLET_DEEP_LINKS[rail]?.displayName || rail;
}

/**
 * Check if a rail supports app handoff
 */
export function supportsAppHandoff(rail: string): boolean {
  const config = WALLET_DEEP_LINKS[rail];
  return !!(config?.scheme || config?.fallbackUrl);
}
