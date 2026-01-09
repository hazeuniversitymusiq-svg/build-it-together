/**
 * Payment Rails Manager
 * 
 * Allows users to enable/disable payment rails and set their preferred default wallet.
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRail {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  enabled: boolean;
  type: 'wallet' | 'bank' | 'bnpl';
  description?: string;
}

const DEFAULT_RAILS: PaymentRail[] = [
  { id: 'TouchNGo', name: 'TouchNGo', displayName: "Touch 'n Go", icon: '💙', color: 'bg-blue-500', enabled: true, type: 'wallet', description: 'Most popular in Malaysia' },
  { id: 'GrabPay', name: 'GrabPay', displayName: 'GrabPay', icon: '💚', color: 'bg-green-500', enabled: true, type: 'wallet', description: 'Grab super app wallet' },
  { id: 'Boost', name: 'Boost', displayName: 'Boost', icon: '🔶', color: 'bg-orange-500', enabled: true, type: 'wallet', description: 'Axiata digital wallet' },
  { id: 'DuitNow', name: 'DuitNow', displayName: 'DuitNow', icon: '🏦', color: 'bg-pink-500', enabled: true, type: 'bank', description: 'National QR standard' },
  { id: 'ShopeePay', name: 'ShopeePay', displayName: 'ShopeePay', icon: '🧡', color: 'bg-orange-600', enabled: true, type: 'wallet', description: 'Shopee ecosystem wallet' },
  { id: 'BigPay', name: 'BigPay', displayName: 'BigPay', icon: '✈️', color: 'bg-red-500', enabled: true, type: 'wallet', description: 'AirAsia travel wallet' },
  { id: 'Atome', name: 'Atome', displayName: 'Atome', icon: '💎', color: 'bg-teal-500', enabled: true, type: 'bnpl', description: 'Buy Now, Pay Later' },
];

const STORAGE_KEY = 'flow_payment_rails';
const DEFAULT_WALLET_KEY = 'flow_default_wallet';

export default function PaymentRailsManager() {
  const [rails, setRails] = useState<PaymentRail[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_RAILS;
  });
  
  const [defaultWallet, setDefaultWallet] = useState<string>(() => {
    return localStorage.getItem(DEFAULT_WALLET_KEY) || 'TouchNGo';
  });

  // Persist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rails));
  }, [rails]);

  useEffect(() => {
    localStorage.setItem(DEFAULT_WALLET_KEY, defaultWallet);
  }, [defaultWallet]);

  const toggleRail = (railId: string) => {
    setRails(prev => prev.map(rail => 
      rail.id === railId ? { ...rail, enabled: !rail.enabled } : rail
    ));
    
    // If disabling the default wallet, switch to first enabled wallet
    if (railId === defaultWallet) {
      const firstEnabled = rails.find(r => r.id !== railId && r.enabled && r.type === 'wallet');
      if (firstEnabled) {
        setDefaultWallet(firstEnabled.id);
      }
    }
  };

  const enabledWallets = rails.filter(r => r.enabled && r.type === 'wallet');

  return (
    <div className="space-y-6">
      {/* Default Wallet Selection */}
      <div className="glass-card rounded-2xl p-4 shadow-float">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-500" />
          <h3 className="font-medium text-foreground">Default Wallet</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          FLOW will prioritize this wallet when multiple options are available
        </p>
        
        <RadioGroup value={defaultWallet} onValueChange={setDefaultWallet}>
          <div className="grid gap-2">
            {enabledWallets.map((rail) => (
              <motion.div
                key={rail.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer",
                  defaultWallet === rail.id 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent bg-muted/50 hover:bg-muted"
                )}
                onClick={() => setDefaultWallet(rail.id)}
              >
                <RadioGroupItem value={rail.id} id={rail.id} className="sr-only" />
                <span className="text-2xl">{rail.icon}</span>
                <div className="flex-1">
                  <Label htmlFor={rail.id} className="font-medium cursor-pointer">
                    {rail.displayName}
                  </Label>
                </div>
                {defaultWallet === rail.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </RadioGroup>
        
        {enabledWallets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Enable at least one wallet to set as default
          </p>
        )}
      </div>

      {/* All Payment Rails */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-float">
        <div className="p-4 border-b border-border/30">
          <h3 className="font-medium text-foreground">Payment Rails</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable payment methods for FLOW to use
          </p>
        </div>
        
        <div className="divide-y divide-border/30">
          {rails.map((rail, index) => (
            <motion.div
              key={rail.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                  rail.enabled ? rail.color : "bg-muted"
                )}>
                  <span className={rail.enabled ? "" : "grayscale opacity-50"}>
                    {rail.icon}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium",
                      rail.enabled ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {rail.displayName}
                    </span>
                    {rail.id === defaultWallet && rail.enabled && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {rail.type === 'bnpl' && (
                      <Badge variant="outline" className="text-xs text-teal-600 border-teal-300">
                        BNPL
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rail.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={rail.enabled}
                onCheckedChange={() => toggleRail(rail.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
