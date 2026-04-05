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

  return (
    <section className="dashboard-card">
      <span className="card-kicker">Overview</span>
      <h2>Tasks</h2>

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

      <ul className="task-list">
        {tasks.slice(0, 5).map((task) => (
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

      {tasks.length > 5 && (
        <p className="task-more">+{tasks.length - 5} more tasks</p>
      )}

      {tasks.some((task) => task.completed) && (
        <button
          className="task-clear-btn"
          type="button"
          onClick={handleClearCompleted}
        >
          Clear Completed
        </button>
      )}
    </section>
  );
}