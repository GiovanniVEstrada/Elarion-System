import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export const MOOD_OPTIONS = [
  { value: "great",   label: "Great",   emoji: "😊", color: "#64dc82" },
  { value: "good",    label: "Good",    emoji: "🙂", color: "#8de88d" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "#ffc83c" },
  { value: "bad",     label: "Bad",     emoji: "😕", color: "#ff9a5a" },
  { value: "awful",   label: "Awful",   emoji: "😔", color: "#ff5a5a" },
];

export default function useMoods() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todaysMood, setTodaysMood] = useState(null);

  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchMoods = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const res = await client.get("/moods", { params: { limit: 50 } });
      const list = res.data.data ?? res.data;
      setMoods(list);

      const today = new Date().toDateString();
      const todays = list.find((m) => new Date(m.date ?? m.createdAt).toDateString() === today);
      setTodaysMood(todays ?? null);
    } catch (err) {
      console.error("Failed to fetch moods", err);
      setError(err.response?.data?.message || "Failed to load moods. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchMoods();
  }, [fetchMoods, authLoading]);

  // ── Actions ──────────────────────────────────────────────────────

  async function handleLog(e) {
    e.preventDefault();
    if (!selectedMood) return;
    setSubmitting(true);
    try {
      const res = await client.post("/moods", {
        mood: selectedMood,
        note: note.trim() || undefined,
      });
      const created = res.data.data ?? res.data;
      setMoods((prev) => [created, ...prev]);
      setTodaysMood(created);
      setSelectedMood(null);
      setNote("");
    } catch (err) {
      console.error("Failed to log mood", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(id, updates) {
    try {
      const res = await client.patch(`/moods/${id}`, updates);
      const updated = res.data.data ?? res.data;
      setMoods((prev) => prev.map((m) => m._id === id ? updated : m));
      const today = new Date().toDateString();
      if (new Date(updated.date ?? updated.createdAt).toDateString() === today) {
        setTodaysMood(updated);
      }
    } catch (err) {
      console.error("Failed to edit mood", err);
    }
  }

  async function handleDelete(id) {
    setMoods((prev) => prev.filter((m) => m._id !== id));
    if (todaysMood?._id === id) setTodaysMood(null);
    try {
      await client.delete(`/moods/${id}`);
    } catch (err) {
      console.error("Failed to delete mood", err);
      fetchMoods();
    }
  }

  return {
    moods,
    loading,
    error,
    todaysMood,
    selectedMood,
    setSelectedMood,
    note,
    setNote,
    submitting,
    handleLog,
    handleEdit,
    handleDelete,
    refetch: fetchMoods,
  };
}
