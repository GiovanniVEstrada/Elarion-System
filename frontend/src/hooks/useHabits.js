import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

function completedToday(habit) {
  const today = new Date().toDateString();
  return (habit.completedDates || []).some(
    (d) => new Date(d).toDateString() === today
  );
}

function normalizeHabit(habit) {
  return {
    ...habit,
    currentStreak: habit.currentStreak ?? habit.cachedStreak ?? 0,
  };
}

export default function useHabits() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("active");
  const [freqFilter, setFreqFilter] = useState("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchHabits = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const params = filter === "active" ? { active: true } : {};
      const res = await client.get("/habits", { params });
      const raw = res.data.data ?? res.data;
      setHabits(Array.isArray(raw) ? raw.map(normalizeHabit) : []);
    } catch (err) {
      console.error("Failed to fetch habits", err);
      setError(err.response?.data?.message || "Failed to load habits. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filter, isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchHabits();
  }, [fetchHabits, authLoading]);

  // ── Actions ──────────────────────────────────────────────────────

  async function handleAddHabit(e) {
    e.preventDefault();
    if (!isAuthenticated) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await client.post("/habits", {
        name: trimmed,
        description: description.trim() || undefined,
        frequency,
      });
      setHabits((prev) => [normalizeHabit(res.data.data ?? res.data), ...prev]);
      setName("");
      setDescription("");
      setFrequency("daily");
    } catch (err) {
      console.error("Failed to add habit", err);
    }
  }

  async function handleEditHabit(id, { name: newName, description: newDesc, frequency: newFreq }) {
    const patch = {};
    if (newName != null)  patch.name = newName.trim();
    if (newDesc != null)  patch.description = newDesc.trim();
    if (newFreq != null)  patch.frequency = newFreq;
    if (!Object.keys(patch).length) return;

    setHabits((prev) =>
      prev.map((h) => h._id === id ? { ...h, ...patch } : h)
    );
    try {
      const res = await client.patch(`/habits/${id}`, patch);
      setHabits((prev) =>
        prev.map((h) => h._id === id ? normalizeHabit(res.data.data ?? res.data) : h)
      );
    } catch (err) {
      console.error("Failed to edit habit", err);
      fetchHabits();
    }
  }

  async function handleComplete(id) {
    const habit = habits.find((h) => h._id === id);
    if (!habit || completedToday(habit)) return;

    setHabits((prev) =>
      prev.map((h) =>
        h._id === id
          ? { ...h, completedDates: [...(h.completedDates || []), new Date().toISOString()] }
          : h
      )
    );

    try {
      const res = await client.post(`/habits/${id}/complete`);
      const updated = normalizeHabit(res.data.data ?? res.data);
      setHabits((prev) => prev.map((h) => h._id === id ? updated : h));
    } catch (err) {
      if (err.response?.status !== 400) {
        console.error("Failed to complete habit", err);
        fetchHabits();
      }
    }
  }

  async function handleArchive(id) {
    setHabits((prev) => prev.filter((h) => h._id !== id));
    try {
      await client.patch(`/habits/${id}`, { active: false });
    } catch (err) {
      console.error("Failed to archive habit", err);
      fetchHabits();
    }
  }

  async function handleDelete(id) {
    setHabits((prev) => prev.filter((h) => h._id !== id));
    try {
      await client.delete(`/habits/${id}`);
    } catch (err) {
      console.error("Failed to delete habit", err);
      fetchHabits();
    }
  }

  const filteredHabits = freqFilter === "all"
    ? habits
    : habits.filter((h) => h.frequency === freqFilter);

  return {
    habits,
    filteredHabits,
    loading,
    error,
    filter,
    setFilter,
    freqFilter,
    setFreqFilter,
    name,
    setName,
    description,
    setDescription,
    frequency,
    setFrequency,
    completedToday,
    handleAddHabit,
    handleEditHabit,
    handleComplete,
    handleArchive,
    handleDelete,
    refetch: fetchHabits,
  };
}
