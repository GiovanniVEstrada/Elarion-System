import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToastEmitter } from "../components/Toast";

export const MOOD_OPTIONS = [
  { value: "great",   label: "Great",   emoji: "😊", color: "#64dc82" },
  { value: "good",    label: "Good",    emoji: "🙂", color: "#8de88d" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "#ffc83c" },
  { value: "bad",     label: "Bad",     emoji: "😕", color: "#ff9a5a" },
  { value: "awful",   label: "Awful",   emoji: "😔", color: "#ff5a5a" },
];

export default function useMoods() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToastEmitter();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [todaysMood, setTodaysMood] = useState(null);

  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editingMoodId, setEditingMoodId] = useState(null);
  const [editMood, setEditMood] = useState(null);
  const [editNote, setEditNote] = useState("");

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
      showToast(err.response?.data?.message || "Failed to log mood.", "warn");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingMood(entry) {
    setEditingMoodId(entry._id);
    setEditMood(entry.mood);
    setEditNote(entry.note ?? "");
  }

  function stopEditingMood() {
    setEditingMoodId(null);
    setEditMood(null);
    setEditNote("");
  }

  async function handleEdit(e) {
    e.preventDefault();
    if (!editingMoodId || !editMood) return;
    try {
      const res = await client.patch(`/moods/${editingMoodId}`, {
        mood: editMood,
        note: editNote.trim() || undefined,
      });
      const updated = res.data.data ?? res.data;
      setMoods((prev) => prev.map((m) => m._id === editingMoodId ? updated : m));
      const today = new Date().toDateString();
      if (new Date(updated.date ?? updated.createdAt).toDateString() === today) {
        setTodaysMood(updated);
      }
      stopEditingMood();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update mood.", "warn");
    }
  }

  async function handleDelete(id) {
    setMoods((prev) => prev.filter((m) => m._id !== id));
    if (todaysMood?._id === id) setTodaysMood(null);
    if (editingMoodId === id) stopEditingMood();
    try {
      await client.delete(`/moods/${id}`);
    } catch (err) {
      showToast("Failed to delete mood entry.", "warn");
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
    editingMoodId,
    editMood,
    setEditMood,
    editNote,
    setEditNote,
    startEditingMood,
    stopEditingMood,
    handleEdit,
    handleDelete,
    refetch: fetchMoods,
  };
}
