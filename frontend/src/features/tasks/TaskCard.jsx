import { Link } from "react-router-dom";
import { motion } from "motion/react";
import useTasks from "../../hooks/useTasks";

export default function TaskCard() {
  const {
    tasks,
    newTask,
    setNewTask,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleClearCompleted,
  } = useTasks();

  const activeCount = tasks.filter((t) => !t.completed).length;

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

        <Link to="/tasks" className="card-link">
          View All →
        </Link>
      </div>

      <p className="card-meta">
        {tasks.length} total • {activeCount} active
      </p>

      <form className="task-form" onSubmit={handleAddTask}>
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
          whileTap={{ scale: 0.98 }}
        >
          Add
        </motion.button>
      </form>

      <ul className="task-list">
        {tasks.slice(0, 5).map((task) => (
          <motion.li
            className="task-item"
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <label className="task-left">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => handleToggleTask(task.id)}
              />
              <span className={task.completed ? "task-text completed" : "task-text"}>
                {task.text}
              </span>
            </label>

            <motion.button
              className="task-delete-btn"
              type="button"
              onClick={() => handleDeleteTask(task.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Delete
            </motion.button>
          </motion.li>
        ))}
      </ul>

      {tasks.length > 5 && (
        <p className="task-more">+{tasks.length - 5} more tasks</p>
      )}

      {tasks.some((task) => task.completed) && (
        <motion.button
          className="task-clear-btn"
          type="button"
          onClick={handleClearCompleted}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Clear Completed
        </motion.button>
      )}
    </motion.section>
  );
}