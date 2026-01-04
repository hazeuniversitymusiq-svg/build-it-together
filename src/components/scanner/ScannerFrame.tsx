import { motion } from "framer-motion";

const ScannerFrame = () => {
  return (
    <div className="relative w-72 h-72">
      {/* Subtle outer glow */}
      <div className="absolute -inset-4 bg-accent/5 rounded-[3rem] blur-2xl" />
      
      {/* Scanner frame corners - refined and elegant */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-foreground/80 rounded-full" />
          <div className="absolute top-0 left-0 w-[3px] h-full bg-foreground/80 rounded-full" />
        </div>

        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-16 h-16">
          <div className="absolute top-0 right-0 w-full h-[3px] bg-foreground/80 rounded-full" />
          <div className="absolute top-0 right-0 w-[3px] h-full bg-foreground/80 rounded-full" />
        </div>

        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-16 h-16">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-foreground/80 rounded-full" />
          <div className="absolute bottom-0 left-0 w-[3px] h-full bg-foreground/80 rounded-full" />
        </div>

        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-16 h-16">
          <div className="absolute bottom-0 right-0 w-full h-[3px] bg-foreground/80 rounded-full" />
          <div className="absolute bottom-0 right-0 w-[3px] h-full bg-foreground/80 rounded-full" />
        </div>
      </motion.div>

      {/* Gentle breathing animation - feels alive, not busy */}
      <motion.div
        className="absolute inset-8 rounded-3xl border border-foreground/5"
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.01, 1]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

export default ScannerFrame;
