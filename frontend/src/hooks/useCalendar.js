import { useEffect, useMemo, useState } from "react";

export default function useCalendar() {
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem("elarion-events");
    return savedEvents ? JSON.parse(savedEvents) : [];
  });

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem("elarion-events", JSON.stringify(events));
  }, [events]);

  function handleAddEvent(e) {
    e.preventDefault();

    const trimmedTitle = eventTitle.trim();
    if (!trimmedTitle || !eventDate) return;

    const newEvent = {
      id: Date.now(),
      title: trimmedTitle,
      date: eventDate,
    };

    const updatedEvents = [...events, newEvent].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    setEvents(updatedEvents);
    setEventTitle("");
    setEventDate("");
  }

  function handleDeleteEvent(id) {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }

  function formatDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredEvents = useMemo(() => {
    if (filter === "upcoming") {
      return events.filter((event) => new Date(event.date + "T00:00:00") >= today);
    }

    if (filter === "past") {
      return events.filter((event) => new Date(event.date + "T00:00:00") < today);
    }

    return events;
  }, [events, filter]);

  const upcomingCount = events.filter(
    (event) => new Date(event.date + "T00:00:00") >= today
  ).length;

  const pastCount = events.filter(
    (event) => new Date(event.date + "T00:00:00") < today
  ).length;

  return {
    events,
    eventTitle,
    setEventTitle,
    eventDate,
    setEventDate,
    filter,
    setFilter,
    filteredEvents,
    upcomingCount,
    pastCount,
    handleAddEvent,
    handleDeleteEvent,
    formatDate,
  };
}