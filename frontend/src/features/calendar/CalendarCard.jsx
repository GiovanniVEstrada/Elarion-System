import { Link } from "react-router-dom";
import { motion } from "motion/react";
import useCalendar from "../../hooks/useCalendar";

export default function CalendarCard() {
  const {
    events,
    eventTitle,
    setEventTitle,
    eventDate,
    setEventDate,
    handleAddEvent,
    handleDeleteEvent,
    formatDate,
  } = useCalendar();

  return (
    <motion.section
      className="dashboard-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <div className="dashboard-card-header">
        <div>
          <span className="card-kicker">Schedule</span>
          <h2>Calendar</h2>
        </div>

        <Link to="/calendar" className="card-link">
          View All →
        </Link>
      </div>

      <p className="card-meta">{events.length} events</p>

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

        <motion.button
          className="calendar-add-btn"
          type="submit"
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          Add Event
        </motion.button>
      </form>

      <div className="calendar-list">
        {events.length === 0 ? (
          <p className="calendar-empty">No upcoming events yet.</p>
        ) : (
          events.slice(0, 4).map((event) => (
            <motion.article
              className="calendar-event"
              key={event.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="calendar-event-info">
                <h3>{event.title}</h3>
                <p className="calendar-event-date">
                  {formatDate(event.date)}
                </p>
              </div>

              <motion.button
                className="calendar-delete-btn"
                type="button"
                onClick={() => handleDeleteEvent(event.id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Delete
              </motion.button>
            </motion.article>
          ))
        )}
      </div>

      {events.length > 4 && (
        <p className="calendar-more">+{events.length - 4} more events</p>
      )}
    </motion.section>
  );
}