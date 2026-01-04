import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Scan, Send, Clock, Settings } from "lucide-react";

const navItems = [
  { path: "/", icon: Scan, label: "Scan" },
  { path: "/send", icon: Send, label: "Send" },
  { path: "/activity", icon: Clock, label: "Activity" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto">
        <div className="bg-background/90 backdrop-blur-xl border-t border-border/30 safe-area-bottom">
          <div className="flex items-center justify-around px-6 pt-3 pb-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center py-1 px-5"
                >
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1 : 0.95,
                      opacity: isActive ? 1 : 0.5
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2 : 1.5}
                      className="text-foreground"
                    />
                  </motion.div>
                  <span
                    className={`text-[10px] mt-1 transition-opacity duration-200 ${
                      isActive ? "text-foreground opacity-100" : "text-foreground opacity-40"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
