import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PwaUpdateNotifier } from "@/components/PwaUpdateNotifier";
import { LocationSync } from "@/components/LocationSync";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useVersionCheck } from "@/hooks/useVersionCheck";

// Eager: these are lightweight redirectors hit on every load
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy: split each page into its own chunk
const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const Plans = lazy(() => import("./pages/Plans"));
const Success = lazy(() => import("./pages/Success"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Reports = lazy(() => import("./pages/Reports"));
const Admin = lazy(() => import("./pages/Admin"));
const Install = lazy(() => import("./pages/Install"));
const Goals = lazy(() => import("./pages/Goals"));
const Cards = lazy(() => import("./pages/Cards"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useVersionCheck();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppModeProvider>
              <SidebarProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <PwaUpdateNotifier />
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <LocationSync />
                    <Suspense fallback={null}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/app" element={<Index />} />
                        <Route path="/landing" element={<Landing />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/plans" element={<Plans />} />
                        <Route path="/success" element={<Success />} />
                        <Route path="/transactions" element={<Transactions />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/install" element={<Install />} />
                        <Route path="/goals" element={<Goals />} />
                        <Route path="/cards" element={<Cards />} />
                        <Route path="/accounts" element={<BankAccounts />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </SidebarProvider>
            </AppModeProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
