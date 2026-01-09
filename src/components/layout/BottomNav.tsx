/**
 * FLOW Bottom Navigation
 * 
 * iOS 26 Liquid Glass design - floating glass pill with aurora accents
 */

import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Send, Clock, Settings, Scan } from "lucide-react";

const navItems = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/send", icon: Send, label: "Send" },
  { path: "/scan", icon: Scan, label: "Scan", primary: true },
  { path: "/activity", icon: Clock, label: "Activity" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-md mx-auto px-4 pb-6 safe-area-bottom">
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
                  className={`relative flex flex-col items-center transition-all duration-300 ${
                    isPrimary ? "px-2" : "py-2 px-3"
                  }`}
                >
                  {isPrimary ? (
                    /* Central Scan button with aurora glow */
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`relative -mt-6 mb-1`}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 aurora-gradient rounded-full blur-lg opacity-60 scale-110" />
                      
                      {/* Button */}
                      <div className={`relative w-14 h-14 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora ${
                        isActive ? 'ring-2 ring-white/30' : ''
                      }`}>
                        <Icon size={24} strokeWidth={2} className="text-white" />
                      </div>
                    </motion.div>
                  ) : (
                    /* Regular nav items */
                    <motion.div
                      animate={{ 
                        scale: isActive ? 1 : 0.92,
                      }}
                      transition={{ duration: 0.2 }}
                      className="relative"
                    >
                      {/* Active glow indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="navGlow"
                          className="absolute -inset-2 bg-aurora-blue/10 rounded-2xl"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2 : 1.5}
                        className={`relative z-10 transition-colors duration-200 ${
                          isActive ? "text-aurora-blue" : "text-muted-foreground"
                        }`}
                      />
                    </motion.div>
                  )}
                  
                  {/* Label */}
                  {!isPrimary && (
                    <span
                      className={`text-[10px] mt-1 font-medium transition-all duration-200 ${
                        isActive 
                          ? "text-aurora-blue" 
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
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
