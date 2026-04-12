import { useEffect, useMemo, useState } from "react";
import { formatDate, formatTime } from "../utils/dateUtils";

export default function useCalendar() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("elarion-events");
    return saved ? JSON.parse(saved) : [];
  });

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    localStorage.setItem("elarion-events", JSON.stringify(events));
  }, [events]);

  function sortEvents(list) {
    return [...list].sort((a, b) => {
      const aStr = a.date + "T" + (a.time || "00:00");
      const bStr = b.date + "T" + (b.time || "00:00");
      return new Date(aStr) - new Date(bStr);
    });
  }

  function startEditingEvent(id) {
    const event = events.find((e) => e.id === id);
    if (!event) return;
    setEventTitle(event.title);
    setEventDate(event.date);
    setEventTime(event.time || "");
    setEditingEventId(id);
  }

  function stopEditingEvent() {
    setEditingEventId(null);
    setEventTitle("");
    setEventDate("");
    setEventTime("");
  }

  function handleAddEvent(e) {
    e.preventDefault();
    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle || !eventDate) return;

    if (editingEventId) {
      setEvents((prev) =>
        sortEvents(
          prev.map((ev) =>
            ev.id === editingEventId
              ? { ...ev, title: trimmedTitle, date: eventDate, time: eventTime }
              : ev
          )
        )
      );
      stopEditingEvent();
      return;
    }

    const newEvent = {
      id: Date.now(),
      title: trimmedTitle,
      date: eventDate,
      time: eventTime,
    };

    setEvents(sortEvents([...events, newEvent]));
    setEventTitle("");
    setEventDate("");
    setEventTime("");
  }

  function handleDeleteEvent(id) {
    setEvents((prev) => prev.filter((event) => event.id !== id));
    if (editingEventId === id) stopEditingEvent();
  }

  function prevMonth() {
    setCurrentMonth(({ year, month }) => {
      if (month === 0) return { year: year - 1, month: 11 };
      return { year, month: month - 1 };
    });
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(({ year, month }) => {
      if (month === 11) return { year: year + 1, month: 0 };
      return { year, month: month + 1 };
    });
    setSelectedDay(null);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  }, [events, filter, selectedDay]);

  const upcomingCount = events.filter(
    (e) => new Date(e.date + "T00:00:00") >= today
  ).length;

  const pastCount = events.filter(
    (e) => new Date(e.date + "T00:00:00") < today
  ).length;

  function getEventDatesInMonth(year, month) {
    const set = new Set();
    events.forEach((e) => {
      const d = new Date(e.date + "T00:00:00");
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(e.date);
      }
    });
    return set;
  }

  return {
    events,
    eventTitle,
    setEventTitle,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    filter,
    setFilter,
    filteredEvents,
    upcomingCount,
    pastCount,
    handleAddEvent,
    handleDeleteEvent,
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
