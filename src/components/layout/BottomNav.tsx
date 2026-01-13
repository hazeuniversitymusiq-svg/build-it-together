/**
 * FLOW Bottom Navigation
 * 
 * Atome-inspired design with iOS 26 Liquid Glass styling
 * - 5 nav items with center elevated Scan button
 * - Clean minimal icons with labels
 * - Smooth active state transitions
 * - Flow Card tab (feature-flagged)
 */

import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Send, Receipt, User, Scan, CreditCard, Zap } from "lucide-react";
import { useState } from "react";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

// Base nav items
const baseNavItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/send", icon: Send, label: "Send" },
  { path: "/scan", icon: Scan, label: "Scan", primary: true },
  { path: "/bills", icon: Receipt, label: "Bills" },
  { path: "/settings", icon: User, label: "Me" },
];

// Flow Card nav item (inserted when enabled)
const flowCardNavItem = { path: "/flow-card", icon: CreditCard, label: "Card", primary: false };

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFlowCardEnabled } = useFeatureFlags();
  const [showDemoHint, setShowDemoHint] = useState(false);

  // Build nav items with optional Flow Card
  const navItems = isFlowCardEnabled
    ? [
        baseNavItems[0], // Home
        flowCardNavItem,  // Card (replaces Send when enabled)
        baseNavItems[2], // Scan
        baseNavItems[3], // Bills
        baseNavItems[4], // Me
      ]
    : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-4 safe-area-bottom">
        {/* Demo Toggle - Subtle floating pill */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={() => navigate("/demo")}
          onMouseEnter={() => setShowDemoHint(true)}
          onMouseLeave={() => setShowDemoHint(false)}
          className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full glass-card border border-primary/20 flex items-center gap-2 pointer-events-auto hover:border-primary/40 transition-all group"
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Demo</span>
        </motion.button>

        {/* Floating glass pill */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="glass shadow-float-lg rounded-[2rem] border border-white/20 pointer-events-auto"
        >
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === "/home" && location.pathname === "/");
              const Icon = item.icon;
              const isPrimary = item.primary;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                    isPrimary ? "px-1" : "py-2 px-3 min-w-[56px]"
                  }`}
                >
                  {isPrimary ? (
                    /* Central Scan button - Atome style elevated circle */
                    <motion.div
                      whileTap={{ scale: 0.92 }}
                      className="relative -mt-8 mb-1"
                    >
                      {/* Outer glow ring */}
                      <div className="absolute inset-[-4px] aurora-gradient rounded-full opacity-40 blur-md" />
                      
                      {/* Main button */}
                      <div className={`relative w-14 h-14 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora transition-all duration-200 ${
                        isActive ? 'ring-2 ring-white/40 scale-105' : ''
                      }`}>
                        <Icon size={26} strokeWidth={2} className="text-white" />
                      </div>
                      
                      {/* Label below */}
                      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground whitespace-nowrap">
                        {item.label}
                      </span>
                    </motion.div>
                  ) : (
                    /* Regular nav items - Atome style */
                    <>
                      <motion.div
                        animate={{ 
                          scale: isActive ? 1.05 : 1,
                          y: isActive ? -2 : 0,
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative"
                      >
                        {/* Active indicator dot */}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-aurora-blue"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        
                        <Icon
                          size={24}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          className={`transition-all duration-200 ${
                            isActive 
                              ? "text-aurora-blue drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" 
                              : "text-muted-foreground"
                          }`}
                        />
                      </motion.div>
                      
                      {/* Label */}
                      <span
                        className={`text-[10px] mt-1.5 font-medium transition-all duration-200 ${
                          isActive 
                            ? "text-aurora-blue" 
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNav;
