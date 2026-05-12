import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatTime } from "../utils/dateUtils";
import client from "../api/client";

const MIGRATION_KEY = "elarion-events";
const MIGRATED_KEY  = "elarion-events-migrated";

export default function useCalendar() {
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
    async function loadAndMigrate() {
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
  }, []);

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
    try {
      const res = await client.patch(`/calendar/${id}`, { actualFeeling: feeling });
      setEvents((prev) =>
        prev.map((e) => (e._id === id ? res.data.data : e))
      );
    } catch { /* silent */ }
  }

  async function handleDeleteEvent(id) {
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
