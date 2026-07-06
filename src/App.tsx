import { lazy, Suspense, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { PageLoader } from "@/components/PageLoader";
import { SplashScreen } from "@/components/SplashScreen";
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

// Eager: lightweight redirectors hit on every load
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

// Lazy: split each page into its own chunk
const Index        = lazy(() => import("./pages/Index"));
const Landing      = lazy(() => import("./pages/Landing"));
const Auth         = lazy(() => import("./pages/Auth"));
const Onboarding   = lazy(() => import("./pages/Onboarding"));
const Settings     = lazy(() => import("./pages/Settings"));
const Plans        = lazy(() => import("./pages/Plans"));
const Success      = lazy(() => import("./pages/Success"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Reports      = lazy(() => import("./pages/Reports"));
const Admin        = lazy(() => import("./pages/Admin"));
const Install      = lazy(() => import("./pages/Install"));
const Goals        = lazy(() => import("./pages/Goals"));
const Cards        = lazy(() => import("./pages/Cards"));
const BankAccounts = lazy(() => import("./pages/BankAccounts"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Page transition variants ─────────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const pageTransition = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

// ── Animated route wrapper (must live inside BrowserRouter) ──────────────────
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes location={location}>
            <Route path="/"             element={<Home />} />
            <Route path="/app"          element={<Index />} />
            <Route path="/landing"      element={<Landing />} />
            <Route path="/auth"         element={<Auth />} />
            <Route path="/onboarding"   element={<Onboarding />} />
            <Route path="/settings"     element={<Settings />} />
            <Route path="/plans"        element={<Plans />} />
            <Route path="/success"      element={<Success />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/reports"      element={<Reports />} />
            <Route path="/admin"        element={<Admin />} />
            <Route path="/install"      element={<Install />} />
            <Route path="/goals"        element={<Goals />} />
            <Route path="/cards"        element={<Cards />} />
            <Route path="/accounts"     element={<BankAccounts />} />
            <Route path="*"             element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// ── App root ─────────────────────────────────────────────────────────────────
const App = () => {
  useVersionCheck();

  // Show splash only on first session visit
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem("crivo_intro_v1");
    } catch {
      return true;
    }
  });

  const handleSplashComplete = useCallback(() => {
    try { sessionStorage.setItem("crivo_intro_v1", "1"); } catch { /* private */ }
    setShowSplash(false);
  }, []);

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

                  {/* ── Splash screen (first load only) ── */}
                  <AnimatePresence>
                    {showSplash && (
                      <SplashScreen onComplete={handleSplashComplete} />
                    )}
                  </AnimatePresence>

                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <LocationSync />
                    <AnimatedRoutes />
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
