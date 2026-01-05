/**
 * FLOW Kill Switch Component
 * 
 * Big, prominent button to pause all FLOW payments.
 * Trust is reinforced by giving users control.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, AlertTriangle } from "lucide-react";
import { useFlowPause } from "@/hooks/useFlowPause";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export function KillSwitch() {
  const { isPaused, pausedAt, isLoading, togglePause } = useFlowPause();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!isPaused) {
      // Pausing requires confirmation
      setShowConfirm(true);
      return;
    }
    
    // Resuming doesn't require confirmation
    setIsToggling(true);
    await togglePause();
    setIsToggling(false);
  };

  const confirmPause = async () => {
    setIsToggling(true);
    await togglePause();
    setIsToggling(false);
    setShowConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-secondary animate-pulse">
        <div className="h-12" />
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-4 rounded-2xl ${
          isPaused 
            ? "bg-destructive/10 border border-destructive/20" 
            : "bg-secondary"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPaused ? (
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Pause className="w-5 h-5 text-destructive" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                <Play className="w-5 h-5 text-success" />
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">
                {isPaused ? "FLOW is Paused" : "FLOW is Active"}
              </p>
              {isPaused && pausedAt && (
                <p className="text-xs text-muted-foreground">
                  Paused {formatDistanceToNow(pausedAt, { addSuffix: true })}
                </p>
              )}
              {!isPaused && (
                <p className="text-xs text-muted-foreground">
                  All payments enabled
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isPaused
                ? "bg-success text-success-foreground"
                : "bg-destructive/10 text-destructive"
            } ${isToggling ? "opacity-50" : ""}`}
          >
            {isToggling ? "..." : isPaused ? "Resume" : "Pause"}
          </button>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-card flow-card-shadow"
            >
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <h3 className="text-xl font-semibold text-center text-foreground mb-2">
                Pause FLOW?
              </h3>
              
              <p className="text-sm text-muted-foreground text-center mb-6">
                All payments will be blocked until you resume. You can resume anytime.
              </p>

              <div className="space-y-3">
                <button
                  onClick={confirmPause}
                  disabled={isToggling}
                  className="w-full py-3 rounded-full bg-destructive text-destructive-foreground font-medium"
                >
                  {isToggling ? "Pausing..." : "Yes, Pause FLOW"}
                </button>
                
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-3 rounded-full bg-secondary text-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
