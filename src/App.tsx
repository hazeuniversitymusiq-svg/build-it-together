import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { IntentProvider } from "@/contexts/IntentContext";
import WelcomePage from "./pages/WelcomePage";
import PermissionsPage from "./pages/PermissionsPage";
import AuthPage from "./pages/AuthPage";
import BiometricSetupPage from "./pages/BiometricSetupPage";
import FundingStackPage from "./pages/FundingStackPage";
import LinkFundingPage from "./pages/LinkFundingPage";
import ScanPage from "./pages/ScanPage";
import SendPage from "./pages/SendPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SecurityProvider>
        <IntentProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Phase 1: Trust & Consent Flow */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              
              {/* Phase 2: Identity & Security */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/biometric-setup" element={<BiometricSetupPage />} />
              
              {/* Phase 3: Funding Stack Declaration */}
              <Route path="/funding-stack" element={<FundingStackPage />} />
              <Route path="/link-funding" element={<LinkFundingPage />} />
              
              {/* Phase 4+: Authenticated App with Intent Engine */}
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/send" element={<SendPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </IntentProvider>
      </SecurityProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
