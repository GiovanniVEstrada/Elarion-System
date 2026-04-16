import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { TasksProvider } from "./context/TasksContext";
import { JournalProvider } from "./context/JournalContext";
import { CalendarProvider } from "./context/CalendarContext";
import { HabitsProvider } from "./context/HabitsContext";
import { MoodsProvider } from "./context/MoodsContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import GuestBanner from "./components/layout/GuestBanner";
import Navbar from "./components/layout/Navbar";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Journal from "./pages/Journal";
import Calendar from "./pages/Calendar";
import Habits from "./pages/Habits";
import Moods from "./pages/Moods";
import Reflect from "./pages/Reflect";
import Login from "./pages/Login";
import Register from "./pages/Register";

function AnimatedRoutes() {
  const location = useLocation();

  return (
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
          <Route path="/tasks"    element={<Tasks />} />
          <Route path="/journal"  element={<Journal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/habits"   element={<Habits />} />
          <Route path="/moods"    element={<Moods />} />
          <Route path="/reflect"  element={<Reflect />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
              <div className="app-shell">
                <div className="bg-orb bg-orb-1" />
                <div className="bg-orb bg-orb-2" />
                <div className="bg-orb bg-orb-3" />
                <GuestBanner />
                <Navbar />
                <BottomNav />
                <AnimatedRoutes />
                <Footer />
              </div>
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
      </AuthProvider>
    </BrowserRouter>
  );
}
