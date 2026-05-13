import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { checkGuestExpiry, markGuestDataSeeded } from "../utils/guestExpiry";

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

const GUEST_KEY = "guest_habits";
const guestLoad = () => {
  checkGuestExpiry();
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw === null) return null;
  try { return JSON.parse(raw).map(normalizeHabit); } catch { return []; }
};
const guestSave = (h) => localStorage.setItem(GUEST_KEY, JSON.stringify(h));

function seedMockHabits() {
  const d = (offset) => new Date(Date.now() - offset * 86400000).toISOString();
  return [
    { _id: "guest_h1", name: "Morning meditation", frequency: "daily",  currentStreak: 5,  completedDates: [d(0),d(1),d(2),d(3),d(4)], active: true, createdAt: d(30) },
    { _id: "guest_h2", name: "Evening walk",        frequency: "daily",  currentStreak: 3,  completedDates: [d(0),d(1),d(2)], active: true, createdAt: d(30) },
    { _id: "guest_h3", name: "Read 20 minutes",     frequency: "daily",  currentStreak: 12, completedDates: [d(0),d(1),d(2),d(3),d(4),d(5),d(6),d(7),d(8),d(9),d(10),d(11)], active: true, createdAt: d(30) },
    { _id: "guest_h4", name: "No phone after 9pm",  frequency: "daily",  currentStreak: 2,  completedDates: [d(0),d(1)], active: true, createdAt: d(20) },
    { _id: "guest_h5", name: "Weekly review",       frequency: "weekly", currentStreak: 4,  completedDates: [d(0),d(7),d(14),d(21)], active: true, createdAt: d(30) },
  ];
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
    if (!isAuthenticated) {
      let data = guestLoad();
      if (data === null) {
        data = seedMockHabits();
        guestSave(data);
        markGuestDataSeeded();
      }
      setHabits(filter === "active" ? data.filter((h) => h.active !== false) : data);
      return;
    }
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
    const trimmed = name.trim();
    if (!trimmed) return;

    if (!isAuthenticated) {
      const newHabit = normalizeHabit({
        _id: `guest_${crypto.randomUUID()}`,
        name: trimmed,
        description: description.trim() || undefined,
        frequency,
        completedDates: [],
        currentStreak: 0,
        active: true,
        createdAt: new Date().toISOString(),
      });
      const all = guestLoad() ?? [];
      const updated = [newHabit, ...all];
      guestSave(updated);
      setHabits((prev) => [newHabit, ...prev]);
      setName(""); setDescription(""); setFrequency("daily");
      return;
    }

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

    if (!isAuthenticated) {
      const all = (guestLoad() ?? []).map((h) => h._id === id ? { ...h, ...patch } : h);
      guestSave(all);
      return;
    }

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

    const newDate = new Date().toISOString();
    setHabits((prev) =>
      prev.map((h) =>
        h._id === id
          ? { ...h, completedDates: [...(h.completedDates || []), newDate], currentStreak: (h.currentStreak || 0) + 1 }
          : h
      )
    );

    if (!isAuthenticated) {
      const all = (guestLoad() ?? []).map((h) =>
        h._id === id
          ? { ...h, completedDates: [...(h.completedDates || []), newDate], currentStreak: (h.currentStreak || 0) + 1 }
          : h
      );
      guestSave(all);
      return;
    }

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
    if (!isAuthenticated) {
      const all = (guestLoad() ?? []).map((h) => h._id === id ? { ...h, active: false } : h);
      guestSave(all);
      return;
    }
    try {
      await client.patch(`/habits/${id}`, { active: false });
    } catch (err) {
      console.error("Failed to archive habit", err);
      fetchHabits();
    }
  }

  async function handleDelete(id) {
    setHabits((prev) => prev.filter((h) => h._id !== id));
    if (!isAuthenticated) {
      const all = (guestLoad() ?? []).filter((h) => h._id !== id);
      guestSave(all);
      return;
    }
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
