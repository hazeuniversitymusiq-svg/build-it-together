/**
 * Micro-Animations Library
 * 
 * Apple Intelligence-inspired micro-interactions for FLOW.
 * Cohesive, fluid, and delightful animations.
 */

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ============= Animation Variants =============

export const pulseGlow: Variants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const successBounce: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.2, 0.9, 1],
    opacity: 1,
    transition: {
      duration: 0.6,
      times: [0, 0.4, 0.7, 1],
      ease: "easeOut",
    },
  },
};

export const shimmer: Variants = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 0.5,
      ease: "easeInOut",
    },
  },
};

export const float: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const breathe: Variants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinSync: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

export const checkmarkDraw: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: "easeOut" },
      opacity: { duration: 0.1 },
    },
  },
};

export const ripple: Variants = {
  initial: { scale: 0, opacity: 0.8 },
  animate: {
    scale: 2.5,
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

export const countUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// ============= Animated Components =============

interface AnimatedCheckmarkProps {
  size?: number;
  className?: string;
  delay?: number;
}

export const AnimatedCheckmark = ({ size = 24, className, delay = 0 }: AnimatedCheckmarkProps) => (
  <motion.svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    initial="initial"
    animate="animate"
  >
    <motion.path
      d="M5 13l4 4L19 7"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={checkmarkDraw}
      transition={{ delay }}
    />
  </motion.svg>
);

interface PulsingDotProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulsingDot = ({ color = 'bg-success', size = 'sm', className }: PulsingDotProps) => {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <span className={cn("relative inline-flex", className)}>
      <span className={cn(sizes[size], color, "rounded-full")} />
      <motion.span
        className={cn(sizes[size], color, "absolute rounded-full")}
        animate={{
          scale: [1, 2, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
    </span>
  );
};

interface SyncSpinnerProps {
  size?: number;
  className?: string;
}

export const SyncSpinner = ({ size = 20, className }: SyncSpinnerProps) => (
  <motion.div
    className={cn("", className)}
    animate={{ rotate: 360 }}
    transition={{
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    }}
  >
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
    </svg>
  </motion.div>
);

interface ShimmerEffectProps {
  className?: string;
}

export const ShimmerEffect = ({ className }: ShimmerEffectProps) => (
  <motion.div
    className={cn(
      "absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent",
      className
    )}
    animate={{ x: ['0%', '200%'] }}
    transition={{
      duration: 1.5,
      repeat: Infinity,
      repeatDelay: 1,
      ease: "easeInOut",
    }}
  />
);

interface RippleButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  rippleColor?: string;
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ children, rippleColor = "bg-white/30", className, onClick, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          // Create ripple effect
          const button = e.currentTarget;
          const rect = button.getBoundingClientRect();
          const rippleEl = document.createElement('span');
          const size = Math.max(rect.width, rect.height);
          const x = e.clientX - rect.left - size / 2;
          const y = e.clientY - rect.top - size / 2;
          
          rippleEl.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
          `;
          rippleEl.className = rippleColor;
          
          button.appendChild(rippleEl);
          setTimeout(() => rippleEl.remove(), 600);
          
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
RippleButton.displayName = 'RippleButton';

interface SuccessCircleProps {
  size?: number;
  className?: string;
  delay?: number;
}

export const SuccessCircle = ({ size = 80, className, delay = 0 }: SuccessCircleProps) => (
  <motion.div
    className={cn("relative", className)}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay,
    }}
  >
    {/* Outer glow ring */}
    <motion.div
      className="absolute inset-0 rounded-full bg-success"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1.3, opacity: 0.2 }}
      transition={{ delay: delay + 0.2, duration: 0.5 }}
      style={{ filter: 'blur(20px)' }}
    />
    
    {/* Main circle */}
    <div
      className="relative rounded-full bg-success/20 flex items-center justify-center backdrop-blur-sm"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="rounded-full bg-success flex items-center justify-center shadow-lg"
        style={{ width: size * 0.7, height: size * 0.7 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
      >
        <AnimatedCheckmark size={size * 0.35} className="text-white" delay={delay + 0.4} />
      </motion.div>
    </div>
  </motion.div>
);

interface CountingNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export const CountingNumber = ({ 
  value, 
  prefix = '', 
  suffix = '', 
  duration = 1,
  className 
}: CountingNumberProps) => {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
      >
        {prefix}
      </motion.span>
      <motion.span
        initial={{ filter: 'blur(10px)' }}
        animate={{ filter: 'blur(0px)' }}
        transition={{ duration }}
      >
        {value.toFixed(2)}
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1, delay: duration }}
      >
        {suffix}
      </motion.span>
    </motion.span>
  );
};

interface TopUpAnimationProps {
  fromAmount: number;
  toAmount: number;
  className?: string;
}

export const TopUpAnimation = ({ fromAmount, toAmount, className }: TopUpAnimationProps) => (
  <motion.div className={cn("flex items-center gap-2", className)}>
    <motion.span
      className="text-muted-foreground line-through"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 0.5, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      RM {fromAmount.toFixed(2)}
    </motion.span>
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring" }}
      className="text-success"
    >
      →
    </motion.span>
    <motion.span
      className="font-semibold text-success"
      initial={{ opacity: 0, x: 10, scale: 1.2 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: 0.4, type: "spring" }}
    >
      RM {toAmount.toFixed(2)}
    </motion.span>
  </motion.div>
);

interface CardFlipProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  className?: string;
}

export const CardFlip = ({ front, back, isFlipped, className }: CardFlipProps) => (
  <div className={cn("relative perspective-1000", className)} style={{ perspective: 1000 }}>
    <motion.div
      className="w-full h-full"
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
        {front}
      </div>
      <div 
        className="absolute inset-0 backface-hidden" 
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        {back}
      </div>
    </motion.div>
  </div>
);

// ============= CSS Keyframes (add to index.css) =============
// @keyframes ripple {
//   to { transform: scale(4); opacity: 0; }
// }
