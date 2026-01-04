import { motion } from "framer-motion";

const ScannerFrame = () => {
  return (
    <div className="relative w-64 h-64">
      {/* Scanner frame corners */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent rounded-full" />
          <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-full" />
        </div>

        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-12 h-12">
          <div className="absolute top-0 right-0 w-full h-1 bg-accent rounded-full" />
          <div className="absolute top-0 right-0 w-1 h-full bg-accent rounded-full" />
        </div>

        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-12 h-12">
          <div className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-full" />
          <div className="absolute bottom-0 left-0 w-1 h-full bg-accent rounded-full" />
        </div>

        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-12 h-12">
          <div className="absolute bottom-0 right-0 w-full h-1 bg-accent rounded-full" />
          <div className="absolute bottom-0 right-0 w-1 h-full bg-accent rounded-full" />
        </div>
      </motion.div>

      {/* Scanning line animation */}
      <motion.div
        className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
        initial={{ top: "10%" }}
        animate={{ top: ["10%", "90%", "10%"] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 relative opacity-30">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-foreground" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground" />
        </div>
      </div>
    </div>
  );
};

export default ScannerFrame;
