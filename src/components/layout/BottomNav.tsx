/**
 * FLOW Bottom Navigation
 * 
 * Atome-inspired design with iOS 26 Liquid Glass styling
 * - 5 nav items with center elevated Scan button
 * - Demo mode indicator (pulsing when active)
 * - Clean minimal icons with labels
 * - Smooth active state transitions
 */

import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Scan, CreditCard, Sparkles, Play } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

// Nav items: Home, Demo Toggle, Scan, Card, Me
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
    triggerPageDemo, 
    pageActions,
    isTourActive,
    startTour,
  } = useDemo();

  const navItems = baseNavItems;

  const handleNavClick = (item: typeof baseNavItems[0]) => {
    if (item.isDemo) {
      // Toggle demo mode
      toggleDemoMode();
    } else {
      navigate(item.path);
    }
  };

  // Hide bottom nav during tour
  if (isTourActive) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-4 safe-area-bottom">

        {/* Demo Mode Active Banner */}
        <AnimatePresence>
          {isDemoMode && pageActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2 mb-2 pointer-events-auto"
            >
              {/* Run Demo Action */}
              <motion.button
                onClick={triggerPageDemo}
                className="flex-1 py-3 px-4 glass rounded-2xl border border-aurora-blue/30 flex items-center justify-center gap-2 text-sm font-medium text-aurora-blue"
              >
                <Sparkles size={16} className="animate-pulse" />
                <span>{pageActions[0]?.label || 'Run Demo'}</span>
              </motion.button>
              
              {/* Start Guided Tour */}
              <motion.button
                onClick={startTour}
                className="py-3 px-4 glass rounded-2xl border border-aurora-purple/30 flex items-center justify-center gap-2 text-sm font-medium text-aurora-purple"
              >
                <Play size={16} />
                <span>Tour</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating glass pill */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`glass shadow-float-lg rounded-[2rem] border pointer-events-auto transition-colors duration-300 ${
            isDemoMode ? 'border-aurora-blue/40' : 'border-white/20'
          }`}
        >
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = item.isDemo 
                ? isDemoMode 
                : (location.pathname === item.path || (item.path === "/home" && location.pathname === "/"));
              const Icon = item.icon;
              const isPrimary = item.primary;
              const isDemo = item.isDemo;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item)}
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
                            layoutId={isDemo ? undefined : "activeIndicator"}
                            className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                              isDemo ? 'bg-aurora-purple' : 'bg-aurora-blue'
                            }`}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        
                        {/* Demo mode pulsing indicator */}
                        {isDemo && isDemoMode && (
                          <motion.div
                            className="absolute inset-0 -m-2 rounded-full bg-aurora-purple/20"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                        
                        <Icon
                          size={24}
                          strokeWidth={isActive ? 2.5 : 1.5}
                          className={`transition-all duration-200 ${
                            isActive 
                              ? isDemo 
                                ? "text-aurora-purple drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                                : "text-aurora-blue drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" 
                              : "text-muted-foreground"
                          }`}
                        />
                      </motion.div>
                      
                      {/* Label */}
                      <span
                        className={`text-[10px] mt-1.5 font-medium transition-all duration-200 ${
                          isActive 
                            ? isDemo ? "text-aurora-purple" : "text-aurora-blue" 
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
