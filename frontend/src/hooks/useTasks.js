import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToastEmitter } from "../components/Toast";
import { checkGuestExpiry, markGuestDataSeeded } from "../utils/guestExpiry";

const GUEST_KEY = "guest_tasks";
const sanitizeId = (t) => ({ ...t, _id: typeof t._id === "number" ? `guest_${t._id}` : (t._id ?? `guest_${crypto.randomUUID()}`) });
const guestLoad = () => {
  checkGuestExpiry();
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw === null) return null;
  try { return JSON.parse(raw).map(sanitizeId); } catch { return []; }
};
const guestSave = (t) => localStorage.setItem(GUEST_KEY, JSON.stringify(t));

function seedMockTasks() {
  const d = (offset) => new Date(Date.now() - offset * 86400000).toISOString();
  return [
    { _id: "guest_t1", title: "Design system tokens for Luren",         completed: false, energyLevel: "high",   intent: "Define the visual language for the landing page", priority: "high",   createdAt: d(1) },
    { _id: "guest_t2", title: "Set up Next.js project structure",        completed: false, energyLevel: "medium", intent: null, priority: "high",   createdAt: d(1) },
    { _id: "guest_t3", title: "Research competitor landing pages",       completed: true,  energyLevel: "low",    intent: "Get inspired by what's working", priority: "medium", createdAt: d(3) },
    { _id: "guest_t4", title: "Write hero copy",                         completed: true,  energyLevel: "medium", intent: "Capture the value prop in one sentence", priority: "high", createdAt: d(2) },
    { _id: "guest_t5", title: "Schedule call with mentor",               completed: false, energyLevel: "low",    intent: null, priority: "low",    createdAt: d(0) },
  ].map(sanitizeId);
}

export default function useTasks() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToastEmitter();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchTasks = useCallback(async (overrides = {}) => {
    if (!isAuthenticated) {
      let all = guestLoad();
      if (all === null) {
        all = seedMockTasks();
        guestSave(all);
        markGuestDataSeeded();
      }
      const q = debouncedSearch.trim().toLowerCase();
      setTasks(q ? all.filter((t) =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.intent || "").toLowerCase().includes(q)
      ) : all);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = { ...filters, ...overrides, limit: 50 };
      if (filter === "active")    params.completed = false;
      if (filter === "completed") params.completed = true;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const res = await client.get("/tasks", { params });
      setTasks(res.data.data);
      // Backend returns `pages`, frontend normalizes to `totalPages`
      const p = res.data.pagination || {};
      setPagination({ ...p, totalPages: p.totalPages ?? p.pages ?? 1 });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load tasks.";
      setError(msg);
      showToast(msg, "warn");
    } finally {
      setLoading(false);
    }
  }, [filters, filter, isAuthenticated, debouncedSearch, showToast]);

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
        _id: `guest_${crypto.randomUUID()}`,
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
      showToast(err.response?.data?.message || "Failed to add task.", "warn");
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
    } catch {
      setTasks(tasks);
      showToast("Failed to update task.", "warn");
    }
  }

  async function handleRateTask(id, { alignmentScore, postMood } = {}) {
    const patch = {};
    if (alignmentScore != null) patch.alignmentScore = alignmentScore;
    if (postMood != null) patch.postMood = postMood;
    if (!Object.keys(patch).length) return;
    const updated = tasks.map((t) => t._id === id ? { ...t, ...patch } : t);
    setTasks(updated);
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.patch(`/tasks/${id}`, patch);
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
    } catch {
      showToast("Failed to delete task.", "warn");
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
    } catch {
      showToast("Failed to clear completed tasks.", "warn");
      fetchTasks();
    }
  }

  // Programmatic task creation (calendar, etc.) — bypasses form state
  async function addTaskWithDate(title, dueDate) {
    if (!isAuthenticated) return null;
    const trimmed = title?.trim();
    if (!trimmed) return null;
    try {
      const res = await client.post("/tasks", { title: trimmed, dueDate });
      const task = res.data.data ?? res.data;
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add action.", "warn");
      return null;
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
    searchQuery,
    setSearchQuery,
    filteredTasks,
    activeCount,
    completedCount,
    handleAddTask,
    addTaskWithDate,
    handleToggleTask,
    handleRateTask,
    handleEditTask,
    handleDeleteTask,
    handleClearCompleted,
    refetch: fetchTasks,
  };
}
