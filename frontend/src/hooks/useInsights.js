import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function useInsights() {
  const { isAuthenticated } = useAuth();
  const [correlations, setCorrelations] = useState(null);
  const [dayOfWeek, setDayOfWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    Promise.all([
      client.get("/insights/correlations").then((r) => r.data.data).catch(() => null),
      client.get("/insights/day-of-week").then((r) => r.data.data).catch(() => null),
    ]).then(([corr, dow]) => {
      setCorrelations(corr);
      setDayOfWeek(dow);
    }).finally(() => setLoading(false));
  }, [isAuthenticated]);

  return { correlations, dayOfWeek, loading };
}
