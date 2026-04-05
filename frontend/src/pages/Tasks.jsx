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
    <section className="feature-page">
      <div className="feature-page-header">
        <span className="card-kicker">Workspace</span>
        <h1>Tasks</h1>
        <p>Manage your tasks with more focus, structure, and control.</p>
      </div>

      <div className="tasks-page-shell">
        <div className="tasks-page-toolbar">
          <form className="task-form" onSubmit={handleAddTask}>
            <input
              className="task-input"
              type="text"
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button className="task-add-btn" type="submit">
              Add
            </button>
          </form>

          <div className="tasks-page-controls">
            <div className="tasks-filter-group">
              <button
                type="button"
                className={filter === "all" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={filter === "active" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={filter === "completed" ? "tasks-filter-btn active" : "tasks-filter-btn"}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
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
                <li className="task-item" key={task.id}>
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

                  <button
                    className="task-delete-btn"
                    type="button"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}

          {completedCount > 0 && (
            <button
              className="task-clear-btn"
              type="button"
              onClick={handleClearCompleted}
            >
              Clear Completed
            </button>
          )}
        </div>
      </div>
    </section>
  );
}