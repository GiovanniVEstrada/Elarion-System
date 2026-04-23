import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTasksContext } from "../context/TasksContext";
import { useHabitsContext } from "../context/HabitsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
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

function StreakBadge({ habit }) {
  const streak = habit.currentStreak ?? habit.streak ?? 0;
  if (!streak) return null;
  return <span className="habit-streak">🔥 {streak}</span>;
}

export default function Tasks() {
  const [tab, setTab] = useState("tasks");

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

  return (
    <PageShell>
      <SectionHeader
        kicker="Workspace"
        title={tab === "tasks" ? "Actions" : "Habits"}
        subtitle={
          tab === "tasks"
            ? "Manage your actions with more focus, structure, and intention."
            : "Build consistent routines. Small daily actions compound into real change."
        }
      />

      {/* ── Tab switcher ── */}
      <div className="page-tab-bar">
        {["tasks", "habits"].map((t) => (
          <motion.button
            key={t}
            type="button"
            className={`page-tab-btn${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
            {...tapAnim}
          >
            {t === "tasks" ? "Actions" : "Habits"}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "tasks" ? (
          <motion.div
            key="tasks"
            className="tasks-page-shell"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            <div className="tasks-page-toolbar">
              <form className="task-form task-form--stacked" onSubmit={handleAddTask}>
                <div className="task-form-row">
                  <input
                    className="task-input"
                    type="text"
                    placeholder="Add a new action..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                  />
                  <motion.button className="task-add-btn" type="submit" whileHover={{ y: -1, scale: 1.01 }} {...tapAnim}>
                    Add
                  </motion.button>
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
              </form>

              <div className="tasks-page-controls">
                <div className="tasks-filter-group">
                  {["all", "active", "completed"].map((f) => (
                    <motion.button
                      key={f}
                      type="button"
                      className={filter === f ? "tasks-filter-btn active" : "tasks-filter-btn"}
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
                  placeholder="Search actions…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="tasks-page-stats">
                  <span>{activeCount} active</span>
                  <span>{completedCount} completed</span>
                </div>
              </div>
            </div>

            <div className="tasks-page-list-wrap">
              {tasksLoading ? (
                <SkeletonList count={4} />
              ) : tasksError ? (
                <div className="page-error">
                  <p>{tasksError}</p>
                  <button onClick={refetchTasks}>Retry</button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <p className="tasks-page-empty">No actions in this view.</p>
              ) : (
                <ul className="task-list">
                  <AnimatePresence>
                    {filteredTasks.map((task) => (
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
            </div>
          </motion.div>
        ) : (
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

            <div className="tasks-page-toolbar">
              <div className="tasks-page-controls">
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
                <div className="tasks-page-stats">
                  <span>{habits.length} habit{habits.length !== 1 ? "s" : ""}</span>
                </div>
              </div>

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
                <motion.button className="task-add-btn" type="submit" {...hoverAnim} {...tapAnim}>
                  Add habit
                </motion.button>
              </form>
            </div>

            <div className="tasks-page-list-wrap">
              {habitsLoading ? (
                <SkeletonList count={3} />
              ) : habitsError ? (
                <div className="page-error">
                  <p>{habitsError}</p>
                  <button onClick={refetchHabits}>Retry</button>
                </div>
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
                              <span className="habit-name" style={{ opacity: done ? 0.5 : 1 }}>
                                {habit.name}
                              </span>
                              {habit.description && <span className="habit-desc">{habit.description}</span>}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
