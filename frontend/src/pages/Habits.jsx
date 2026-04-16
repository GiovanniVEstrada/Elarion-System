import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useHabitsContext } from "../context/HabitsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import { tapAnim, hoverAnim } from "../utils/motion";

const FREQ_LABELS = { daily: "Daily", weekly: "Weekly" };
const FREQ_COLORS = { daily: "var(--accent)", weekly: "var(--accent-3)" };

function StreakBadge({ habit }) {
  const streak = habit.currentStreak ?? habit.streak ?? 0;
  if (!streak) return null;
  return (
    <span className="habit-streak">
      🔥 {streak}
    </span>
  );
}

export default function Habits() {
  const {
    habits,
    loading,
    filter,
    setFilter,
    name,
    setName,
    description,
    setDescription,
    frequency,
    setFrequency,
    completedToday,
    handleAddHabit,
    handleComplete,
    handleArchive,
    handleDelete,
  } = useHabitsContext();
  const { isGuest } = useAuth();

  return (
    <PageShell>
      <SectionHeader
        kicker="Routine"
        title="Habits"
        subtitle="Build consistent routines. Small daily actions compound into real change."
      />

      {isGuest && (
        <div className="guest-prompt">
          <p>Sign in to track habits and build streaks that persist across sessions.</p>
          <div className="guest-prompt-actions">
            <Link to="/register" className="guest-prompt-btn guest-prompt-btn--primary">Sign up free</Link>
            <Link to="/login" className="guest-prompt-btn">Log in</Link>
          </div>
        </div>
      )}

      <motion.div
        className="feature-page habits-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        {/* ── Toolbar ── */}
        <div className="tasks-page-toolbar">
          <div className="tasks-page-controls">
            <div className="tasks-filter-group">
              {["active", "all"].map((f) => (
                <motion.button
                  key={f}
                  type="button"
                  className={`tasks-filter-btn${filter === f ? " active" : ""}`}
                  onClick={() => setFilter(f)}
                  {...hoverAnim}
                  {...tapAnim}
                >
                  {f === "active" ? "Active" : "All"}
                </motion.button>
              ))}
            </div>
            <div className="tasks-page-stats">
              <span>{habits.length} habit{habits.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* ── Add form ── */}
          <form className="habit-form" onSubmit={handleAddHabit}>
            <input
              className="task-input"
              type="text"
              placeholder="New habit…"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="task-input"
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="habit-freq-group">
              {["daily", "weekly"].map((f) => (
                <motion.button
                  key={f}
                  type="button"
                  className={`tasks-filter-btn${frequency === f ? " active" : ""}`}
                  onClick={() => setFrequency(f)}
                  {...tapAnim}
                >
                  {FREQ_LABELS[f]}
                </motion.button>
              ))}
            </div>
            <motion.button
              className="task-add-btn"
              type="submit"
              {...hoverAnim}
              {...tapAnim}
            >
              Add habit
            </motion.button>
          </form>
        </div>

        {/* ── List ── */}
        <div className="tasks-page-list-wrap">
          {loading ? (
            <p className="tasks-page-empty">Loading…</p>
          ) : habits.length === 0 ? (
            <p className="tasks-page-empty">No habits yet. Add one above.</p>
          ) : (
            <ul className="task-list">
              <AnimatePresence>
                {habits.map((habit) => {
                  const done = completedToday(habit);
                  return (
                    <motion.li
                      key={habit._id}
                      className="habit-item"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="habit-left">
                        <div className="habit-info">
                          <span
                            className="habit-name"
                            style={{ opacity: done ? 0.5 : 1 }}
                          >
                            {habit.name}
                          </span>
                          {habit.description && (
                            <span className="habit-desc">{habit.description}</span>
                          )}
                          <div className="habit-meta">
                            <span
                              className="habit-freq-badge"
                              style={{ color: FREQ_COLORS[habit.frequency] }}
                            >
                              {FREQ_LABELS[habit.frequency]}
                            </span>
                            <StreakBadge habit={habit} />
                          </div>
                        </div>
                      </div>

                      <div className="habit-actions">
                        <motion.button
                          type="button"
                          className={`habit-complete-btn${done ? " done" : ""}`}
                          onClick={() => handleComplete(habit._id)}
                          disabled={done}
                          title={done ? "Done today" : "Mark complete"}
                          {...tapAnim}
                        >
                          {done ? "✓" : "○"}
                        </motion.button>
                        <motion.button
                          type="button"
                          className="task-delete-btn"
                          onClick={() => handleArchive(habit._id)}
                          title="Archive"
                          {...hoverAnim}
                          {...tapAnim}
                        >
                          Archive
                        </motion.button>
                        <motion.button
                          type="button"
                          className="task-delete-btn"
                          onClick={() => handleDelete(habit._id)}
                          title="Delete"
                          {...hoverAnim}
                          {...tapAnim}
                        >
                          ×
                        </motion.button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>
    </PageShell>
  );
}
