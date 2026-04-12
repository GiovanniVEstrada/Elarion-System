import { useEffect, useMemo, useState } from "react";

export default function useTasks() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("elarion-tasks");
    return savedTasks
      ? JSON.parse(savedTasks)
      : [
          { id: 1, text: "Finish dashboard polish", completed: false, energyLevel: null, intent: "", alignmentScore: null },
          { id: 2, text: "Build task input system", completed: false, energyLevel: null, intent: "", alignmentScore: null },
          { id: 3, text: "Connect local storage", completed: false, energyLevel: null, intent: "", alignmentScore: null },
        ];
  });

  const [newTask, setNewTask] = useState("");
  const [newTaskEnergy, setNewTaskEnergy] = useState(null);
  const [newTaskIntent, setNewTaskIntent] = useState("");
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
      energyLevel: newTaskEnergy,
      intent: newTaskIntent.trim(),
      alignmentScore: null,
    };

    setTasks((prev) => [task, ...prev]);
    setNewTask("");
    setNewTaskEnergy(null);
    setNewTaskIntent("");
  }

  function handleToggleTask(id) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function handleRateTask(id, score) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, alignmentScore: score } : task
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
    handleRateTask,
    handleEditTask,
    handleDeleteTask,
    handleClearCompleted,
  };
}
