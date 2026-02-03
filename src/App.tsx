import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import { AIChatAssistant } from "@/components/AIChatAssistant";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Index from "./pages/Index";
import Budget from "./pages/Budget";
import ExpenseCategories from "./pages/ExpenseCategories";
import Reports from "./pages/Reports";
// Integrations moved to Admin panel - import removed from main routes
import Support from "./pages/Support";
import Team from "./pages/Team";
import Alerts from "./pages/Alerts";
import Billing from "./pages/Billing";
import Calendar from "./pages/Calendar";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Compliance from "./pages/Compliance";
import SecurityDashboard from "./pages/SecurityDashboard";
import CCTVDashboard from "./pages/CCTVDashboard";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AcceptInvitation from "./pages/AcceptInvitation";
import Contact from "./pages/Contact";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { BotProtection } from "./components/security/BotProtection";
import { AdminRoute } from "./components/security/AdminRoute";
import { SubscriptionGuard } from "./components/SubscriptionGuard";
import Install from "./pages/Install";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <PWAInstallPrompt />
            <AIChatAssistant />
            <BotProtection enableProtection={true}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/install" element={<Install />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                
                {/* Protected app routes */}
                <Route 
                  path="/*" 
                  element={
                    <ProtectedRoute>
                      <SubscriptionGuard>
                        <AppLayout />
                      </SubscriptionGuard>
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/new" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetails />} />
                  <Route path="team" element={<Team />} />
                  <Route path="budget" element={<Budget />} />
                  <Route path="expense-categories" element={<ExpenseCategories />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="reports" element={<Reports />} />
                  {/* Integrations moved to Admin panel */}
                  <Route path="templates" element={<Templates />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="billing" element={<Billing />} />
                  <Route path="help" element={<Support />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="compliance" element={<Compliance />} />
                  <Route path="cctv" element={<CCTVDashboard />} />
                  <Route path="security" element={
                    <AdminRoute>
                      <SecurityDashboard />
                    </AdminRoute>
                  } />
                  <Route path="admin" element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } />
                  <Route path="" element={<Navigate to="/dashboard" replace />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BotProtection>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
