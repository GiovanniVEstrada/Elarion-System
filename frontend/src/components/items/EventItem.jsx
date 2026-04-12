import { motion } from "motion/react";

export default function EventItem({ event, onDelete, onEdit, formatDate, formatTime }) {
  return (
    <motion.li
      className="calendar-event"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      <div className="calendar-event-info">
        <h3>{event.title}</h3>
        <p className="calendar-event-date">
          {formatDate(event.date)}
          {event.time && formatTime && (
            <span style={{ opacity: 0.7 }}> · {formatTime(event.time)}</span>
          )}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        {onEdit && (
          <motion.button
            className="calendar-edit-btn"
            type="button"
            onClick={() => onEdit(event.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Edit
          </motion.button>
        )}
        <motion.button
          className="calendar-delete-btn"
          type="button"
          onClick={() => onDelete(event.id)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Delete
        </motion.button>
      </div>
    </motion.li>
  );
}
