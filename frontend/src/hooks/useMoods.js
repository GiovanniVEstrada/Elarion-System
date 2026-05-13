import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToastEmitter } from "../components/Toast";
import { checkGuestExpiry, markGuestDataSeeded } from "../utils/guestExpiry";

export const MOOD_OPTIONS = [
  { value: "great",   label: "Great",   emoji: "😊", color: "#64dc82" },
  { value: "good",    label: "Good",    emoji: "🙂", color: "#8de88d" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "#ffc83c" },
  { value: "bad",     label: "Bad",     emoji: "😕", color: "#ff9a5a" },
  { value: "awful",   label: "Awful",   emoji: "😔", color: "#ff5a5a" },
];

const GUEST_KEY = "guest_moods";
const guestLoad = () => {
  checkGuestExpiry();
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return []; }
};
const guestSave = (m) => localStorage.setItem(GUEST_KEY, JSON.stringify(m));

function seedMockMoods() {
  const d = (offset) => new Date(Date.now() - offset * 86400000).toISOString();
  return [
    { _id: "guest_m1", mood: "great",   note: "Productive morning, felt really in flow.",     createdAt: d(0), date: d(0) },
    { _id: "guest_m2", mood: "good",    note: "Nice day, got most things done.",              createdAt: d(1), date: d(1) },
    { _id: "guest_m3", mood: "neutral", note: null,                                           createdAt: d(2), date: d(2) },
    { _id: "guest_m4", mood: "good",    note: "Went for a long walk, felt refreshed.",        createdAt: d(3), date: d(3) },
    { _id: "guest_m5", mood: "great",   note: "Really aligned with my goals today.",          createdAt: d(4), date: d(4) },
    { _id: "guest_m6", mood: "bad",     note: "Struggled to focus, felt scattered.",          createdAt: d(5), date: d(5) },
    { _id: "guest_m7", mood: "good",    note: "Good session reading, clear mind.",            createdAt: d(6), date: d(6) },
  ];
}

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
    if (!isAuthenticated) {
      let list = guestLoad();
      if (list === null) {
        list = seedMockMoods();
        guestSave(list);
        markGuestDataSeeded();
      }
      setMoods(list);
      const today = new Date().toDateString();
      setTodaysMood(list.find((m) => new Date(m.date ?? m.createdAt).toDateString() === today) ?? null);
      return;
    }
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
      if (!isAuthenticated) {
        const created = {
          _id: `guest_${crypto.randomUUID()}`,
          mood: selectedMood,
          note: note.trim() || null,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString(),
        };
        const updated = [created, ...(guestLoad() ?? [])];
        guestSave(updated);
        setMoods(updated);
        setTodaysMood(created);
        setSelectedMood(null);
        setNote("");
        return;
      }
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
      if (!isAuthenticated) {
        const updated = (guestLoad() ?? []).map((m) =>
          m._id === editingMoodId ? { ...m, mood: editMood, note: editNote.trim() || null } : m
        );
        guestSave(updated);
        setMoods(updated);
        const today = new Date().toDateString();
        const entry = updated.find((m) => m._id === editingMoodId);
        if (entry && new Date(entry.date ?? entry.createdAt).toDateString() === today) {
          setTodaysMood(entry);
        }
        stopEditingMood();
        return;
      }
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
    const updated = moods.filter((m) => m._id !== id);
    setMoods(updated);
    if (todaysMood?._id === id) setTodaysMood(null);
    if (editingMoodId === id) stopEditingMood();
    if (!isAuthenticated) { guestSave(updated); return; }
    try {
      await client.delete(`/moods/${id}`);
    } catch {
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
