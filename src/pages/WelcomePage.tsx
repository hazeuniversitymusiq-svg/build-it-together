import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-aurora-blue/5 flex flex-col px-6 safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Aurora background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-aurora-gradient opacity-10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-aurora-pink/20 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />
      
      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full relative z-10">
        {/* Title with gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-foreground via-foreground to-aurora-blue bg-clip-text"
        >
          FLOW
        </motion.h1>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-2xl font-semibold text-foreground mb-6"
        >
          Pay without managing apps.
        </motion.h2>

        {/* Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <p className="text-base text-muted-foreground leading-relaxed">
            FLOW connects to your existing wallets, banks, and bill apps.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            FLOW does not hold your money.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed">
            You always confirm before anything happens.
          </p>
        </motion.div>

      </div>

      {/* Bottom section - fixed to bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="pb-6 max-w-md mx-auto w-full relative z-10"
      >
        {/* Primary button with aurora gradient */}
        <Button
          onClick={() => navigate("/auth")}
          className="w-full h-14 text-base font-medium rounded-2xl aurora-gradient text-white shadow-glow-aurora hover:opacity-90 transition-opacity"
        >
          Continue
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed mt-4">
          By continuing, you agree to FLOW's{" "}
          <button className="underline hover:text-foreground transition-colors">
            terms
          </button>{" "}
          and{" "}
          <button className="underline hover:text-foreground transition-colors">
            privacy policy
          </button>
          .
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
