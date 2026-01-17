/**
 * Branded Wallet & Bank Icons
 * 
 * SVG icons for Malaysian payment apps and banks
 */

import { cn } from '@/lib/utils';

interface BrandedIconProps {
  className?: string;
  size?: number;
}

// Touch 'n Go eWallet - Blue theme
export function TouchNGoIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="tng-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#004499" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#tng-gradient)" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="system-ui">
        TnG
      </text>
      <circle cx="32" cy="8" r="4" fill="#FFD700" />
    </svg>
  );
}

// GrabPay - Green theme
export function GrabPayIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="grab-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00B14F" />
          <stop offset="100%" stopColor="#009639" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#grab-gradient)" />
      <path 
        d="M20 10 L30 20 L20 30 L10 20 Z" 
        fill="white" 
        opacity="0.3"
      />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">
        Grab
      </text>
    </svg>
  );
}

// Boost - Red/Orange theme
export function BoostIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="boost-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#E64A19" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#boost-gradient)" />
      {/* Lightning bolt */}
      <path 
        d="M22 8 L16 20 L20 20 L18 32 L26 18 L22 18 Z" 
        fill="white"
      />
    </svg>
  );
}

// DuitNow - Purple/Blue theme
export function DuitNowIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="duitnow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#duitnow-gradient)" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">
        DuitNow
      </text>
    </svg>
  );
}

// Maybank - Yellow/Gold theme
export function MaybankIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="maybank-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#FFC107" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#maybank-gradient)" />
      {/* Tiger stripes pattern */}
      <rect x="6" y="12" width="28" height="3" fill="#1A1A1A" opacity="0.8" rx="1" />
      <rect x="6" y="18" width="28" height="3" fill="#1A1A1A" opacity="0.8" rx="1" />
      <rect x="6" y="24" width="28" height="3" fill="#1A1A1A" opacity="0.8" rx="1" />
      <text x="50%" y="90%" dominantBaseline="middle" textAnchor="middle" fill="#1A1A1A" fontSize="6" fontWeight="bold" fontFamily="system-ui">
        M
      </text>
    </svg>
  );
}

// CIMB - Red theme
export function CIMBIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="cimb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#cimb-gradient)" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="system-ui">
        CIMB
      </text>
    </svg>
  );
}

// Public Bank - Purple theme
export function PublicBankIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="public-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#public-gradient)" />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">
        PBB
      </text>
    </svg>
  );
}

// SPayLater - Orange theme
export function SPayLaterIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="spaylater-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#spaylater-gradient)" />
      <text x="50%" y="40%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="system-ui">
        SPay
      </text>
      <text x="50%" y="65%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="6" fontFamily="system-ui">
        Later
      </text>
    </svg>
  );
}

// Atome - Teal theme
export function AtomeIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="atome-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0D9488" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#atome-gradient)" />
      {/* Atom symbol */}
      <circle cx="20" cy="20" r="4" fill="white" />
      <ellipse cx="20" cy="20" rx="12" ry="5" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(-30 20 20)" />
      <ellipse cx="20" cy="20" rx="12" ry="5" fill="none" stroke="white" strokeWidth="1.5" transform="rotate(30 20 20)" />
    </svg>
  );
}

// Generic Bank icon
export function GenericBankIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="bank-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#bank-gradient)" />
      {/* Building icon */}
      <path d="M20 8 L32 16 L32 18 L8 18 L8 16 Z" fill="white" />
      <rect x="11" y="20" width="4" height="10" fill="white" />
      <rect x="18" y="20" width="4" height="10" fill="white" />
      <rect x="25" y="20" width="4" height="10" fill="white" />
      <rect x="8" y="31" width="24" height="2" fill="white" />
    </svg>
  );
}

// Generic Wallet icon
export function GenericWalletIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="wallet-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#wallet-gradient)" />
      {/* Wallet shape */}
      <rect x="8" y="12" width="24" height="16" rx="3" fill="white" />
      <rect x="24" y="18" width="8" height="4" rx="2" fill="url(#wallet-gradient)" />
      <circle cx="28" cy="20" r="1" fill="white" />
    </svg>
  );
}

// Card icon
export function CardIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#card-gradient)" />
      {/* Card shape */}
      <rect x="6" y="11" width="28" height="18" rx="3" fill="white" />
      <rect x="6" y="16" width="28" height="4" fill="#1A1A1A" />
      <rect x="10" y="23" width="10" height="2" rx="1" fill="#CBD5E1" />
    </svg>
  );
}

// TNB (Tenaga Nasional) - Yellow/Orange theme
export function TNBIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="tnb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#tnb-gradient)" />
      {/* Lightning bolt for electricity */}
      <path 
        d="M22 6 L14 20 L19 20 L16 34 L28 16 L22 16 Z" 
        fill="white"
      />
    </svg>
  );
}

// Maxis - Green theme
export function MaxisIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="maxis-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#maxis-gradient)" />
      {/* Signal bars */}
      <rect x="10" y="26" width="4" height="6" rx="1" fill="white" />
      <rect x="16" y="22" width="4" height="10" rx="1" fill="white" />
      <rect x="22" y="16" width="4" height="16" rx="1" fill="white" />
      <rect x="28" y="10" width="4" height="22" rx="1" fill="white" />
    </svg>
  );
}

// Unifi - Blue theme
export function UnifiIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="unifi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#unifi-gradient)" />
      {/* WiFi signal */}
      <path d="M20 28 a2 2 0 1 0 0.01 0" fill="white" />
      <path d="M14 24 Q20 18 26 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 20 Q20 10 30 20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Generic Biller icon
export function GenericBillerIcon({ className, size = 24 }: BrandedIconProps) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      width={size} 
      height={size} 
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="biller-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#biller-gradient)" />
      {/* Receipt icon */}
      <path d="M12 8 L28 8 L28 32 L24 28 L20 32 L16 28 L12 32 Z" fill="white" />
      <rect x="15" y="13" width="10" height="2" rx="1" fill="url(#biller-gradient)" />
      <rect x="15" y="18" width="7" height="2" rx="1" fill="url(#biller-gradient)" />
      <rect x="15" y="23" width="8" height="2" rx="1" fill="url(#biller-gradient)" />
    </svg>
  );
}

// Map source names to branded icons
export function getBrandedIcon(name: string, type: string = 'wallet'): React.FC<BrandedIconProps> {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '');
  
  // Wallets
  if (normalizedName.includes('touchngo') || normalizedName.includes('touchng') || normalizedName.includes('tng')) {
    return TouchNGoIcon;
  }
  if (normalizedName.includes('grabpay') || normalizedName.includes('grab')) {
    return GrabPayIcon;
  }
  if (normalizedName.includes('boost')) {
    return BoostIcon;
  }
  if (normalizedName.includes('duitnow')) {
    return DuitNowIcon;
  }
  if (normalizedName.includes('spaylater') || normalizedName.includes('spay')) {
    return SPayLaterIcon;
  }
  if (normalizedName.includes('atome')) {
    return AtomeIcon;
  }
  
  // Banks
  if (normalizedName.includes('maybank')) {
    return MaybankIcon;
  }
  if (normalizedName.includes('cimb')) {
    return CIMBIcon;
  }
  if (normalizedName.includes('public') || normalizedName.includes('pbb')) {
    return PublicBankIcon;
  }
  
  // Billers
  if (normalizedName.includes('tnb') || normalizedName.includes('tenaga')) {
    return TNBIcon;
  }
  if (normalizedName.includes('maxis')) {
    return MaxisIcon;
  }
  if (normalizedName.includes('unifi')) {
    return UnifiIcon;
  }
  
  // Type-based fallbacks
  if (type === 'bank') {
    return GenericBankIcon;
  }
  if (type === 'card' || type === 'credit_card' || type === 'debit_card') {
    return CardIcon;
  }
  if (type === 'biller') {
    return GenericBillerIcon;
  }
  
  return GenericWalletIcon;
}
