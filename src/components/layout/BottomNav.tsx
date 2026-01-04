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
        <div className="flow-glass border-t border-border/50 safe-area-bottom">
          <div className="flex items-center justify-around px-4 pt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex flex-col items-center py-2 px-4 transition-colors"
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -inset-2 bg-primary/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 1.8}
                      className={isActive ? "text-foreground" : "text-muted-foreground"}
                    />
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium ${
                      isActive ? "text-foreground" : "text-muted-foreground"
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
