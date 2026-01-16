/**
 * Floating Apps Orbit Component
 * 
 * Apple Intelligence-inspired floating app constellation that orbits
 * around a central FLOW orb. Apps float with depth, blur, and glow effects,
 * then magnetically converge during sync.
 */

import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import { 
  Wallet, 
  Building2, 
  CreditCard, 
  Receipt,
  Smartphone,
  ShoppingBag,
  Zap
} from 'lucide-react';
import flowIcon from '@/assets/flow-icon.png';

interface FloatingApp {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  depth: number; // 0-1, affects scale and blur
}

const APPS: FloatingApp[] = [
  { id: 'tng', name: 'TouchNGo', icon: Wallet, color: '#0066FF', orbitRadius: 120, orbitSpeed: 25, startAngle: 0, depth: 0.9 },
  { id: 'grab', name: 'GrabPay', icon: Wallet, color: '#00B14F', orbitRadius: 140, orbitSpeed: 30, startAngle: 72, depth: 0.7 },
  { id: 'boost', name: 'Boost', icon: Zap, color: '#FF6B00', orbitRadius: 100, orbitSpeed: 20, startAngle: 144, depth: 1 },
  { id: 'maybank', name: 'Maybank', icon: Building2, color: '#FFD700', orbitRadius: 160, orbitSpeed: 35, startAngle: 216, depth: 0.6 },
  { id: 'atome', name: 'Atome', icon: ShoppingBag, color: '#FF69B4', orbitRadius: 130, orbitSpeed: 28, startAngle: 288, depth: 0.8 },
  { id: 'spay', name: 'SPayLater', icon: CreditCard, color: '#FF4500', orbitRadius: 110, orbitSpeed: 22, startAngle: 45, depth: 0.85 },
  { id: 'tnb', name: 'TNB', icon: Receipt, color: '#4169E1', orbitRadius: 150, orbitSpeed: 32, startAngle: 180, depth: 0.65 },
  { id: 'maxis', name: 'Maxis', icon: Smartphone, color: '#00CED1', orbitRadius: 135, orbitSpeed: 27, startAngle: 270, depth: 0.75 },
];

interface FloatingAppsOrbitProps {
  phase: 'idle' | 'detecting' | 'syncing' | 'complete';
  onSyncComplete?: () => void;
}

function FloatingAppIcon({ 
  app, 
  phase,
  index,
}: { 
  app: FloatingApp; 
  phase: FloatingAppsOrbitProps['phase'];
  index: number;
}) {
  const controls = useAnimationControls();
  const Icon = app.icon;
  
  // Calculate initial position
  const initialX = Math.cos((app.startAngle * Math.PI) / 180) * app.orbitRadius;
  const initialY = Math.sin((app.startAngle * Math.PI) / 180) * app.orbitRadius;
  
  useEffect(() => {
    if (phase === 'idle' || phase === 'detecting') {
      // Gentle floating orbit animation
      controls.start({
        x: [initialX, initialX * 0.8, initialX * 1.1, initialX],
        y: [initialY, initialY * 1.1, initialY * 0.9, initialY],
        scale: [app.depth, app.depth * 1.05, app.depth * 0.95, app.depth],
        transition: {
          duration: app.orbitSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    } else if (phase === 'syncing') {
      // Magnetic convergence to center
      controls.start({
        x: 0,
        y: 0,
        scale: 0,
        opacity: 0,
        transition: {
          duration: 0.8,
          delay: index * 0.1,
          ease: [0.32, 0.72, 0, 1],
        },
      });
    } else if (phase === 'complete') {
      controls.start({
        x: initialX * 0.6,
        y: initialY * 0.6,
        scale: app.depth * 0.8,
        opacity: 1,
        transition: {
          duration: 0.6,
          delay: 0.3 + index * 0.05,
          type: 'spring',
          stiffness: 200,
          damping: 20,
        },
      });
    }
  }, [phase, controls, initialX, initialY, app.depth, app.orbitSpeed, index]);
  
  const scale = app.depth;
  const blur = (1 - app.depth) * 2;
  
  return (
    <motion.div
      initial={{ x: initialX, y: initialY, scale, opacity: 0 }}
      animate={controls}
      className="absolute"
      style={{
        filter: phase === 'idle' ? `blur(${blur}px)` : 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: index * 0.08,
          type: 'spring',
          stiffness: 300,
        }}
        className="relative"
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl blur-xl opacity-60"
          style={{ backgroundColor: app.color }}
        />
        
        {/* App icon container */}
        <div 
          className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: app.color,
            boxShadow: `0 8px 32px ${app.color}40`,
          }}
        >
          <Icon className="w-7 h-7 text-white" />
        </div>
        
        {/* Label (hidden during sync) */}
        {phase !== 'syncing' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap"
          >
            {app.name}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}

export function FloatingAppsOrbit({ phase, onSyncComplete }: FloatingAppsOrbitProps) {
  const [showSuccessRipple, setShowSuccessRipple] = useState(false);
  
  useEffect(() => {
    if (phase === 'syncing') {
      // Trigger completion after all apps converge
      const timer = setTimeout(() => {
        setShowSuccessRipple(true);
        setTimeout(() => {
          onSyncComplete?.();
        }, 800);
      }, APPS.length * 100 + 800);
      
      return () => clearTimeout(timer);
    }
  }, [phase, onSyncComplete]);
  
  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Ambient aurora glow */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-aurora-blue/30 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 0.9, 1.1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-aurora-purple/20 blur-3xl"
        />
      </div>
      
      {/* Central FLOW orb */}
      <motion.div
        animate={phase === 'syncing' ? {
          scale: [1, 1.3, 1.1],
          boxShadow: [
            '0 0 40px rgba(139, 92, 246, 0.3)',
            '0 0 80px rgba(139, 92, 246, 0.6)',
            '0 0 60px rgba(139, 92, 246, 0.4)',
          ],
        } : {
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: phase === 'syncing' ? 0.8 : 3,
          repeat: phase === 'syncing' ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
      >
        {/* Glass orb with Flow icon */}
        <div className="w-24 h-24 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora overflow-hidden">
          <motion.img
            src={flowIcon}
            alt="FLOW"
            className="w-16 h-10 object-contain"
            animate={phase === 'detecting' ? { 
              opacity: [0.8, 1, 0.8],
              filter: [
                'drop-shadow(0 0 0px rgba(255,255,255,0))',
                'drop-shadow(0 0 12px rgba(255,255,255,0.6))',
                'drop-shadow(0 0 0px rgba(255,255,255,0))',
              ],
            } : {
              opacity: 1,
            }}
            transition={phase === 'detecting' ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          />
        </div>
        
        {/* Orbital ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-20px] rounded-full border border-white/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-40px] rounded-full border border-white/5"
        />
      </motion.div>
      
      {/* Success ripple */}
      {showSuccessRipple && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full bg-aurora-gradient"
        />
      )}
      
      {/* Floating apps */}
      {APPS.map((app, index) => (
        <FloatingAppIcon
          key={app.id}
          app={app}
          phase={phase}
          index={index}
        />
      ))}
      
      {/* Particle trails (during detecting phase) */}
      {phase === 'detecting' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                x: [0, Math.cos((i * 60 * Math.PI) / 180) * 100],
                y: [0, Math.sin((i * 60 * Math.PI) / 180) * 100],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
              className="absolute w-2 h-2 rounded-full bg-aurora-blue"
            />
          ))}
        </>
      )}
    </div>
  );
}
