import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useCalendarContext } from "../../context/CalendarContext";
import EventItem from "../../components/items/EventItem";
import { tapAnim } from "../../utils/motion";

export default function CalendarCard() {
  const {
    events,
    eventTitle,
    setEventTitle,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    handleAddEvent,
    handleDeleteEvent,
    formatDate,
    formatTime,
  } = useCalendarContext();

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
        <Link to="/calendar" className="card-link">View All →</Link>
      </div>

      <p className="card-meta">{events.length} events</p>

      <form className="calendar-form calendar-form--stacked" onSubmit={handleAddEvent}>
        <input
          name="calendar-event-title"
          className="calendar-input"
          type="text"
          placeholder="Event title..."
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            name="calendar-event-date"
            className="calendar-date-input"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            name="calendar-event-time"
            className="calendar-time-input"
            type="time"
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <motion.button
          className="calendar-add-btn"
          type="submit"
          whileHover={{ y: -1, scale: 1.01 }}
          {...tapAnim}
        >
          Add Event
        </motion.button>
      </form>

      {events.length === 0 ? (
        <p className="calendar-empty">No upcoming events yet.</p>
      ) : (
        <ul className="calendar-list">
          <AnimatePresence>
            {events.slice(0, 4).map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onDelete={handleDeleteEvent}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      {events.length > 4 && (
        <p className="calendar-more">+{events.length - 4} more events</p>
      )}
    </motion.section>
  );
}
