import { useCallback, useEffect, useMemo, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const GUEST_KEY = "guest_tasks";
const guestLoad = () => { try { return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]"); } catch { return []; } };
const guestSave = (t) => localStorage.setItem(GUEST_KEY, JSON.stringify(t));

export default function useTasks() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [filters, setFilters] = useState({ completed: undefined, priority: undefined, sort: undefined });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newTask, setNewTask] = useState("");
  const [newTaskEnergy, setNewTaskEnergy] = useState(null);
  const [newTaskIntent, setNewTaskIntent] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(null);
  const [filter, setFilter] = useState("all");

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async (overrides = {}) => {
    if (!isAuthenticated) {
      setTasks(guestLoad());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...overrides, limit: 50 };
      if (filter === "active")    params.completed = false;
      if (filter === "completed") params.completed = true;
      const res = await client.get("/tasks", { params });
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setError(err.response?.data?.message || "Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters, filter, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchTasks();
  }, [fetchTasks, authLoading]);

  // ── Actions ──────────────────────────────────────────────────────

  async function handleAddTask(e) {
    e.preventDefault();
    const trimmed = newTask.trim();
    if (!trimmed) return;

    if (!isAuthenticated) {
      const t = {
        _id: `guest_${Date.now()}`,
        title: trimmed,
        completed: false,
        energyLevel: newTaskEnergy,
        intent: newTaskIntent.trim() || null,
        priority: newTaskPriority || null,
        createdAt: new Date().toISOString(),
      };
      const updated = [t, ...tasks];
      setTasks(updated);
      guestSave(updated);
      setNewTask(""); setNewTaskEnergy(null); setNewTaskIntent(""); setNewTaskPriority(null);
      return;
    }

    try {
      const res = await client.post("/tasks", {
        title: trimmed,
        energyLevel: newTaskEnergy,
        intent: newTaskIntent.trim() || undefined,
        priority: newTaskPriority || undefined,
      });
      setTasks((prev) => [res.data.data ?? res.data, ...prev]);
      setNewTask(""); setNewTaskEnergy(null); setNewTaskIntent(""); setNewTaskPriority(null);
    } catch (err) {
      console.error("Failed to add task", err);
    }
  }

  async function handleToggleTask(id) {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    const updated = tasks.map((t) => t._id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.patch(`/tasks/${id}`, { completed: !task.completed });
    } catch (err) {
      setTasks(tasks);
      console.error("Failed to toggle task", err);
    }
  }

  async function handleRateTask(id, score) {
    const updated = tasks.map((t) => t._id === id ? { ...t, alignmentScore: score } : t);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.patch(`/tasks/${id}`, { alignmentScore: score });
    } catch (err) {
      console.error("Failed to rate task", err);
    }
  }

  async function handleEditTask(id, newTitle) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const updated = tasks.map((t) => t._id === id ? { ...t, title: trimmed } : t);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.patch(`/tasks/${id}`, { title: trimmed });
    } catch (err) {
      console.error("Failed to edit task", err);
    }
  }

  async function handleDeleteTask(id) {
    const updated = tasks.filter((t) => t._id !== id);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.delete(`/tasks/${id}`);
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  }

  async function handleClearCompleted() {
    const completed = tasks.filter((t) => t.completed);
    const updated = tasks.filter((t) => !t.completed);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await Promise.all(completed.map((t) => client.delete(`/tasks/${t._id}`)));
    } catch (err) {
      console.error("Failed to clear completed tasks", err);
      fetchTasks();
    }
  }

  // ── Computed ─────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    if (filter === "active")    return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const activeCount    = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return {
    tasks,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    newTask,
    setNewTask,
    newTaskEnergy,
    setNewTaskEnergy,
    newTaskIntent,
    setNewTaskIntent,
    newTaskPriority,
    setNewTaskPriority,
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
    refetch: fetchTasks,
  };
}
