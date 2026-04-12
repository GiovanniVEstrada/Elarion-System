import { useMemo } from "react";
import { motion } from "motion/react";
import TaskCard from "../features/tasks/TaskCard";
import JournalCard from "../features/journal/JournalCard";
import CalendarCard from "../features/calendar/CalendarCard";
import { useTasksContext } from "../context/TasksContext";
import { useCalendarContext } from "../context/CalendarContext";
import { getTodayStr } from "../utils/dateUtils";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.42,
      ease: "easeOut",
    },
  },
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
  const { activeCount } = useTasksContext();
  const { events } = useCalendarContext();

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = getGreeting();
  const todayStr = getTodayStr();

  const todayEvents = events.filter((e) => e.date === todayStr);

  const reflection = useMemo(() => {
    const dayIndex = new Date().getDate();
    return REFLECTIONS[dayIndex % REFLECTIONS.length];
  }, []);

  const summaryLine = useMemo(() => {
    const parts = [];

    if (activeCount === 0) {
      parts.push("No active tasks");
    } else if (activeCount === 1) {
      parts.push("1 active task");
    } else {
      parts.push(`${activeCount} active tasks`);
    }

    if (todayEvents.length === 0) {
      parts.push("nothing scheduled today");
    } else if (todayEvents.length === 1) {
      parts.push(`1 event today`);
    } else {
      parts.push(`${todayEvents.length} events today`);
    }

    return parts.join(" · ");
  }, [activeCount, todayEvents]);

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

          <h1>Elarion</h1>

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
          </motion.div>

          <motion.p
            className="dashboard-reflection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.22, duration: 0.4 }}
          >
            {reflection}
          </motion.p>
        </div>
      </motion.header>

      <motion.main
        className="dashboard-main"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <TaskCard />
        </motion.div>

        <motion.div variants={itemVariants}>
          <JournalCard />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CalendarCard />
        </motion.div>
      </motion.main>
    </div>
  );
}