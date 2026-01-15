import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Capacitor } from "@capacitor/core";
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
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import OAuthStartPage from "./pages/OAuthStartPage";
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

const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

// Component to handle password recovery redirects at app level - runs FIRST
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const hash = window.location.hash;
  const search = window.location.search;
  const fullUrl = hash + search;

  const isAuthCallback =
    fullUrl.includes('type=recovery') ||
    fullUrl.includes('type%3Drecovery') ||
    fullUrl.includes('access_token=') ||
    fullUrl.includes('refresh_token=') ||
    fullUrl.includes('token_hash=') ||
    fullUrl.includes('code=') ||
    fullUrl.includes('error_code=') ||
    fullUrl.includes('error_description=');

  const isRecovery =
    fullUrl.includes('type=recovery') || fullUrl.includes('type%3Drecovery');

  // IMPORTANT: hooks must be called unconditionally; compute redirect decision first.
  const shouldRedirect =
    isAuthCallback && location.pathname !== '/auth' && location.pathname !== '/oauth/callback';

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        try {
          sessionStorage.setItem('flow_auth_callback', 'recovery');
        } catch {
          // ignore
        }
        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  // Redirect during render (no flash of Welcome/Onboarding)
  if (shouldRedirect) {
    try {
      sessionStorage.setItem('flow_auth_callback', isRecovery ? 'recovery' : 'auth');
    } catch {
      // ignore
    }
    return <Navigate to={`/auth${search}${hash}`} replace />;
  }

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
        <Route path="/oauth/start" element={<OAuthStartPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/connect" element={<PageTransition><QuickConnectPage /></PageTransition>} />
        <Route path="/auto-sync" element={<PageTransition><AutoSyncPage /></PageTransition>} />

        {/* Transaction Flow (No Bottom Nav - focused experience) */}
        <Route path="/resolve/:intentId" element={<PageTransition><ResolvePage /></PageTransition>} />
        <Route path="/confirm/:planId" element={<PageTransition><ConfirmPage /></PageTransition>} />
        <Route path="/handoff/:planId" element={<PageTransition><HandoffPage /></PageTransition>} />
        <Route path="/done/:transactionId" element={<PageTransition><DonePage /></PageTransition>} />
        <Route path="/request" element={<PageTransition><RequestMoneySurface /></PageTransition>} />
        <Route path="/receive" element={<PageTransition><ReceivePage /></PageTransition>} />
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
          {/* Demo Page - needs bottom nav for navigation */}
          <Route path="/demo" element={<PageTransition><DemoPage /></PageTransition>} />
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
            <Router>
              <DemoProvider>
                <RecoveryRedirect />
                <OnboardingFlow />
                <AnimatedRoutes />
              </DemoProvider>
            </Router>
          </IntentProvider>
        </OrchestrationProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
