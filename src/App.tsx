import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { IntentProvider } from "@/contexts/IntentContext";
import { OrchestrationProvider } from "@/contexts/OrchestrationContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/layout/PageTransition";
import AppLayout from "./components/layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import AuthPage from "./pages/AuthPage";
import AutoSyncPage from "./pages/AutoSyncPage";
import HomePage from "./pages/HomePage";
import ScanPage from "./pages/ScanPage";
import ResolvePage from "./pages/ResolvePage";
import ConfirmPage from "./pages/ConfirmPage";
import HandoffPage from "./pages/HandoffPage";
import DonePage from "./pages/DonePage";
import SendPage from "./pages/SendPage";
import BillsPage from "./pages/BillsPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import DemoPage from "./pages/DemoPage";
import RequestMoneySurface from "./components/surfaces/RequestMoneySurface";
import ReceivePage from "./pages/ReceivePage";
import PartnerPitchPage from "./pages/PartnerPitchPage";
import FlowCardPage from "./pages/FlowCardPage";
import FlowCardActivityPage from "./pages/FlowCardActivityPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Streamlined 4-Step Onboarding: Welcome → Auth + Security → Auto-Sync → Home */}
        <Route path="/" element={<PageTransition><WelcomePage /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/auto-sync" element={<PageTransition><AutoSyncPage /></PageTransition>} />
        
        {/* Transaction Flow (No Bottom Nav - focused experience) */}
        <Route path="/resolve/:intentId" element={<PageTransition><ResolvePage /></PageTransition>} />
        <Route path="/confirm/:planId" element={<PageTransition><ConfirmPage /></PageTransition>} />
        <Route path="/handoff/:planId" element={<PageTransition><HandoffPage /></PageTransition>} />
        <Route path="/done/:transactionId" element={<PageTransition><DonePage /></PageTransition>} />
        <Route path="/request" element={<PageTransition><RequestMoneySurface /></PageTransition>} />
        <Route path="/receive" element={<PageTransition><ReceivePage /></PageTransition>} />
        <Route path="/demo" element={<PageTransition><DemoPage /></PageTransition>} />
        <Route path="/partner" element={<PageTransition><PartnerPitchPage /></PageTransition>} />
        
        {/* Main App Routes (With Bottom Nav) */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<PageTransition><HomePage /></PageTransition>} />
          <Route path="/send" element={<PageTransition><SendPage /></PageTransition>} />
          <Route path="/scan" element={<PageTransition><ScanPage /></PageTransition>} />
          <Route path="/bills" element={<PageTransition><BillsPage /></PageTransition>} />
          <Route path="/activity" element={<PageTransition><ActivityPage /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          {/* Flow Card Routes (feature-flagged in component) */}
          <Route path="/flow-card" element={<PageTransition><FlowCardPage /></PageTransition>} />
          <Route path="/flow-card/activity" element={<PageTransition><FlowCardActivityPage /></PageTransition>} />
        </Route>
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SecurityProvider>
        <OrchestrationProvider>
          <IntentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </IntentProvider>
        </OrchestrationProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
