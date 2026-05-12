import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTasksContext } from "../context/TasksContext";
import PageShell from "../components/layout/PageShell";
import TaskItem from "../components/items/TaskItem";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

const ENERGY_LEVELS = [
  { value: "low",    label: "Low",  color: "#64dc82" },
  { value: "medium", label: "Med",  color: "#ffc83c" },
  { value: "high",   label: "High", color: "#ff5a5a" },
];

const TIERS = [
  { key: "deep",    label: "Deep",      energyLevel: "high"   },
  { key: "mid",     label: "Mid-water", energyLevel: "medium" },
  { key: "surface", label: "Surface",   energyLevel: null     },
];

export default function Tasks() {
  const [fabOpen, setFabOpen] = useState(false);

  const {
    newTask, setNewTask,
    newTaskEnergy, setNewTaskEnergy,
    newTaskIntent, setNewTaskIntent,
    filter, setFilter,
    searchQuery, setSearchQuery,
    filteredTasks, completedCount,
    loading, error,
    handleAddTask, handleToggleTask, handleEditTask,
    handleRateTask, handleDeleteTask, handleClearCompleted,
    refetch,
  } = useTasksContext();

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

  return (
    <PageShell>
      <motion.header
        className="tasks-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="tasks-hero-kicker tide-hero-kicker">Actions</p>
        <h1 className="tasks-hero-title tide-hero-title">What rises today</h1>
      </motion.header>

      {/* Filter row */}
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
      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="page-error">
          <p>{error}</p>
          <button onClick={refetch}>Retry</button>
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

      {/* FAB */}
      <motion.button
        className={`task-fab${fabOpen ? " task-fab--open" : ""}`}
        type="button"
        aria-label={fabOpen ? "Close" : "Add action"}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
