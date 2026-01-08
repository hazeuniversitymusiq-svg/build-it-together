import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 safe-area-top safe-area-bottom">
      {/* Main content - centered vertically */}
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-foreground tracking-tight mb-8"
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

        {/* Permission note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-secondary rounded-2xl p-4 mb-8"
        >
          <p className="text-sm text-secondary-foreground leading-relaxed">
            You control what you connect.
          </p>
          <p className="text-sm text-secondary-foreground leading-relaxed">
            You can change this anytime.
          </p>
        </motion.div>
      </div>

      {/* Bottom section - fixed to bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="pb-6 max-w-md mx-auto w-full"
      >
        {/* Primary button */}
        <Button
          onClick={() => navigate("/auth")}
          className="w-full h-14 text-base font-medium rounded-2xl mb-4"
        >
          Continue
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
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
