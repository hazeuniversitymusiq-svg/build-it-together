/**
 * Flow Card Visual Component
 * 
 * Digital card representation with status indicators.
 * Apple-level design with aurora gradient and glass effects.
 */

import { motion } from 'framer-motion';
import { Wifi, Fingerprint, Shield, Pause } from 'lucide-react';
import type { FlowCardStatus, FlowCardMode } from '@/hooks/useFlowCard';

interface FlowCardVisualProps {
  status: FlowCardStatus;
  mode: FlowCardMode;
  lastFourDigits?: string;
  isCompact?: boolean;
}

const statusConfig: Record<FlowCardStatus, { label: string; color: string; icon: typeof Shield }> = {
  not_created: { label: 'Not Created', color: 'text-muted-foreground', icon: Shield },
  created: { label: 'Active', color: 'text-success', icon: Shield },
  suspended: { label: 'Suspended', color: 'text-warning', icon: Pause },
  terminated: { label: 'Terminated', color: 'text-destructive', icon: Shield },
};

const modeLabels: Record<FlowCardMode, string> = {
  in_app: 'In-App',
  network_placeholder: 'Network Ready',
  network_live: 'Network Live',
};

export function FlowCardVisual({ 
  status, 
  mode, 
  lastFourDigits = '••••',
  isCompact = false 
}: FlowCardVisualProps) {
  const config = statusConfig[status];
  const isActive = status === 'created';
  const isSuspended = status === 'suspended';

  if (isCompact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative w-full h-20 rounded-xl overflow-hidden ${
          isSuspended ? 'grayscale opacity-60' : ''
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 aurora-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Content */}
        <div className="relative h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Flow Card</p>
              <p className="text-white/70 text-xs">{modeLabels[mode]}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 ${config.color}`}>
            <config.icon size={14} />
            <span className="text-xs font-medium text-white/90">{config.label}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative w-full aspect-[1.586/1] max-w-sm mx-auto ${
        isSuspended ? 'grayscale opacity-70' : ''
      }`}
      style={{ perspective: 1000 }}
    >
      {/* Card body */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-float-lg">
        {/* Aurora gradient background */}
        <div className="absolute inset-0 aurora-gradient animate-aurora" />
        
        {/* Glass overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/10" />
        
        {/* Subtle pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold text-xl tracking-tight">Flow Card</h3>
              <p className="text-white/70 text-sm">{modeLabels[mode]}</p>
            </div>
            
            {/* Status indicator */}
            <motion.div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                isActive ? 'bg-white/20' : 'bg-black/20'
              }`}
              animate={isActive ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-green-400' : isSuspended ? 'bg-yellow-400' : 'bg-gray-400'
              }`} />
              <span className="text-white text-xs font-medium">{config.label}</span>
            </motion.div>
          </div>
          
          {/* Chip & NFC */}
          <div className="flex items-center gap-4">
            {/* Chip */}
            <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-400/80 shadow-sm">
              <div className="w-full h-full rounded-md border border-yellow-600/30 grid grid-cols-3 gap-0.5 p-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-yellow-600/30 rounded-sm" />
                ))}
              </div>
            </div>
            
            {/* NFC indicator */}
            <motion.div
              animate={isActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.3 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Wifi size={24} className="text-white/80 rotate-90" />
            </motion.div>
          </div>
          
          {/* Footer */}
          <div className="flex items-end justify-between">
            {/* Card number placeholder */}
            <div className="text-white/90 font-mono tracking-[0.2em] text-lg">
              •••• •••• •••• {lastFourDigits}
            </div>
            
            {/* Biometric indicator */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Fingerprint size={18} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Glow effect */}
      {isActive && (
        <div className="absolute -inset-1 aurora-gradient rounded-2xl blur-xl opacity-30 -z-10" />
      )}
    </motion.div>
  );
}
