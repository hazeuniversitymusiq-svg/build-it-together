/**
 * Guided Demo Tour Component
 * 
 * Walks users through all pages with step-by-step explanations.
 * Auto-navigates and triggers demo actions at each stop.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Play,
  Home,
  CreditCard,
  ScanLine,
  Send,
  FileText,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/contexts/DemoContext";
import { useEffect, useState } from "react";

export interface TourStep {
  id: string;
  route: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlightAction?: boolean; // Whether to highlight the demo action button
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    route: "/home",
    title: "Welcome to FLOW",
    description: "Your intelligent payment orchestrator. FLOW finds the best way to pay, every time. Let's explore the key features!",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: "home",
    route: "/home",
    title: "Home Dashboard",
    description: "View your wallet balance, quick actions, and receive payment notifications. Try the demo action to simulate an incoming payment!",
    icon: <Home className="w-6 h-6" />,
    highlightAction: true,
  },
  {
    id: "flow-card",
    route: "/flow-card",
    title: "Flow Card",
    description: "Tap to pay at any terminal. FLOW automatically selects the best funding source and handles the payment seamlessly.",
    icon: <CreditCard className="w-6 h-6" />,
    highlightAction: true,
  },
  {
    id: "scan",
    route: "/scan",
    title: "Scan & Pay",
    description: "Scan any merchant QR code. FLOW detects the payment rail (DuitNow, TnG, etc.) and routes your payment intelligently.",
    icon: <ScanLine className="w-6 h-6" />,
    highlightAction: true,
  },
  {
    id: "send",
    route: "/send",
    title: "Send Money",
    description: "Send money to contacts. FLOW finds the recipient's preferred wallet and delivers instantly.",
    icon: <Send className="w-6 h-6" />,
    highlightAction: true,
  },
  {
    id: "bills",
    route: "/bills",
    title: "Pay Bills",
    description: "Link your billers and pay with one tap. FLOW detects due dates and helps you avoid late fees.",
    icon: <FileText className="w-6 h-6" />,
    highlightAction: true,
  },
  {
    id: "complete",
    route: "/home",
    title: "Tour Complete! 🎉",
    description: "You've seen the core features of FLOW. Toggle Demo Mode anytime to explore individual page actions.",
    icon: <Sparkles className="w-6 h-6" />,
  },
];

export function DemoTour() {
  const navigate = useNavigate();
  const { 
    isTourActive, 
    currentTourStep, 
    nextTourStep, 
    prevTourStep, 
    endTour,
    triggerPageDemo,
    pageActions,
  } = useDemo();
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentStep = TOUR_STEPS[currentTourStep];
  const isFirstStep = currentTourStep === 0;
  const isLastStep = currentTourStep === TOUR_STEPS.length - 1;
  const progress = ((currentTourStep + 1) / TOUR_STEPS.length) * 100;

  // Navigate to the current step's route
  useEffect(() => {
    if (isTourActive && currentStep) {
      setIsTransitioning(true);
      navigate(currentStep.route);
      
      // Wait for navigation to complete
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isTourActive, currentTourStep, currentStep, navigate]);

  const handleNext = () => {
    if (isLastStep) {
      endTour();
    } else {
      nextTourStep();
    }
  };

  const handleTryDemo = () => {
    if (pageActions.length > 0) {
      triggerPageDemo();
    }
  };

  if (!isTourActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Backdrop overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" />
        
        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute bottom-24 left-4 right-4 pointer-events-auto"
        >
          <div className="glass-card rounded-3xl p-6 shadow-float-lg aurora-border">
            {/* Close button */}
            <button
              onClick={endTour}
              className="absolute top-4 right-4 w-8 h-8 rounded-full glass-subtle flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="h-1 bg-secondary rounded-full mb-5 overflow-hidden">
              <motion.div
                className="h-full aurora-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Step counter */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">
                Step {currentTourStep + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl aurora-gradient flex items-center justify-center text-white shrink-0">
                    {currentStep.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {currentStep.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentStep.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Try Demo Action button */}
            {currentStep.highlightAction && pageActions.length > 0 && !isTransitioning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4"
              >
                <Button
                  onClick={handleTryDemo}
                  variant="outline"
                  className="w-full rounded-2xl h-11 glass-card border-aurora-purple/30 text-aurora-purple hover:bg-aurora-purple/10"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try: {pageActions[0]?.label}
                </Button>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Button
                onClick={prevTourStep}
                disabled={isFirstStep}
                variant="outline"
                className="rounded-2xl h-11 px-4 glass-card border-0 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                className="flex-1 rounded-2xl h-11 aurora-gradient text-white border-0 shadow-glow-aurora"
              >
                {isLastStep ? "Finish Tour" : "Next"}
                {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DemoTour;
