/**
 * Floating Apps Orbit Component
 * 
 * Apple Intelligence-inspired floating app constellation that orbits
 * around a central FLOW orb. Apps float with depth, blur, and glow effects,
 * then magnetically converge during sync.
 */

/**
 * Floating Apps Orbit Component
 *
 * Apple Intelligence-inspired floating app constellation that orbits
 * around a central FLOW orb. Apps float with depth and subtle blur,
 * then magnetically converge during sync.
 */

import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CreditCard,
  Receipt,
  Smartphone,
  Wallet,
  Zap,
} from 'lucide-react';

type OrbitPhase = 'idle' | 'detecting' | 'syncing' | 'complete';

type AppTone = 'blue' | 'teal' | 'pink' | 'purple' | 'amber';

interface FloatingApp {
  id: string;
  name: string;
  icon: React.ElementType;
  tone: AppTone;
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  depth: number; // 0-1, affects scale and blur
}

const APPS: FloatingApp[] = [
  { id: 'tng', name: 'TouchNGo', icon: Wallet, tone: 'blue', orbitRadius: 120, orbitSpeed: 25, startAngle: 0, depth: 0.9 },
  { id: 'grab', name: 'GrabPay', icon: Wallet, tone: 'teal', orbitRadius: 140, orbitSpeed: 30, startAngle: 72, depth: 0.7 },
  { id: 'boost', name: 'Boost', icon: Zap, tone: 'amber', orbitRadius: 100, orbitSpeed: 20, startAngle: 144, depth: 1 },
  { id: 'maybank', name: 'Maybank', icon: Building2, tone: 'purple', orbitRadius: 160, orbitSpeed: 35, startAngle: 216, depth: 0.6 },
  { id: 'atome', name: 'Atome', icon: CreditCard, tone: 'pink', orbitRadius: 130, orbitSpeed: 28, startAngle: 288, depth: 0.8 },
  { id: 'spay', name: 'SPayLater', icon: CreditCard, tone: 'amber', orbitRadius: 110, orbitSpeed: 22, startAngle: 45, depth: 0.85 },
  { id: 'tnb', name: 'TNB', icon: Receipt, tone: 'blue', orbitRadius: 150, orbitSpeed: 32, startAngle: 180, depth: 0.65 },
  { id: 'maxis', name: 'Maxis', icon: Smartphone, tone: 'teal', orbitRadius: 135, orbitSpeed: 27, startAngle: 270, depth: 0.75 },
];

const TONE_BG: Record<AppTone, string> = {
  blue: 'bg-aurora-blue',
  teal: 'bg-aurora-teal',
  pink: 'bg-aurora-pink',
  purple: 'bg-aurora-purple',
  amber: 'bg-amber-500',
};

const TONE_GLOW: Record<AppTone, string> = {
  blue: 'bg-aurora-blue/40',
  teal: 'bg-aurora-teal/40',
  pink: 'bg-aurora-pink/40',
  purple: 'bg-aurora-purple/40',
  amber: 'bg-amber-500/40',
};

interface FloatingAppsOrbitProps {
  phase: OrbitPhase;
}

function FloatingAppIcon({
  app,
  phase,
  index,
}: {
  app: FloatingApp;
  phase: OrbitPhase;
  index: number;
}) {
  const controls = useAnimationControls();
  const Icon = app.icon;

  const initialX = Math.cos((app.startAngle * Math.PI) / 180) * app.orbitRadius;
  const initialY = Math.sin((app.startAngle * Math.PI) / 180) * app.orbitRadius;

  useEffect(() => {
    if (phase === 'idle' || phase === 'detecting') {
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
        {/* Glow */}
        <div className={`absolute inset-0 rounded-2xl blur-xl opacity-60 ${TONE_GLOW[app.tone]}`} />

        {/* Icon container */}
        <div
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${TONE_BG[app.tone]}`}
        >
          <Icon className="w-7 h-7 text-primary-foreground" />
        </div>

        {/* Label */}
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

export function FloatingAppsOrbit({ phase }: FloatingAppsOrbitProps) {
  const [rippleKey, setRippleKey] = useState(0);

  useEffect(() => {
    if (phase === 'complete') setRippleKey((k) => k + 1);
  }, [phase]);

  const showRipple = phase === 'complete';

  const particleCount = useMemo(() => 6, []);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Ambient aurora glow */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-aurora-blue/30 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-aurora-purple/20 blur-3xl"
        />
      </div>

      {/* Central FLOW orb */}
      <motion.div
        animate={
          phase === 'syncing'
            ? {
                scale: [1, 1.3, 1.1],
                boxShadow: [
                  '0 0 40px hsl(var(--primary) / 0.25)',
                  '0 0 80px hsl(var(--primary) / 0.45)',
                  '0 0 60px hsl(var(--primary) / 0.35)',
                ],
              }
            : { scale: [1, 1.05, 1] }
        }
        transition={{
          duration: phase === 'syncing' ? 0.8 : 3,
          repeat: phase === 'syncing' ? 0 : Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
      >
        <div className="w-24 h-24 rounded-full aurora-gradient flex items-center justify-center shadow-glow-aurora">
          <motion.div
            animate={phase === 'detecting' ? { rotate: 360 } : {}}
            transition={phase === 'detecting' ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
          >
            <span className="text-3xl font-bold text-primary-foreground tracking-tight">F</span>
          </motion.div>
        </div>

        {/* Orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-20px] rounded-full border border-foreground/10"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[-40px] rounded-full border border-foreground/5"
        />
      </motion.div>

      {/* Success ripple */}
      {showRipple && (
        <motion.div
          key={rippleKey}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute w-24 h-24 rounded-full bg-aurora-gradient"
        />
      )}

      {/* Floating apps */}
      {APPS.map((app, index) => (
        <FloatingAppIcon key={app.id} app={app} phase={phase} index={index} />
      ))}

      {/* Particle trails (detecting) */}
      {phase === 'detecting' && (
        <>
          {[...Array(particleCount)].map((_, i) => (
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
