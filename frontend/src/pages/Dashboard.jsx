import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import TaskCard from "../features/tasks/TaskCard";
import JournalCard from "../features/journal/JournalCard";
import CalendarCard from "../features/calendar/CalendarCard";
import { useCalendarContext } from "../context/CalendarContext";
import { getTodayStr } from "../utils/dateUtils";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const REFLECTIONS = [
  "What you do today shapes what tomorrow becomes.",
  "Small steps forward are still steps forward.",
  "Clarity comes from doing, not from waiting.",
  "One thing at a time. That's enough.",
  "The work you show up for shows up for you.",
  "Stillness and motion are both part of the same current.",
  "You don't have to see the whole path. Just the next step.",
  "Progress is quieter than it looks.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user, isGuest } = useAuth();
  const { events } = useCalendarContext();
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    if (isGuest) return;
    client
      .get("/insights/overview")
      .then((res) => setOverview(res.data.data))
      .catch((err) => console.error("Failed to fetch overview", err));
  }, [isGuest]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const greeting = getGreeting();
  const todayStr  = getTodayStr();
  const todayEvents = events.filter((e) => e.date === todayStr);

  const reflection = useMemo(() => {
    return REFLECTIONS[new Date().getDate() % REFLECTIONS.length];
  }, []);

  const summaryLine = useMemo(() => {
    const parts = [];

    if (isGuest) {
      parts.push("No active tasks");
    } else {
      const active = overview
        ? overview.totalTasks - overview.completedTasks
        : null;

      if (active === null) {
        parts.push("Loading…");
      } else if (active === 0) {
        parts.push("No active tasks");
      } else {
        parts.push(`${active} active task${active !== 1 ? "s" : ""}`);
      }
    }

    if (todayEvents.length === 0) {
      parts.push("nothing scheduled today");
    } else {
      parts.push(`${todayEvents.length} event${todayEvents.length !== 1 ? "s" : ""} today`);
    }

    return parts.join(" · ");
  }, [overview, todayEvents, isGuest]);

  return (
    <div className="dashboard">
      <motion.header
        className="dashboard-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="dashboard-title-group">
          <motion.p
            className="dashboard-greeting"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
          >
            {greeting}
          </motion.p>

          <h1>{user?.name ?? "Elarion"}</h1>

          <motion.p
            className="dashboard-date"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {today}
          </motion.p>

          <motion.div
            className="dashboard-summary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <span className="dashboard-summary-line">{summaryLine}</span>

            {overview && (
              <span className="dashboard-summary-line" style={{ opacity: 0.55, fontSize: "0.85em" }}>
                {overview.completionRate?.toFixed(0) ?? 0}% completion · {overview.totalJournalEntries ?? 0} notes · {overview.activeHabits ?? 0} active habits
              </span>
            )}
          </motion.div>
        </div>

        <motion.p
          className="dashboard-reflection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        >
          {reflection}
        </motion.p>
      </motion.header>

      <motion.main
        className="dashboard-main"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}><TaskCard /></motion.div>
        <motion.div variants={itemVariants}><JournalCard /></motion.div>
        <motion.div variants={itemVariants}><CalendarCard /></motion.div>
      </motion.main>
    </div>
  );
}
