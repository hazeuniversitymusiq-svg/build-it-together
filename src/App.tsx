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
import WelcomePage from "./pages/WelcomePage";
import PermissionsPage from "./pages/PermissionsPage";
import AuthPage from "./pages/AuthPage";
import BiometricSetupPage from "./pages/BiometricSetupPage";
import FundingStackPage from "./pages/FundingStackPage";
import LinkFundingPage from "./pages/LinkFundingPage";
import AutoSyncPage from "./pages/AutoSyncPage";
import FlowIdentityPage from "./pages/FlowIdentityPage";
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
import RequestMoneySurface from "./components/surfaces/RequestMoneySurface";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Phase 1: Trust & Consent Flow */}
        <Route path="/" element={<PageTransition><WelcomePage /></PageTransition>} />
        <Route path="/permissions" element={<PageTransition><PermissionsPage /></PageTransition>} />
        
        {/* Phase 2: Identity & Security */}
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/biometric-setup" element={<PageTransition><BiometricSetupPage /></PageTransition>} />
        
        {/* Phase 3: Funding Stack Declaration */}
        <Route path="/funding-stack" element={<PageTransition><FundingStackPage /></PageTransition>} />
        <Route path="/link-funding" element={<PageTransition><LinkFundingPage /></PageTransition>} />
        <Route path="/auto-sync" element={<PageTransition><AutoSyncPage /></PageTransition>} />
        <Route path="/flow-identity" element={<PageTransition><FlowIdentityPage /></PageTransition>} />
        <Route path="/home" element={<PageTransition><HomePage /></PageTransition>} />
        
        {/* Phase 4+: Authenticated App with Intent Engine */}
        <Route path="/scan" element={<PageTransition><ScanPage /></PageTransition>} />
        <Route path="/resolve/:intentId" element={<PageTransition><ResolvePage /></PageTransition>} />
        <Route path="/confirm/:planId" element={<PageTransition><ConfirmPage /></PageTransition>} />
        <Route path="/handoff/:planId" element={<PageTransition><HandoffPage /></PageTransition>} />
        <Route path="/done/:transactionId" element={<PageTransition><DonePage /></PageTransition>} />
        <Route path="/send" element={<PageTransition><SendPage /></PageTransition>} />
        <Route path="/request" element={<PageTransition><RequestMoneySurface /></PageTransition>} />
        <Route path="/bills" element={<PageTransition><BillsPage /></PageTransition>} />
        <Route path="/activity" element={<PageTransition><ActivityPage /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
