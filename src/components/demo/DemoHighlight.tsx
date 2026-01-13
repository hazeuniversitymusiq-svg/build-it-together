/**
 * Demo Highlight Wrapper
 * 
 * Wraps interactive elements to make them tappable during demo mode.
 * Shows a tooltip with explanation and "Try it" button when tapped.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";

interface DemoHighlightProps {
  id: string;
  title: string;
  description: string;
  onTryIt?: () => void;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function DemoHighlight({ 
  id, 
  title, 
  description, 
  onTryIt, 
  children,
  position = "bottom" 
}: DemoHighlightProps) {
  const { isDemoMode, activeHighlight, setActiveHighlight } = useDemo();
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const isActive = activeHighlight === id;

  // Calculate tooltip position when active
  useEffect(() => {
    if (isActive && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const padding = 12;
      
      let top = 0;
      let left = rect.left + rect.width / 2;
      
      switch (position) {
        case "top":
          top = rect.top - padding;
          break;
        case "bottom":
          top = rect.bottom + padding;
          break;
        case "left":
          left = rect.left - padding;
          top = rect.top + rect.height / 2;
          break;
        case "right":
          left = rect.right + padding;
          top = rect.top + rect.height / 2;
          break;
      }
      
      setTooltipPosition({ top, left });
    }
  }, [isActive, position]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isDemoMode) return;
    
    e.stopPropagation();
    setActiveHighlight(isActive ? null : id);
  };

  const handleTryIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTryIt) {
      onTryIt();
    }
    setActiveHighlight(null);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHighlight(null);
  };

  if (!isDemoMode) {
    return <>{children}</>;
  }

  return (
    <>
      <motion.div
        ref={wrapperRef}
        onClick={handleClick}
        className="relative cursor-pointer"
        animate={{
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Highlight ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          animate={{
            boxShadow: isActive 
              ? "0 0 0 3px rgba(168, 85, 247, 0.6), 0 0 20px rgba(168, 85, 247, 0.3)"
              : "0 0 0 2px rgba(168, 85, 247, 0.4), 0 0 12px rgba(168, 85, 247, 0.2)",
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Pulsing indicator when not active */}
        {!isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-aurora-purple z-20 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-white text-[10px] font-bold">?</span>
          </motion.div>
        )}
        
        {children}
      </motion.div>

      {/* Tooltip Portal */}
      <AnimatePresence>
        {isActive && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[90]"
            />
            
            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: position === "top" ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: position === "top" ? 10 : -10 }}
              className="fixed z-[100] w-72 max-w-[calc(100vw-2rem)]"
              style={{
                top: position === "bottom" ? tooltipPosition.top : "auto",
                bottom: position === "top" ? `calc(100vh - ${tooltipPosition.top}px)` : "auto",
                left: tooltipPosition.left,
                transform: "translateX(-50%)",
              }}
            >
              <div className="glass-card rounded-2xl p-4 shadow-float-lg aurora-border">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full glass-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <h4 className="font-semibold text-foreground mb-1 pr-6">{title}</h4>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {description}
                </p>
                
                {onTryIt && (
                  <Button
                    onClick={handleTryIt}
                    size="sm"
                    className="w-full rounded-xl h-9 aurora-gradient text-white border-0"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Try it
                  </Button>
                )}
              </div>
              
              {/* Arrow */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 glass-card aurora-border ${
                  position === "bottom" ? "-top-1.5 border-b-0 border-r-0" : "-bottom-1.5 border-t-0 border-l-0"
                }`}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default DemoHighlight;
