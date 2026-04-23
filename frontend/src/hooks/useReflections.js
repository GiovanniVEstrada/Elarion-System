import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { getTodayStr } from "../utils/dateUtils";

export default function useReflections() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReflections = useCallback(async () => {
    if (!isAuthenticated) return;
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
    if (!isAuthenticated) return null;
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
    if (!isAuthenticated) return null;
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
