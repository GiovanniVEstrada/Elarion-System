import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useHabitsContext } from "../context/HabitsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

const FREQ_LABELS = { daily: "Daily", weekly: "Weekly" };
const FREQ_COLORS = { daily: "var(--accent)", weekly: "var(--accent-3)" };

function StreakBadge({ streak }) {
  if (!streak) return null;
  return <span className="habit-streak">🔥 {streak}</span>;
}

function HabitItem({ habit, onComplete, onEdit, onArchive, onDelete }) {
  const [editing,  setEditing]  = useState(false);
  const [editName, setEditName] = useState(habit.name);
  const [editDesc, setEditDesc] = useState(habit.description || "");
  const [editFreq, setEditFreq] = useState(habit.frequency || "daily");

  function openEdit() {
    setEditName(habit.name);
    setEditDesc(habit.description || "");
    setEditFreq(habit.frequency || "daily");
    setEditing(true);
  }

  async function saveEdit() {
    if (!editName.trim()) return;
    await onEdit(habit._id, { name: editName, description: editDesc, frequency: editFreq });
    setEditing(false);
  }

  return (
    <motion.li
      className={`habit-item glass-card habit-card${habit._done ? " habit-card--done" : ""}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            className="habit-edit-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <input
              name="habit-edit-name"
              className="task-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Habit name…"
              autoFocus
              autoComplete="off"
            />
            <input
              name="habit-edit-desc"
              className="task-input"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              autoComplete="off"
            />
            <div className="habit-freq-group">
              {["daily", "weekly"].map((f) => (
                <motion.button
                  key={f}
                  type="button"
                  className={`tasks-filter-btn${editFreq === f ? " active" : ""}`}
                  onClick={() => setEditFreq(f)}
                  {...tapAnim}
                >
                  {FREQ_LABELS[f]}
                </motion.button>
              ))}
            </div>
            <div className="habit-edit-actions">
              <motion.button className="task-add-btn" type="button" onClick={saveEdit} {...tapAnim}>
                Save
              </motion.button>
              <motion.button className="calendar-cancel-btn" type="button" onClick={() => setEditing(false)} {...tapAnim}>
                Cancel
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            className="habit-item-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.button
              type="button"
              className={`habit-complete-btn${habit._done ? " done" : ""}`}
              onClick={() => onComplete(habit._id)}
              disabled={habit._done}
              aria-label={habit._done ? "Completed today" : "Mark complete"}
              {...tapAnim}
            >
              {habit._done ? "✓" : "○"}
            </motion.button>

            <div className="habit-info">
              <span className={`habit-name${habit._done ? " habit-name--done" : ""}`}>
                {habit.name}
              </span>
              {habit.description && (
                <span className="habit-desc">{habit.description}</span>
              )}
              <div className="habit-meta">
                <span className="habit-freq-badge" style={{ color: FREQ_COLORS[habit.frequency] }}>
                  {FREQ_LABELS[habit.frequency]}
                </span>
                <StreakBadge streak={habit.currentStreak} />
              </div>
            </div>

            <div className="habit-side-actions">
              <motion.button
                type="button"
                className="habit-icon-btn"
                onClick={openEdit}
                title="Edit"
                {...hoverAnim}
                {...tapAnim}
              >
                ✎
              </motion.button>
              <motion.button
                type="button"
                className="habit-icon-btn"
                onClick={() => onArchive(habit._id)}
                title="Archive"
                {...tapAnim}
              >
                ↓
              </motion.button>
              <motion.button
                type="button"
                className="habit-icon-btn habit-icon-btn--danger"
                onClick={() => onDelete(habit._id)}
                title="Delete"
                {...tapAnim}
              >
                ×
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

export default function Habits() {
  const [fabOpen, setFabOpen] = useState(false);

  const {
    habits,
    filteredHabits,
    loading,
    error,
    filter,
    setFilter,
    freqFilter,
    setFreqFilter,
    name,
    setName,
    description,
    setDescription,
    frequency,
    setFrequency,
    completedToday,
    handleAddHabit,
    handleEditHabit,
    handleComplete,
    handleArchive,
    handleDelete,
    refetch,
  } = useHabitsContext();

  const { isGuest } = useAuth();

  const displayedHabits = filteredHabits.map((h) => ({ ...h, _done: completedToday(h) }));

  function handleHabitSubmit(e) {
    handleAddHabit(e);
    setFabOpen(false);
  }

  return (
    <PageShell>
      <motion.header
        className="tasks-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="tasks-hero-kicker tide-hero-kicker">Habits</p>
        <h1 className="tasks-hero-title tide-hero-title">Daily currents</h1>
      </motion.header>

      {isGuest && (
        <div className="guest-prompt">
          <p>Sign in to track habits and build streaks that persist across sessions.</p>
          <div className="guest-prompt-actions">
            <Link to="/register" className="guest-prompt-btn guest-prompt-btn--primary">Sign up free</Link>
            <Link to="/login" className="guest-prompt-btn">Log in</Link>
          </div>
        </div>
      )}

      {/* Filter bars */}
      <div className="task-filter-bar" style={{ flexWrap: "wrap", gap: "8px" }}>
        <div className="tasks-filter-group">
          {[{ value: "active", label: "Active" }, { value: "all", label: "All" }].map(({ value, label }) => (
            <motion.button
              key={value}
              type="button"
              className={`tasks-filter-btn${filter === value ? " active" : ""}`}
              onClick={() => setFilter(value)}
              {...hoverAnim}
              {...tapAnim}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <div className="tasks-filter-group">
          {[
            { value: "all",    label: "All freq" },
            { value: "daily",  label: "Daily"    },
            { value: "weekly", label: "Weekly"   },
          ].map(({ value, label }) => (
            <motion.button
              key={value}
              type="button"
              className={`tasks-filter-btn${freqFilter === value ? " active" : ""}`}
              onClick={() => setFreqFilter(value)}
              {...hoverAnim}
              {...tapAnim}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <span className="task-filter-stat">
          {habits.length} habit{habits.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Habit list */}
      {loading ? (
        <SkeletonList count={3} />
      ) : error ? (
        <div className="page-error">
          <p>{error}</p>
          <button onClick={refetch}>Retry</button>
        </div>
      ) : displayedHabits.length === 0 ? (
        <div className="tasks-empty">
          <p className="tasks-empty-headline">No currents yet.</p>
          <p className="tasks-empty-sub">Add a habit with the + button below.</p>
        </div>
      ) : (
        <ul className="task-list">
          <AnimatePresence>
            {displayedHabits.map((habit) => (
              <HabitItem
                key={habit._id}
                habit={habit}
                onComplete={handleComplete}
                onEdit={handleEditHabit}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {/* FAB */}
      <motion.button
        className={`task-fab${fabOpen ? " task-fab--open" : ""}`}
        type="button"
        aria-label={fabOpen ? "Close" : "Add habit"}
        onClick={() => setFabOpen((o) => !o)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <motion.span
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "block", lineHeight: 1 }}
        >
          +
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {fabOpen && (
          <>
            <motion.div
              className="fab-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setFabOpen(false)}
            />
            <motion.div
              className="fab-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <form className="habit-form" onSubmit={handleHabitSubmit}>
                <p className="fab-panel-label">New habit</p>
                <input
                  name="habit-name"
                  className="task-input"
                  type="text"
                  placeholder="Habit name…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  autoComplete="off"
                />
                <input
                  name="habit-desc"
                  className="task-input"
                  type="text"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  autoComplete="off"
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
                  style={{ width: "100%" }}
                  {...hoverAnim}
                  {...tapAnim}
                >
                  Add habit
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
