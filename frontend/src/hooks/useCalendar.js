import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatTime } from "../utils/dateUtils";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { checkGuestExpiry, markGuestDataSeeded } from "../utils/guestExpiry";

const MIGRATION_KEY = "elarion-events";
const MIGRATED_KEY  = "elarion-events-migrated";
const GUEST_CAL_KEY = "guest_calendar";

const guestLoadEvents = () => {
  checkGuestExpiry();
  const raw = localStorage.getItem(GUEST_CAL_KEY);
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return []; }
};
const guestSaveEvents = (evs) => localStorage.setItem(GUEST_CAL_KEY, JSON.stringify(evs));

function seedMockEvents() {
  const dateStr = (offset) => {
    const d = new Date(Date.now() + offset * 86400000);
    return d.toISOString().split("T")[0];
  };
  return [
    { _id: "guest_e1", title: "Deep work block",    date: dateStr(1),  time: "09:00", expectedFeeling: "energizing", createdAt: new Date().toISOString() },
    { _id: "guest_e2", title: "Weekly review",      date: dateStr(2),  time: "16:00", expectedFeeling: "neutral",    createdAt: new Date().toISOString() },
    { _id: "guest_e3", title: "Call with mentor",   date: dateStr(4),  time: "11:00", expectedFeeling: "energizing", createdAt: new Date().toISOString() },
    { _id: "guest_e4", title: "Morning run",        date: dateStr(-1), time: "07:00", expectedFeeling: "energizing", actualFeeling: "energizing", createdAt: new Date().toISOString() },
    { _id: "guest_e5", title: "Journaling session", date: dateStr(-3), time: "20:00", expectedFeeling: "neutral",    actualFeeling: "neutral",    createdAt: new Date().toISOString() },
  ];
}

export default function useCalendar() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [expectedFeeling, setExpectedFeeling] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const migrationRan = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    async function loadAndMigrate() {
      if (!isAuthenticated) {
        let data = guestLoadEvents();
        if (data === null) {
          data = seedMockEvents();
          guestSaveEvents(data);
          markGuestDataSeeded();
        }
        setEvents(sortEvents(data));
        setLoading(false);
        return;
      }

      // One-time migration: if old localStorage data exists and hasn't been migrated yet
      if (!migrationRan.current && !localStorage.getItem(MIGRATED_KEY)) {
        migrationRan.current = true;
        const raw = localStorage.getItem(MIGRATION_KEY);
        if (raw) {
          try {
            const oldEvents = JSON.parse(raw);
            if (Array.isArray(oldEvents) && oldEvents.length > 0) {
              await Promise.all(
                oldEvents.map((ev) =>
                  client.post("/calendar", {
                    title: ev.title,
                    date: ev.date,
                    time: ev.time || "",
                    expectedFeeling: ev.expectedFeeling || null,
                    clientId: String(ev.id),
                  }).catch(() => null)
                )
              );
            }
            localStorage.removeItem(MIGRATION_KEY);
          } catch {
            // Non-fatal — migration fails silently
          }
        }
        localStorage.setItem(MIGRATED_KEY, "1");
      }

      try {
        const res = await client.get("/calendar");
        setEvents(sortEvents(res.data.data ?? []));
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    loadAndMigrate();
  }, [isAuthenticated, authLoading]);

  function sortEvents(list) {
    return [...list].sort((a, b) => {
      const aStr = a.date + "T" + (a.time || "00:00");
      const bStr = b.date + "T" + (b.time || "00:00");
      return new Date(aStr) - new Date(bStr);
    });
  }

  function startEditingEvent(id) {
    const event = events.find((e) => e._id === id);
    if (!event) return;
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time || "");
    setExpectedFeeling(event.expectedFeeling || null);
    setEditingEventId(id);
  }

  function stopEditingEvent() {
    setEditingEventId(null);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setExpectedFeeling(null);
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle || !eventDate) return;

    if (editingEventId) {
      if (!isAuthenticated) {
        const updated = sortEvents(
          (guestLoadEvents() ?? []).map((ev) =>
            ev._id === editingEventId
              ? { ...ev, title: trimmedTitle, date: eventDate, time: eventTime, expectedFeeling }
              : ev
          )
        );
        guestSaveEvents(updated);
        setEvents(updated);
        stopEditingEvent();
        return;
      }
      try {
        const res = await client.patch(`/calendar/${editingEventId}`, {
          title: trimmedTitle,
          date: eventDate,
          time: eventTime,
          expectedFeeling,
        });
        setEvents((prev) =>
          sortEvents(prev.map((ev) => (ev._id === editingEventId ? res.data.data : ev)))
        );
      } catch { /* silent */ }
      stopEditingEvent();
      return;
    }

    if (!isAuthenticated) {
      const newEvent = { _id: `guest_${crypto.randomUUID()}`, title: trimmedTitle, date: eventDate, time: eventTime, expectedFeeling, createdAt: new Date().toISOString() };
      const updated = sortEvents([...(guestLoadEvents() ?? []), newEvent]);
      guestSaveEvents(updated);
      setEvents(updated);
      setEventTitle(""); setEventDate(""); setEventTime(""); setExpectedFeeling(null);
      return;
    }

    try {
      const res = await client.post("/calendar", {
        title: trimmedTitle,
        date: eventDate,
        time: eventTime,
        expectedFeeling,
      });
      setEvents((prev) => sortEvents([...prev, res.data.data]));
      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setExpectedFeeling(null);
    } catch { /* silent */ }
  }

  async function addEventDirect({ title, date, time = "", endTime = "", feeling = null }) {
    if (!title?.trim() || !date) return null;

    if (!isAuthenticated) {
      const newEvent = { _id: `guest_${crypto.randomUUID()}`, title: title.trim(), date, time, endTime, expectedFeeling: feeling, createdAt: new Date().toISOString() };
      const updated = sortEvents([...(guestLoadEvents() ?? []), newEvent]);
      guestSaveEvents(updated);
      setEvents(updated);
      return newEvent;
    }

    try {
      const res = await client.post("/calendar", {
        title: title.trim(),
        date,
        time,
        endTime,
        expectedFeeling: feeling,
      });
      const event = res.data.data;
      setEvents((prev) => sortEvents([...prev, event]));
      return event;
    } catch {
      return null;
    }
  }

  async function editEventDirect(id, { title, date, time = "", endTime = "", feeling = null }) {
    if (!title?.trim() || !date) return null;

    if (!isAuthenticated) {
      const updated = sortEvents(
        (guestLoadEvents() ?? []).map((ev) =>
          ev._id === id ? { ...ev, title: title.trim(), date, time, endTime, expectedFeeling: feeling } : ev
        )
      );
      guestSaveEvents(updated);
      setEvents(updated);
      return updated.find((ev) => ev._id === id) ?? null;
    }

    try {
      const res = await client.patch(`/calendar/${id}`, {
        title: title.trim(),
        date,
        time,
        endTime,
        expectedFeeling: feeling,
      });
      setEvents((prev) => sortEvents(prev.map((ev) => (ev._id === id ? res.data.data : ev))));
      return res.data.data;
    } catch {
      return null;
    }
  }

  async function handleSetActualFeeling(id, feeling) {
    if (!isAuthenticated) {
      const updated = (guestLoadEvents() ?? []).map((e) =>
        e._id === id ? { ...e, actualFeeling: feeling } : e
      );
      guestSaveEvents(updated);
      setEvents(sortEvents(updated));
      return;
    }
    try {
      const res = await client.patch(`/calendar/${id}`, { actualFeeling: feeling });
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? res.data.data : e))
      );
    } catch { /* silent */ }
  }

  async function handleDeleteEvent(id) {
    if (!isAuthenticated) {
      const updated = (guestLoadEvents() ?? []).filter((ev) => ev._id !== id);
      guestSaveEvents(updated);
      setEvents(updated);
      if (editingEventId === id) stopEditingEvent();
      return;
    }
    try {
      await client.delete(`/calendar/${id}`);
      setEvents((prev) => prev.filter((event) => event._id !== id));
      if (editingEventId === id) stopEditingEvent();
    } catch { /* silent */ }
  }

  function prevMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
    setSelectedDay(null);
  }

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredEvents = useMemo(() => {
    let base = events;
    if (selectedDay) {
      base = base.filter((e) => e.date === selectedDay);
    } else if (filter === "upcoming") {
      base = base.filter((e) => new Date(e.date + "T00:00:00") >= today);
    } else if (filter === "past") {
      base = base.filter((e) => new Date(e.date + "T00:00:00") < today);
    }
    return base;
  }, [events, filter, selectedDay, today]);

  const upcomingCount = events.filter(
    (e) => new Date(e.date + "T00:00:00") >= today
  ).length;

  const pastCount = events.filter(
    (e) => new Date(e.date + "T00:00:00") < today
  ).length;

  function getEventDatesInMonth(year, month) {
    const map = new Map();
    events.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        map.set(e.date, (map.get(e.date) || 0) + 1);
      }
    });
    return map;
  }

  return {
    events,
    loading,
    eventTitle,
    setEventTitle,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    expectedFeeling,
    setExpectedFeeling,
    filter,
    setFilter,
    filteredEvents,
    upcomingCount,
    pastCount,
    handleAddEvent,
    addEventDirect,
    editEventDirect,
    handleDeleteEvent,
    handleSetActualFeeling,
    editingEventId,
    startEditingEvent,
    stopEditingEvent,
    formatDate,
    formatTime,
    selectedDay,
    setSelectedDay,
    currentMonth,
    prevMonth,
    nextMonth,
    getEventDatesInMonth,
  };
}
