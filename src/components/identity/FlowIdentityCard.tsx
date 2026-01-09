/**
 * Flow Identity Card
 * 
 * A premium glass card showing the user's verified Flow identity status.
 * Always displays "Active" state to reinforce trust and brand presence.
 */

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, Link2, Layers, Fingerprint } from "lucide-react";

interface FlowIdentityCardProps {
  className?: string;
  securityLevel?: "PIN only" | "Biometric" | "Face ID";
  connectionsCount?: number;
  mode?: "Prototype" | "Pilot" | "Production";
}

const FlowIdentityCard = forwardRef<HTMLDivElement, FlowIdentityCardProps>(
  ({ className = "", securityLevel = "PIN only", connectionsCount = 0, mode = "Prototype" }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        {/* Section Header */}
        <h2 className="text-lg font-semibold text-foreground mb-2">Flow Identity</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your Flow Identity is now active.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          It represents your verified identity, device, and connected payment ecosystem.
        </p>

        {/* Status Rows */}
        <div className="space-y-2 mb-8">
          {/* Identity Status */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground font-medium">Identity</span>
            </div>
            <span className="text-success font-medium">Active</span>
          </div>

          {/* Security Level */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground font-medium">Security</span>
            </div>
            <span className="text-muted-foreground">{securityLevel}</span>
          </div>

          {/* Connections */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground font-medium">Connections</span>
            </div>
            <span className="text-muted-foreground">{connectionsCount} linked</span>
          </div>

          {/* Mode */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground font-medium">Mode</span>
            </div>
            <span className="text-aurora-blue font-medium">{mode}</span>
          </div>
        </div>

        {/* Identity Card Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative mx-auto w-64 aspect-[1.6/1] rounded-2xl overflow-hidden shadow-float"
          style={{
            background: "linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 20% 18%) 50%, hsl(210 80% 35%) 100%)",
          }}
        >
          {/* Subtle gradient overlay */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              background: "radial-gradient(ellipse at 70% 80%, hsl(210 80% 45% / 0.6) 0%, transparent 60%)",
            }}
          />
          
          {/* Card Content */}
          <div className="relative h-full p-5 flex flex-col justify-between">
            {/* Header */}
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider font-medium mb-2">
                Flow Identity
              </p>
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white/80" />
              </div>
            </div>

            {/* Footer */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-white/80">Active</span>
              </div>
              <p className="text-lg font-bold text-white tracking-tight">FLOW</p>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          This is not a payment card.
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Flow always asks before any payment.
        </p>
      </motion.div>
    );
  }
);

FlowIdentityCard.displayName = "FlowIdentityCard";

export default FlowIdentityCard;
