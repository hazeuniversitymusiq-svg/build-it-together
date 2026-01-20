/**
 * FLOW Auto Sync - Screen 1: Select Your Apps
 * 
 * Apple Glass-inspired, production-ready implementation
 * 
 * Purpose: Help users confirm which payment apps and banks they want to connect
 * 
 * Behavior Rules:
 * - Apps are SUGGESTED, not detected (no device scanning)
 * - User must explicitly select each app
 * - Grouped by category: E-wallets, Banks, Buy Now Pay Later
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Wallet, 
  Building2, 
  CreditCard, 
  Receipt,
  Sparkles,
  ChevronRight
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface AppConfig {
  id: string;
  name: string;
  displayName: string;
  category: 'wallet' | 'bank' | 'bnpl' | 'biller';
  icon: string;
  color: string;
  description: string;
  popular?: boolean;
}

interface AutoSyncSelectAppsProps {
  onContinue: (selectedApps: string[]) => void;
  alreadyConnected?: string[];
}

// ============================================
// App Catalog - Malaysian Market Focus
// ============================================

const APP_CATALOG: AppConfig[] = [
  // E-Wallets
  {
    id: 'TouchNGo',
    name: 'TouchNGo',
    displayName: "Touch 'n Go",
    category: 'wallet',
    icon: '💳',
    color: '#0066CC',
    description: "Malaysia's #1 e-wallet",
    popular: true,
  },
  {
    id: 'GrabPay',
    name: 'GrabPay',
    displayName: 'GrabPay',
    category: 'wallet',
    icon: '🚗',
    color: '#00B14F',
    description: 'Rewards with every ride',
    popular: true,
  },
  {
    id: 'Boost',
    name: 'Boost',
    displayName: 'Boost',
    category: 'wallet',
    icon: '🚀',
    color: '#FF6B00',
    description: 'Shake & win cashback',
    popular: true,
  },
  {
    id: 'DuitNow',
    name: 'DuitNow',
    displayName: 'DuitNow',
    category: 'wallet',
    icon: '💸',
    color: '#E91E63',
    description: 'Instant bank transfers',
  },
  
  // Banks
  {
    id: 'Maybank',
    name: 'Maybank',
    displayName: 'Maybank',
    category: 'bank',
    icon: '🏦',
    color: '#FFCC00',
    description: 'MAE & M2U',
    popular: true,
  },
  {
    id: 'CIMB',
    name: 'CIMB',
    displayName: 'CIMB',
    category: 'bank',
    icon: '🏛️',
    color: '#ED1C24',
    description: 'CIMB Clicks',
  },
  {
    id: 'PublicBank',
    name: 'PublicBank',
    displayName: 'Public Bank',
    category: 'bank',
    icon: '🏦',
    color: '#003366',
    description: 'PB engage',
  },
  
  // BNPL
  {
    id: 'Atome',
    name: 'Atome',
    displayName: 'Atome',
    category: 'bnpl',
    icon: '🛍️',
    color: '#14B8A6',
    description: 'Split in 3, 0% interest',
    popular: true,
  },
  {
    id: 'SPayLater',
    name: 'SPayLater',
    displayName: 'SPayLater',
    category: 'bnpl',
    icon: '🛒',
    color: '#F97316',
    description: 'Shopee Pay Later',
  },
  {
    id: 'GrabPayLater',
    name: 'GrabPayLater',
    displayName: 'PayLater by Grab',
    category: 'bnpl',
    icon: '📦',
    color: '#00B14F',
    description: 'Flexible payment plans',
  },
];

// ============================================
// Category Configuration
// ============================================

const CATEGORIES = [
  { 
    id: 'wallet', 
    label: 'E-Wallets', 
    icon: Wallet,
    description: 'For everyday payments'
  },
  { 
    id: 'bank', 
    label: 'Banks', 
    icon: Building2,
    description: 'For transfers & top-ups'
  },
  { 
    id: 'bnpl', 
    label: 'Buy Now Pay Later', 
    icon: CreditCard,
    description: 'For flexible payments'
  },
] as const;

// ============================================
// App Selection Item Component
// ============================================

interface AppItemProps {
  app: AppConfig;
  isSelected: boolean;
  isConnected: boolean;
  onToggle: () => void;
  index: number;
}

const AppItem = ({ app, isSelected, isConnected, onToggle, index }: AppItemProps) => {
  const isActive = isSelected || isConnected;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      onClick={onToggle}
      disabled={isConnected}
      className={`
        relative w-full flex items-center gap-4 p-4 rounded-2xl
        transition-all duration-300 ease-out
        ${isActive 
          ? 'bg-white/10 backdrop-blur-xl ring-1 ring-white/20 shadow-lg' 
          : 'bg-white/5 backdrop-blur-sm hover:bg-white/8 active:scale-[0.98]'
        }
        ${isConnected ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      {/* App Icon */}
      <div 
        className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl
          transition-all duration-300
          ${isActive 
            ? 'shadow-lg scale-105' 
            : 'opacity-80'
          }
        `}
        style={{ 
          background: isActive 
            ? `linear-gradient(135deg, ${app.color}40, ${app.color}20)` 
            : 'rgba(255,255,255,0.05)',
          boxShadow: isActive ? `0 4px 20px ${app.color}30` : 'none'
        }}
      >
        {app.icon}
      </div>
      
      {/* App Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold truncate ${isActive ? 'text-white' : 'text-white/80'}`}>
            {app.displayName}
          </span>
          {app.popular && !isActive && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full 
                        bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                        text-amber-300 font-medium border border-amber-500/20"
            >
              <Sparkles className="w-2.5 h-2.5" />
              Popular
            </motion.span>
          )}
          {isConnected && (
            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium">
              Connected
            </span>
          )}
        </div>
        <span className="text-sm text-white/50 truncate block">
          {app.description}
        </span>
      </div>
      
      {/* Selection Indicator */}
      <div 
        className={`
          w-6 h-6 rounded-full flex items-center justify-center shrink-0
          transition-all duration-300
          ${isActive 
            ? 'bg-gradient-to-br from-white/30 to-white/10 shadow-inner' 
            : 'border-2 border-white/20'
          }
        `}
      >
        <AnimatePresence mode="wait">
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
};

// ============================================
// Category Section Component
// ============================================

interface CategorySectionProps {
  category: typeof CATEGORIES[number];
  apps: AppConfig[];
  selectedApps: Set<string>;
  connectedApps: Set<string>;
  onToggle: (appId: string) => void;
  baseIndex: number;
}

const CategorySection = ({ 
  category, 
  apps, 
  selectedApps, 
  connectedApps,
  onToggle,
  baseIndex 
}: CategorySectionProps) => {
  const Icon = category.icon;
  const selectedCount = apps.filter(a => selectedApps.has(a.id) || connectedApps.has(a.id)).length;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: baseIndex * 0.1 }}
      className="space-y-3"
    >
      {/* Category Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/60" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">{category.label}</h3>
            <p className="text-xs text-white/40">{category.description}</p>
          </div>
        </div>
        {selectedCount > 0 && (
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-xs text-white/50"
          >
            {selectedCount} selected
          </motion.span>
        )}
      </div>
      
      {/* App List */}
      <div className="space-y-2">
        {apps.map((app, idx) => (
          <AppItem
            key={app.id}
            app={app}
            isSelected={selectedApps.has(app.id)}
            isConnected={connectedApps.has(app.id)}
            onToggle={() => onToggle(app.id)}
            index={baseIndex + idx}
          />
        ))}
      </div>
    </motion.div>
  );
};

// ============================================
// Main Component
// ============================================

export function AutoSyncSelectApps({ onContinue, alreadyConnected = [] }: AutoSyncSelectAppsProps) {
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const connectedApps = useMemo(() => new Set(alreadyConnected), [alreadyConnected]);

  // Group apps by category
  const appsByCategory = useMemo(() => {
    return CATEGORIES.map(cat => ({
      category: cat,
      apps: APP_CATALOG.filter(app => app.category === cat.id)
    }));
  }, []);

  // Toggle app selection
  const toggleApp = useCallback((appId: string) => {
    if (connectedApps.has(appId)) return;
    
    setSelectedApps(prev => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  }, [connectedApps]);

  // Count of new apps to connect (excluding already connected)
  const newAppsCount = useMemo(() => {
    return [...selectedApps].filter(id => !connectedApps.has(id)).length;
  }, [selectedApps, connectedApps]);

  // Handle continue
  const handleContinue = useCallback(() => {
    const appsToConnect = [...selectedApps].filter(id => !connectedApps.has(id));
    onContinue(appsToConnect);
  }, [selectedApps, connectedApps, onContinue]);

  let runningIndex = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-black flex flex-col">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col safe-area-top safe-area-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-1 rounded-full bg-white/60" />
              <div className="w-8 h-1 rounded-full bg-white/20" />
              <div className="w-8 h-1 rounded-full bg-white/20" />
            </div>
            
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Select Your Apps
            </h1>
            <p className="text-white/50 mt-2 text-base">
              Tap to select the apps you already use.
            </p>
          </motion.div>
        </header>

        {/* App List - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="space-y-8">
            {appsByCategory.map(({ category, apps }) => {
              const section = (
                <CategorySection
                  key={category.id}
                  category={category}
                  apps={apps}
                  selectedApps={selectedApps}
                  connectedApps={connectedApps}
                  onToggle={toggleApp}
                  baseIndex={runningIndex}
                />
              );
              runningIndex += apps.length + 1;
              return section;
            })}
          </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-20">
          {/* Gradient fade */}
          <div className="h-8 bg-gradient-to-t from-black to-transparent" />
          
          <div className="bg-black/80 backdrop-blur-xl border-t border-white/10 px-6 pb-8 pt-4 safe-area-bottom">
            <motion.button
              onClick={handleContinue}
              disabled={newAppsCount === 0}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full h-14 rounded-2xl font-semibold text-base
                flex items-center justify-center gap-2
                transition-all duration-300
                ${newAppsCount > 0
                  ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
                }
              `}
            >
              <AnimatePresence mode="wait">
                {newAppsCount > 0 ? (
                  <motion.span
                    key="connect"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    Connect {newAppsCount} App{newAppsCount !== 1 ? 's' : ''}
                    <ChevronRight className="w-5 h-5" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="select"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Select apps to continue
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { APP_CATALOG, type AppConfig };
