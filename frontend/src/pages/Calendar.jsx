import { motion } from "motion/react";
import useCalendar from "../hooks/useCalendar";

export default function Calendar() {
  const {
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
  } = useCalendar();

  return (
    <motion.section
      className="feature-page"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="feature-page-header"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
      >
        <span className="card-kicker">Workspace</span>
        <h1>Calendar</h1>
        <p>
          Organize your schedule in a cleaner space with room to grow into shared
          planning later.
        </p>
      </motion.div>

      <motion.div
        className="calendar-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="calendar-page-toolbar">
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

          <div className="calendar-page-controls">
            <div className="calendar-filter-group">
              <motion.button
                type="button"
                className={filter === "all" ? "calendar-filter-btn active" : "calendar-filter-btn"}
                onClick={() => setFilter("all")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                All
              </motion.button>

              <motion.button
                type="button"
                className={filter === "upcoming" ? "calendar-filter-btn active" : "calendar-filter-btn"}
                onClick={() => setFilter("upcoming")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Upcoming
              </motion.button>

              <motion.button
                type="button"
                className={filter === "past" ? "calendar-filter-btn active" : "calendar-filter-btn"}
                onClick={() => setFilter("past")}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Past
              </motion.button>
            </div>

            <div className="calendar-page-stats">
              <span>{upcomingCount} upcoming</span>
              <span>{pastCount} past</span>
            </div>
          </div>
        </div>

        <div className="calendar-page-list-wrap">
          {filteredEvents.length === 0 ? (
            <p className="calendar-page-empty">No events in this view.</p>
          ) : (
            <div className="calendar-list">
              {filteredEvents.map((event) => (
                <motion.article
                  className="calendar-event"
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                >
                  <div className="calendar-event-info">
                    <h3>{event.title}</h3>
                    <p className="calendar-event-date">{formatDate(event.date)}</p>
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
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.section>
  );
}