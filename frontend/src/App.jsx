import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { TasksProvider } from "./context/TasksContext";
import { JournalProvider } from "./context/JournalContext";
import { CalendarProvider } from "./context/CalendarContext";
import { HabitsProvider } from "./context/HabitsContext";
import { MoodsProvider } from "./context/MoodsContext";
import { ReflectionsProvider } from "./context/ReflectionsContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import OfflineBanner from "./components/layout/OfflineBanner";
import ToastContainer from "./components/Toast";

const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Habits     = lazy(() => import("./pages/Habits"));
const Journal    = lazy(() => import("./pages/Journal"));
const Calendar   = lazy(() => import("./pages/Calendar"));
const Reflect    = lazy(() => import("./pages/Reflect"));
const Login      = lazy(() => import("./pages/Login"));
const Register   = lazy(() => import("./pages/Register"));
const Settings   = lazy(() => import("./pages/Settings"));
const NotFound   = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={null}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.98, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: -16 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/tasks"    element={<Navigate to="/calendar" replace />} />
            <Route path="/habits"   element={<Habits />} />
            <Route path="/journal"  element={<Journal />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/moods"    element={<Navigate to="/reflect" replace />} />
            <Route path="/reflect"  element={<Reflect />} />
            <Route path="/settings"    element={<Settings />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*"           element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </Suspense>
  );
}

function AppShell() {
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");

    function handleScroll() {
      if (mq.matches) return;
      const scrollY = window.scrollY;
      document.documentElement.style.setProperty("--bg-shift-1", `${scrollY * 0.08}px`);
      document.documentElement.style.setProperty("--bg-shift-2", `${scrollY * 0.04}px`);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <TasksProvider>
      <JournalProvider>
        <CalendarProvider>
          <HabitsProvider>
            <MoodsProvider>
              <ReflectionsProvider>
                <div className="app-shell">
                  <div className="bg-orb bg-orb-1" />
                  <div className="bg-orb bg-orb-2" />
                  <div className="bg-orb bg-orb-3" />
                  <OfflineBanner />
                  <Navbar />
                  <AnimatedRoutes />
                  <Footer />
                  <ToastContainer />
                </div>
              </ReflectionsProvider>
            </MoodsProvider>
          </HabitsProvider>
        </CalendarProvider>
      </JournalProvider>
    </TasksProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Public routes — no data providers mount here */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected — providers only mount after auth is confirmed */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
