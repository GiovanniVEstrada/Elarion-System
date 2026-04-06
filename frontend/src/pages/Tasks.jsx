import { motion } from "motion/react";
import useTasks from "../hooks/useTasks";

export default function Tasks() {
  const {
    newTask,
    setNewTask,
    filter,
    setFilter,
    filteredTasks,
    activeCount,
    completedCount,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleClearCompleted,
  } = useTasks();

  return (
    <motion.section
      className="feature-page"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="feature-page-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
      >
        <span className="card-kicker">Workspace</span>
        <h1>Tasks</h1>
        <p>Manage your tasks with more focus, structure, and control.</p>
      </motion.div>

      <motion.div
        className="tasks-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="tasks-page-toolbar">
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

          <div className="tasks-page-controls">
            <div className="tasks-filter-group">
              <motion.button
                type="button"
                className={filter === "all" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("all")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                All
              </motion.button>
              <motion.button
                type="button"
                className={filter === "active" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("active")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Active
              </motion.button>
              <motion.button
                type="button"
                className={filter === "completed" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("completed")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Completed
              </motion.button>
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
              {filteredTasks.map((task) => (
                <motion.li
                  className="task-item"
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
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
          )}

          {completedCount > 0 && (
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
        </div>
      </motion.div>
    </motion.section>
  );
}