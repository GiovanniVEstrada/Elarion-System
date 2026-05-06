import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTasksContext } from "../context/TasksContext";
import { useHabitsContext } from "../context/HabitsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import TaskItem from "../components/items/TaskItem";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

const ENERGY_LEVELS = [
  { value: "low",    label: "Low",  color: "#64dc82" },
  { value: "medium", label: "Med",  color: "#ffc83c" },
  { value: "high",   label: "High", color: "#ff5a5a" },
];

const FREQ_LABELS = { daily: "Daily", weekly: "Weekly" };
const FREQ_COLORS = { daily: "var(--accent)", weekly: "var(--accent-3)" };

const TIERS = [
  { key: "deep",     label: "Deep",      energyLevel: "high"   },
  { key: "mid",      label: "Mid-water", energyLevel: "medium" },
  { key: "surface",  label: "Surface",   energyLevel: null     },
];

function StreakBadge({ habit }) {
  const streak = habit.currentStreak ?? habit.streak ?? 0;
  if (!streak) return null;
  return <span className="habit-streak">🔥 {streak}</span>;
}

export default function Tasks() {
  const [tab, setTab]         = useState("tasks");
  const [fabOpen, setFabOpen] = useState(false);

  const {
    newTask, setNewTask,
    newTaskEnergy, setNewTaskEnergy,
    newTaskIntent, setNewTaskIntent,
    filter, setFilter,
    searchQuery, setSearchQuery,
    filteredTasks, activeCount, completedCount,
    loading: tasksLoading, error: tasksError,
    handleAddTask, handleToggleTask, handleEditTask,
    handleRateTask, handleDeleteTask, handleClearCompleted,
    refetch: refetchTasks,
  } = useTasksContext();

  const {
    habits, loading: habitsLoading, error: habitsError,
    filter: habitFilter, setFilter: setHabitFilter,
    name, setName,
    description, setDescription,
    frequency, setFrequency,
    completedToday,
    handleAddHabit, handleComplete, handleArchive, handleDelete: handleDeleteHabit,
    refetch: refetchHabits,
  } = useHabitsContext();

  const { isGuest } = useAuth();

  const tiers = useMemo(() => ({
    deep:    filteredTasks.filter((t) => !t.completed && t.energyLevel === "high"),
    mid:     filteredTasks.filter((t) => !t.completed && t.energyLevel === "medium"),
    surface: filteredTasks.filter((t) => !t.completed && (!t.energyLevel || t.energyLevel === "low")),
  }), [filteredTasks]);

  const doneTasks = useMemo(
    () => filteredTasks.filter((t) => t.completed),
    [filteredTasks]
  );

  const hasAnyTask = tiers.deep.length + tiers.mid.length + tiers.surface.length > 0 || doneTasks.length > 0;

  function handleTaskSubmit(e) {
    handleAddTask(e);
    setFabOpen(false);
  }

  function handleHabitSubmit(e) {
    handleAddHabit(e);
    setFabOpen(false);
  }

  const heroTitle  = tab === "tasks" ? "What rises today" : "Daily currents";
  const heroKicker = tab === "tasks" ? "Actions"          : "Habits";

  return (
    <PageShell>
      {/* ── Hero ── */}
      <motion.header
        className="tasks-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <p className="tasks-hero-kicker">{heroKicker}</p>
            <h1 className="tasks-hero-title">{heroTitle}</h1>
          </motion.div>
        </AnimatePresence>
      </motion.header>

      {/* ── Tab bar ── */}
      <div className="page-tab-bar">
        {["tasks", "habits"].map((t) => (
          <motion.button
            key={t}
            type="button"
            className={`page-tab-btn${tab === t ? " active" : ""}`}
            onClick={() => { setTab(t); setFabOpen(false); }}
            {...tapAnim}
          >
            {t === "tasks" ? "Actions" : "Habits"}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ TASKS TAB ══ */}
        {tab === "tasks" ? (
          <motion.div
            key="tasks"
            className="tasks-page-shell"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {/* Compact filter row */}
            <div className="task-filter-bar">
              <div className="tasks-filter-group">
                {["all", "active", "completed"].map((f) => (
                  <motion.button
                    key={f}
                    type="button"
                    className={`tasks-filter-btn${filter === f ? " active" : ""}`}
                    onClick={() => setFilter(f)}
                    {...hoverAnim}
                    {...tapAnim}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </motion.button>
                ))}
              </div>
              <input
                className="task-search-input"
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Task tiers */}
            {tasksLoading ? (
              <SkeletonList count={4} />
            ) : tasksError ? (
              <div className="page-error">
                <p>{tasksError}</p>
                <button onClick={refetchTasks}>Retry</button>
              </div>
            ) : !hasAnyTask ? (
              <div className="tasks-empty">
                <p className="tasks-empty-headline">Still water.</p>
                <p className="tasks-empty-sub">Add an action with the + button below.</p>
              </div>
            ) : (
              <div className="task-tiers">
                {TIERS.map(({ key, label }) => {
                  const items = tiers[key];
                  if (!items.length) return null;
                  return (
                    <div key={key} className="task-tier-group">
                      <p className={`task-tier-label task-tier-label--${key}`}>{label}</p>
                      <ul className="task-list">
                        <AnimatePresence>
                          {items.map((task) => (
                            <TaskItem
                              key={task._id}
                              task={task}
                              onToggle={handleToggleTask}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onRate={handleRateTask}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </div>
                  );
                })}

                {doneTasks.length > 0 && (
                  <div className="task-tier-group task-tier-group--done">
                    <p className="task-tier-label task-tier-label--done">Done</p>
                    <ul className="task-list">
                      <AnimatePresence>
                        {doneTasks.map((task) => (
                          <TaskItem
                            key={task._id}
                            task={task}
                            onToggle={handleToggleTask}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            onRate={handleRateTask}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <AnimatePresence>
              {completedCount > 0 && (
                <motion.button
                  className="task-clear-btn"
                  type="button"
                  onClick={handleClearCompleted}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  {...hoverAnim}
                  {...tapAnim}
                >
                  Clear Completed
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

        ) : (

          /* ══ HABITS TAB ══ */
          <motion.div
            key="habits"
            className="tasks-page-shell"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {isGuest && (
              <div className="guest-prompt">
                <p>Sign in to track habits and build streaks that persist across sessions.</p>
                <div className="guest-prompt-actions">
                  <Link to="/register" className="guest-prompt-btn guest-prompt-btn--primary">Sign up free</Link>
                  <Link to="/login" className="guest-prompt-btn">Log in</Link>
                </div>
              </div>
            )}

            {/* Compact filter row */}
            <div className="task-filter-bar">
              <div className="tasks-filter-group">
                {["active", "all"].map((f) => (
                  <motion.button
                    key={f}
                    type="button"
                    className={`tasks-filter-btn${habitFilter === f ? " active" : ""}`}
                    onClick={() => setHabitFilter(f)}
                    {...hoverAnim}
                    {...tapAnim}
                  >
                    {f === "active" ? "Active" : "All"}
                  </motion.button>
                ))}
              </div>
              <span className="task-filter-stat">
                {habits.length} habit{habits.length !== 1 ? "s" : ""}
              </span>
            </div>

            {habitsLoading ? (
              <SkeletonList count={3} />
            ) : habitsError ? (
              <div className="page-error">
                <p>{habitsError}</p>
                <button onClick={refetchHabits}>Retry</button>
              </div>
            ) : habits.length === 0 ? (
              <div className="tasks-empty">
                <p className="tasks-empty-headline">No currents yet.</p>
                <p className="tasks-empty-sub">Add a habit with the + button below.</p>
              </div>
            ) : (
              <ul className="task-list">
                <AnimatePresence>
                  {habits.map((habit) => {
                    const done = completedToday(habit);
                    return (
                      <motion.li
                        key={habit._id}
                        className={`habit-item habit-card${done ? " habit-card--done" : ""}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="habit-left">
                          <div className="habit-info">
                            <span className="habit-name" style={{ opacity: done ? 0.5 : 1 }}>
                              {habit.name}
                            </span>
                            {habit.description && (
                              <span className="habit-desc">{habit.description}</span>
                            )}
                            <div className="habit-meta">
                              <span className="habit-freq-badge" style={{ color: FREQ_COLORS[habit.frequency] }}>
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
                            aria-label={done ? "Completed today" : "Mark complete"}
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
                            onClick={() => handleDeleteHabit(habit._id)}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        className={`task-fab${fabOpen ? " task-fab--open" : ""}`}
        type="button"
        aria-label={fabOpen ? "Close" : tab === "tasks" ? "Add action" : "Add habit"}
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

      {/* ── FAB Panel ── */}
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
              {tab === "tasks" ? (
                <form className="task-form task-form--stacked" onSubmit={handleTaskSubmit}>
                  <p className="fab-panel-label">New action</p>
                  <div className="task-form-row">
                    <input
                      className="task-input"
                      type="text"
                      placeholder="What needs to be done?"
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="task-form-meta">
                    <div className="energy-picker">
                      {ENERGY_LEVELS.map(({ value, label, color }) => (
                        <button
                          key={value}
                          type="button"
                          className={`energy-btn energy-btn--${value}${newTaskEnergy === value ? " active" : ""}`}
                          onClick={() => setNewTaskEnergy(newTaskEnergy === value ? null : value)}
                          style={newTaskEnergy === value ? { borderColor: color, color } : {}}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      className="task-intent-input"
                      type="text"
                      placeholder="Why are you doing this? (optional)"
                      value={newTaskIntent}
                      onChange={(e) => setNewTaskIntent(e.target.value)}
                    />
                  </div>
                  <motion.button
                    className="task-add-btn"
                    type="submit"
                    style={{ width: "100%" }}
                    whileHover={{ y: -1 }}
                    {...tapAnim}
                  >
                    Add action
                  </motion.button>
                </form>
              ) : (
                <form className="habit-form" onSubmit={handleHabitSubmit}>
                  <p className="fab-panel-label">New habit</p>
                  <input
                    className="task-input"
                    type="text"
                    placeholder="Habit name…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
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
                    style={{ width: "100%" }}
                    {...hoverAnim}
                    {...tapAnim}
                  >
                    Add habit
                  </motion.button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
