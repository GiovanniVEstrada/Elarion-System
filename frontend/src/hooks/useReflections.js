import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getTodayStr } from "../utils/dateUtils";
import { checkGuestExpiry, markGuestDataSeeded } from "../utils/guestExpiry";

const GUEST_KEY = "guest_reflections";
const guestLoad = () => {
  checkGuestExpiry();
  const raw = localStorage.getItem(GUEST_KEY);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return []; }
};
const guestSave = (r) => localStorage.setItem(GUEST_KEY, JSON.stringify(r));

function seedMockReflections() {
  const dateStr = (offset) => {
    const d = new Date(Date.now() - offset * 86400000);
    return d.toISOString().split("T")[0];
  };
  return [
    { _id: "guest_r1", date: dateStr(0), notes: "Feeling clear-headed today. Priorities feel well-aligned.", wins: "Completed the weekly review and had a great conversation with a friend.", focus: "high" },
    { _id: "guest_r2", date: dateStr(3), notes: "Scattered energy mid-week but recovered by evening.", wins: "Pushed through the project despite low motivation.", focus: "medium" },
    { _id: "guest_r3", date: dateStr(7), notes: "Strong week overall. Habits on track.", wins: "Hit all daily habits for 5 consecutive days.", focus: "high" },
  ];
}

export default function useReflections() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReflections = useCallback(async () => {
    if (!isAuthenticated) {
      let data = guestLoad();
      if (data === null) {
        data = seedMockReflections();
        guestSave(data);
        markGuestDataSeeded();
      }
      setReflections(data);
      return;
    }
    setLoading(true);
    try {
      const res = await client.get("/reflections");
      setReflections(res.data.data);
    } catch {
      // silent — reflections are supplementary, not critical
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchReflections();
  }, [fetchReflections, authLoading]);

  const todayReflection = reflections.find((r) => r.date === getTodayStr()) ?? null;

  async function upsertReflection(data) {
    if (!isAuthenticated) {
      const all = guestLoad() ?? [];
      const idx = all.findIndex((r) => r.date === data.date);
      let updated;
      let entry;
      if (idx >= 0) {
        entry = { ...all[idx], ...data };
        updated = [...all];
        updated[idx] = entry;
      } else {
        entry = { _id: `guest_r${crypto.randomUUID()}`, ...data };
        updated = [entry, ...all];
      }
      guestSave(updated);
      setReflections(updated);
      return entry;
    }
    try {
      const res = await client.post("/reflections", data);
      const updated = res.data.data;
      setReflections((prev) => {
        const idx = prev.findIndex((r) => r.date === updated.date);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });
      return updated;
    } catch {
      return null;
    }
  }

  async function updateReflection(date, data) {
    if (!isAuthenticated) {
      const all = (guestLoad() ?? []).map((r) => r.date === date ? { ...r, ...data } : r);
      guestSave(all);
      setReflections(all);
      return all.find((r) => r.date === date) ?? null;
    }
    try {
      const res = await client.patch(`/reflections/${date}`, data);
      const updated = res.data.data;
      setReflections((prev) => prev.map((r) => r.date === updated.date ? updated : r));
      return updated;
    } catch {
      return null;
    }
  }

  return {
    reflections,
    loading,
    todayReflection,
    upsertReflection,
    updateReflection,
    refetch: fetchReflections,
  };
}
