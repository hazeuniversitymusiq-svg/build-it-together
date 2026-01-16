/**
 * Flow Logo Component
 * 
 * Animated infinity symbol with flowing lines micro-animation.
 * Used across the platform as the primary brand mark.
 */

import { motion } from "framer-motion";
import flowLogoFull from "@/assets/flow-logo-full.png";
import flowIcon from "@/assets/flow-icon.png";

interface FlowLogoProps {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { icon: 20, full: 60 },
  sm: { icon: 32, full: 80 },
  md: { icon: 48, full: 120 },
  lg: { icon: 64, full: 160 },
  xl: { icon: 96, full: 240 },
};

export const FlowLogo = ({ 
  variant = "icon", 
  size = "md", 
  animate = true,
  className = "" 
}: FlowLogoProps) => {
  const dimensions = sizeMap[size];
  const logoSize = variant === "icon" ? dimensions.icon : dimensions.full;

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: logoSize, height: variant === "icon" ? logoSize * 0.6 : logoSize }}
    >
      {/* Animated flowing glow behind the logo */}
      {animate && (
        <motion.div
          className="absolute inset-0 blur-xl opacity-40"
          style={{
            background: "linear-gradient(90deg, #22c55e, #4ade80, #86efac, #4ade80, #22c55e)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      
      {/* Logo image */}
      <motion.img
        src={variant === "icon" ? flowIcon : flowLogoFull}
        alt="FLOW"
        className="relative z-10 object-contain"
        style={{ 
          width: logoSize, 
          height: variant === "icon" ? logoSize * 0.6 : logoSize,
          filter: "contrast(1.25) saturate(1.6) brightness(1.1)",
        }}
        initial={animate ? { opacity: 0, scale: 0.9 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : false}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </motion.div>
  );
};

/**
 * Animated Infinity Symbol (SVG)
 * For use when we need a pure vector infinity with flowing line animation
 */
interface AnimatedInfinityProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  animate?: boolean;
}

export const AnimatedInfinity = ({ 
  size = 48, 
  strokeWidth = 2.5,
  className = "",
  animate = true,
}: AnimatedInfinityProps) => {
  // Infinity path with multiple flowing strokes
  const paths = [
    { delay: 0, opacity: 1, width: strokeWidth },
    { delay: 0.3, opacity: 0.7, width: strokeWidth * 0.7 },
    { delay: 0.6, opacity: 0.4, width: strokeWidth * 0.4 },
  ];

  return (
    <motion.svg
      width={size}
      height={size * 0.5}
      viewBox="0 0 100 50"
      fill="none"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      
      {/* Multiple flowing strokes for depth */}
      {paths.map((path, index) => (
        <motion.path
          key={index}
          d="M 25 25 C 25 10, 10 10, 10 25 C 10 40, 25 40, 25 25 C 25 10, 40 10, 50 25 C 60 40, 75 40, 75 25 C 75 10, 90 10, 90 25 C 90 40, 75 40, 75 25 C 75 10, 60 10, 50 25 C 40 40, 25 40, 25 25"
          stroke="url(#flowGradient)"
          strokeWidth={path.width}
          strokeLinecap="round"
          fill="none"
          opacity={path.opacity}
          initial={{ pathLength: 0 }}
          animate={animate ? {
            pathLength: [0, 1, 1, 0],
            pathOffset: [0, 0, 0.5, 1],
          } : { pathLength: 1 }}
          transition={{
            duration: 3,
            delay: path.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.svg>
  );
};

/**
 * Flow Logo Mark - Compact icon for nav, headers, loading states
 */
interface FlowLogoMarkProps {
  size?: number;
  animate?: boolean;
  glowing?: boolean;
  className?: string;
}

export const FlowLogoMark = ({ 
  size = 40, 
  animate = true,
  glowing = false,
  className = "" 
}: FlowLogoMarkProps) => {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      whileHover={animate ? { scale: 1.05 } : undefined}
      whileTap={animate ? { scale: 0.95 } : undefined}
    >
      {/* Glow effect */}
      {glowing && (
        <motion.div
          className="absolute inset-0 rounded-full blur-lg"
          style={{
            background: "linear-gradient(135deg, #22c55e, #4ade80)",
            opacity: 0.4,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      
      <motion.img
        src={flowIcon}
        alt="FLOW"
        className="relative z-10 object-contain"
        style={{ width: size, height: size * 0.6 }}
        animate={animate ? {
          filter: [
            "drop-shadow(0 0 0px rgba(34,197,94,0))",
            "drop-shadow(0 0 8px rgba(34,197,94,0.4))",
            "drop-shadow(0 0 0px rgba(34,197,94,0))",
          ],
        } : undefined}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

/**
 * Flow Loading Logo - For loading states with continuous flow animation
 */
interface FlowLoadingLogoProps {
  size?: number;
  className?: string;
}

export const FlowLoadingLogo = ({ 
  size = 64, 
  className = "" 
}: FlowLoadingLogoProps) => {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
    >
      {/* Orbiting particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-green-400"
          style={{
            boxShadow: "0 0 8px rgba(74, 222, 128, 0.6)",
          }}
          animate={{
            x: [
              Math.cos(0 + i * (Math.PI * 2 / 3)) * (size * 0.6),
              Math.cos(Math.PI / 2 + i * (Math.PI * 2 / 3)) * (size * 0.4),
              Math.cos(Math.PI + i * (Math.PI * 2 / 3)) * (size * 0.6),
              Math.cos(Math.PI * 1.5 + i * (Math.PI * 2 / 3)) * (size * 0.4),
              Math.cos(Math.PI * 2 + i * (Math.PI * 2 / 3)) * (size * 0.6),
            ],
            y: [
              Math.sin(0 + i * (Math.PI * 2 / 3)) * (size * 0.2),
              Math.sin(Math.PI / 2 + i * (Math.PI * 2 / 3)) * (size * 0.2),
              Math.sin(Math.PI + i * (Math.PI * 2 / 3)) * (size * 0.2),
              Math.sin(Math.PI * 1.5 + i * (Math.PI * 2 / 3)) * (size * 0.2),
              Math.sin(Math.PI * 2 + i * (Math.PI * 2 / 3)) * (size * 0.2),
            ],
            opacity: [0.8, 1, 0.8, 1, 0.8],
            scale: [1, 1.3, 1, 1.3, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.15,
          }}
        />
      ))}
      
      {/* Center logo */}
      <motion.img
        src={flowIcon}
        alt="FLOW"
        className="relative z-10 object-contain"
        style={{ width: size, height: size * 0.6 }}
        animate={{
          opacity: [0.8, 1, 0.8],
          scale: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

export default FlowLogo;
