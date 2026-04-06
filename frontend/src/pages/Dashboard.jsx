import { motion } from "motion/react";
import TaskCard from "../features/tasks/TaskCard";
import JournalCard from "../features/journal/JournalCard";
import CalendarCard from "../features/calendar/CalendarCard";

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

export default function Dashboard() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard">
      <motion.header
        className="dashboard-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="dashboard-title-group">
          <h1>Elarion</h1>
          <p>{today}</p>

          <motion.div
            className="dashboard-stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.3 }}
          >
            <span>Quick access</span>
            <span>Live previews</span>
            <span>Focused workflow</span>
          </motion.div>
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