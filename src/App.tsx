import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { IntentProvider } from "@/contexts/IntentContext";
import { OrchestrationProvider } from "@/contexts/OrchestrationContext";
import { DemoProvider } from "@/contexts/DemoContext";
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
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import QuickConnectPage from "./pages/QuickConnectPage";
import NotFound from "./pages/NotFound";

// Component to handle password recovery redirects at app level - runs FIRST
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    const fullUrl = hash + search;

    // Immediately redirect recovery links to /auth BEFORE anything else renders
    if (fullUrl.includes('type=recovery') || fullUrl.includes('type%3Drecovery') || 
        fullUrl.includes('access_token=') || fullUrl.includes('token_hash=')) {
      if (location.pathname !== '/auth') {
        navigate(`/auth${search}${hash}`, { replace: true });
        return;
      }
    }

    // Listen for PASSWORD_RECOVERY event from Supabase auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  return null;
};

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Streamlined Onboarding: Welcome → Auth → Quick Connect → Home */}
        <Route path="/" element={<PageTransition><WelcomePage /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><AuthPage /></PageTransition>} />
        <Route path="/connect" element={<PageTransition><QuickConnectPage /></PageTransition>} />
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
              <DemoProvider>
                <RecoveryRedirect />
                <OnboardingFlow />
                <AnimatedRoutes />
              </DemoProvider>
            </BrowserRouter>
          </IntentProvider>
        </OrchestrationProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
