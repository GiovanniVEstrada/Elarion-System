import { useEffect, useMemo, useState } from "react";

export default function useTasks() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("elarion-tasks");

    return savedTasks
      ? JSON.parse(savedTasks)
      : [
          { id: 1, text: "Finish dashboard polish", completed: false },
          { id: 2, text: "Build task input system", completed: false },
          { id: 3, text: "Connect local storage", completed: false },
        ];
  });

  const [newTask, setNewTask] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem("elarion-tasks", JSON.stringify(tasks));
  }, [tasks]);

  function handleAddTask(e) {
    e.preventDefault();

    const trimmedTask = newTask.trim();
    if (!trimmedTask) return;

    const task = {
      id: Date.now(),
      text: trimmedTask,
      completed: false,
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask("");
  }

  function handleToggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function handleDeleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function handleEditTask(id, newText) {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, text: trimmed } : task))
    );
  }

  function handleClearCompleted() {
    setTasks((prev) => prev.filter((task) => !task.completed));
  }

  const filteredTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((task) => !task.completed);
    if (filter === "completed") return tasks.filter((task) => task.completed);
    return tasks;
  }, [tasks, filter]);

  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => task.completed).length;

  return {
    tasks,
    newTask,
    setNewTask,
    filter,
    setFilter,
    filteredTasks,
    activeCount,
    completedCount,
    handleAddTask,
    handleToggleTask,
    handleEditTask,
    handleDeleteTask,
    handleClearCompleted,
  };
}