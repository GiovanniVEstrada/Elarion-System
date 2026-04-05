import { useEffect, useState } from "react";

export default function CalendarCard() {
  const [events, setEvents] = useState(() => {
    const savedEvents = localStorage.getItem("elarion-events");

    if (savedEvents) {
      return JSON.parse(savedEvents);
    }

    return [];
  });

  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");

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
    setEvents(events.filter((event) => event.id !== id));
  }

  function formatDate(dateString) {
    return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <section className="dashboard-card">
      <span className="card-kicker">Schedule</span>
      <h2>Calendar</h2>

      <form className="calendar-form" onSubmit={handleAddEvent}>
        <input
          className="calendar-input"
          type="text"
          placeholder="Event title..."
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />

        <input
          className="calendar-date-input"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <button className="calendar-add-btn" type="submit">
          Add Event
        </button>
      </form>

      <div className="calendar-list">
        {events.length === 0 ? (
            <p className="calendar-empty">No upcoming events yet.</p>
        ) : (
            events.slice(0, 4).map((event) => (
            <article className="calendar-event" key={event.id}>
                <div className="calendar-event-info">
                <h3>{event.title}</h3>
                <p className="calendar-event-date">{formatDate(event.date)}</p>
                </div>

                <button
                className="calendar-delete-btn"
                type="button"
                onClick={() => handleDeleteEvent(event.id)}
                >
                Delete
                </button>
            </article>
            ))
        )}
        </div>

        {events.length > 4 && (
        <p className="calendar-more">+{events.length - 4} more events</p>
        )}
    </section>
  );
}