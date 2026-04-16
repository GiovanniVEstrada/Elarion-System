import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Navbar from "./components/layout/Navbar";
import BottomNav from "./components/layout/BottomNav";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Journal from "./pages/Journal";
import Calendar from "./pages/Calendar";
import Reflect from "./pages/Reflect";
import { TasksProvider } from "./context/TasksContext";
import { JournalProvider } from "./context/JournalContext";
import { CalendarProvider } from "./context/CalendarContext";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: -16 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reflect" element={<Reflect />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
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
    <BrowserRouter>
      <TasksProvider>
        <JournalProvider>
          <CalendarProvider>
            <div className="app-shell">
              <div className="bg-orb bg-orb-1" />
              <div className="bg-orb bg-orb-2" />
              <div className="bg-orb bg-orb-3" />
              <Navbar />
              <BottomNav />
              <AnimatedRoutes />
              <Footer />
            </div>
          </CalendarProvider>
        </JournalProvider>
      </TasksProvider>
    </BrowserRouter>
  );
}