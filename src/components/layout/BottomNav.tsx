/**
 * FLOW Bottom Navigation
 * 
 * Apple Intelligence-inspired design with refined glass morphism
 * - Floating frosted glass pill with depth
 * - Elevated center scan button with smooth gradient glow
 * - Clean filled/outline icon states
 * - Refined typography and spacing
 */

import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Scan, CreditCard, Sparkles } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

// Nav items configuration
const baseNavItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "demo-toggle", icon: Sparkles, label: "Demo", isDemo: true },
  { path: "/scan", icon: Scan, label: "Scan", primary: true },
  { path: "/flow-card", icon: CreditCard, label: "Card" },
  { path: "/settings", icon: User, label: "Me" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    isDemoMode, 
    toggleDemoMode, 
  } = useDemo();

  const navItems = baseNavItems;

  const handleNavClick = (item: typeof baseNavItems[0]) => {
    if (item.isDemo) {
      toggleDemoMode();
    } else {
      navigate(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-5 pb-5 safe-area-bottom">

        {/* Demo Mode Active Indicator */}
        <AnimatePresence>
          {isDemoMode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-3 pointer-events-auto"
            >
              <div className="py-2.5 px-4 bg-white/70 dark:bg-black/40 backdrop-blur-2xl rounded-2xl border border-aurora-purple/20 shadow-lg flex items-center justify-center gap-2 text-sm font-medium text-aurora-purple">
                <Sparkles size={14} className="animate-pulse" />
                <span>Demo Mode — Tap highlights to explore</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Apple Intelligence-style floating glass pill */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-auto"
        >
          {/* Outer container - allows scan button to overflow */}
          <div className="relative pt-8">
            {/* Glass container */}
            <div 
              className={`
                relative
                bg-white/80 dark:bg-gray-900/70
                backdrop-blur-3xl
                rounded-[28px]
                border border-white/50 dark:border-white/10
                shadow-[0_8px_32px_-8px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)]
                dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_4px_16px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
                transition-all duration-300
                ${isDemoMode ? 'ring-1 ring-aurora-purple/30' : ''}
              `}
            >
              {/* Inner highlight for glass effect */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-t-[28px]" />
              
              <div className="flex items-center justify-around px-3 py-3">
                {navItems.map((item) => {
                  const isActive = item.isDemo 
                    ? isDemoMode 
                    : (location.pathname === item.path || (item.path === "/home" && location.pathname === "/"));
                  const Icon = item.icon;
                  const isPrimary = item.primary;
                  const isDemo = item.isDemo;

                  return (
                    <motion.button
                      key={item.path}
                      onClick={() => handleNavClick(item)}
                      whileTap={{ scale: 0.92 }}
                      className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
                        isPrimary ? "px-2" : "py-1 px-4 min-w-[60px]"
                      }`}
                    >
                      {isPrimary ? (
                        /* Central Scan button - Refined elevated style */
                        <div className="relative -mt-10 mb-1">
                          {/* Soft ambient glow */}
                          <motion.div 
                            className="absolute inset-[-8px] rounded-full opacity-60"
                            style={{
                              background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, rgba(236,72,153,0.2) 50%, transparent 70%)",
                            }}
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.5, 0.7, 0.5],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          
                          {/* Main button with refined gradient */}
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`
                              relative w-16 h-16 rounded-full 
                              flex items-center justify-center
                              shadow-[0_8px_24px_-4px_rgba(139,92,246,0.5),0_4px_12px_-2px_rgba(236,72,153,0.3)]
                              transition-all duration-300
                              ${isActive ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent' : ''}
                            `}
                            style={{
                              background: "linear-gradient(135deg, #60a5fa 0%, #8b5cf6 40%, #a855f7 60%, #ec4899 100%)",
                            }}
                          >
                            {/* Inner shine */}
                            <div className="absolute inset-[2px] rounded-full bg-gradient-to-b from-white/25 to-transparent" />
                            
                            {/* Scan frame icon */}
                            <div className="relative text-white">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {/* Corner brackets for scan frame */}
                                <path d="M7 3H5a2 2 0 0 0-2 2v2" />
                                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                <path d="M17 21h2a2 2 0 0 0 2-2v-2" />
                              </svg>
                            </div>
                          </motion.div>
                          
                          {/* Label below button */}
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-foreground whitespace-nowrap">
                            {item.label}
                          </span>
                        </div>
                      ) : (
                        /* Regular nav items - Apple style clean states */
                        <>
                          <motion.div
                            animate={{ 
                              y: isActive ? -1 : 0,
                            }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="relative mb-1"
                          >
                            {/* Demo mode pulsing ring */}
                            {isDemo && isDemoMode && (
                              <motion.div
                                className="absolute inset-0 -m-3 rounded-full bg-aurora-purple/15"
                                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                            
                            <Icon
                              size={26}
                              strokeWidth={isActive ? 2.2 : 1.5}
                              fill={isActive && !isDemo ? "currentColor" : "none"}
                              className={`transition-all duration-200 ${
                                isActive 
                                  ? isDemo 
                                    ? "text-aurora-purple"
                                    : "text-blue-500" 
                                  : "text-gray-400 dark:text-gray-500"
                              }`}
                            />
                          </motion.div>
                          
                          {/* Label with refined typography */}
                          <span
                            className={`text-[11px] font-medium transition-all duration-200 ${
                              isActive 
                                ? isDemo 
                                  ? "text-aurora-purple" 
                                  : "text-blue-500" 
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};

export default BottomNav;
