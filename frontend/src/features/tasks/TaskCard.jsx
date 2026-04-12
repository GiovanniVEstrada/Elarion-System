import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useTasksContext } from "../../context/TasksContext";
import TaskItem from "../../components/items/TaskItem";
import { tapAnim } from "../../utils/motion";

const ENERGY_LEVELS = [
  { value: "low", label: "Low", color: "#64dc82" },
  { value: "medium", label: "Med", color: "#ffc83c" },
  { value: "high", label: "High", color: "#ff5a5a" },
];

export default function TaskCard() {
  const {
    tasks,
    newTask,
    setNewTask,
    newTaskEnergy,
    setNewTaskEnergy,
    activeCount,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
    handleDeleteTask,
    handleRateTask,
    handleClearCompleted,
  } = useTasksContext();

  return (
    <motion.section
      className="dashboard-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <div className="dashboard-card-header">
        <div>
          <span className="card-kicker">Overview</span>
          <h2>Tasks</h2>
        </div>
        <Link to="/tasks" className="card-link">View All →</Link>
      </div>

      <p className="card-meta">{tasks.length} total · {activeCount} active</p>

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
      </form>

      <ul className="task-list">
        <AnimatePresence>
          {tasks.slice(0, 5).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onRate={handleRateTask}
            />
          ))}
        </AnimatePresence>
      </ul>

      {tasks.length > 5 && (
        <p className="task-more">+{tasks.length - 5} more tasks</p>
      )}

      <AnimatePresence>
        {tasks.some((t) => t.completed) && (
          <motion.button
            className="task-clear-btn"
            type="button"
            onClick={handleClearCompleted}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            whileHover={{ y: -1 }}
            {...tapAnim}
          >
            Clear Completed
          </motion.button>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
