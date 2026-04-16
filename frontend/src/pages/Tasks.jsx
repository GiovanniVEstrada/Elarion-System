import { motion, AnimatePresence } from "motion/react";
import { useTasksContext } from "../context/TasksContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import TaskItem from "../components/items/TaskItem";
import { tapAnim, hoverAnim } from "../utils/motion";

export default function Tasks() {
  const {
    newTask,
    setNewTask,
    newTaskEnergy,
    setNewTaskEnergy,
    newTaskIntent,
    setNewTaskIntent,
    filter,
    setFilter,
    filteredTasks,
    activeCount,
    completedCount,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
    handleRateTask,
    handleDeleteTask,
    handleClearCompleted,
  } = useTasksContext();

  const ENERGY_LEVELS = [
    { value: "low", label: "Low", color: "#64dc82" },
    { value: "medium", label: "Med", color: "#ffc83c" },
    { value: "high", label: "High", color: "#ff5a5a" },
  ];

  return (
    <PageShell>
      <SectionHeader
        kicker="Workspace"
        title="Tasks"
        subtitle="Manage your tasks with more focus, structure, and control."
      />

      <motion.div
        className="tasks-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="tasks-page-toolbar">
          <form className="task-form task-form--stacked" onSubmit={handleAddTask}>
            <div className="task-form-row">
              <input
                className="task-input"
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <motion.button
                className="task-add-btn"
                type="submit"
                whileHover={{ y: -1, scale: 1.01 }}
                {...tapAnim}
              >
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

            <div className="tasks-page-stats">
              <span>{activeCount} active</span>
              <span>{completedCount} completed</span>
            </div>
          </div>
        </div>

        <div className="tasks-page-list-wrap">
          {filteredTasks.length === 0 ? (
            <p className="tasks-page-empty">No tasks in this view.</p>
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
    </PageShell>
  );
}
