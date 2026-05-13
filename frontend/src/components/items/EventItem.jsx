import { motion } from "motion/react";
import { getTodayStr } from "../../utils/dateUtils";

const FEELINGS = ["energizing", "neutral", "necessary", "draining"];
const FEELING_META = {
  energizing: { label: "Energizing", color: "#64dc82" },
  neutral:    { label: "Neutral",    color: "#74d8ff" },
  necessary:  { label: "Necessary",  color: "#ffc83c" },
  draining:   { label: "Draining",   color: "#ff5a5a" },
};

export default function EventItem({ event, onDelete, onEdit, onSetActualFeeling, formatDate, formatTime }) {
  const isPast       = event.date < getTodayStr();
  const feelingColor = FEELING_META[event.expectedFeeling]?.color ?? "rgba(78, 205, 196, 0.35)";

  return (
    <motion.li
      className="cal-event-item"
      style={{ "--feeling-color": feelingColor }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      <span className="cal-event-feeling-dot" aria-hidden="true" />

      <div className="cal-event-body">
        <span className="cal-event-title">{event.title}</span>
        <span className="cal-event-meta">
          {formatDate(event.date)}
          {event.time && formatTime && ` · ${formatTime(event.time)}`}
        </span>

        {isPast && onSetActualFeeling && !event.actualFeeling && (
          <div className="cal-event-prompt">
            <span className="cal-event-prompt-label">How was it?</span>
            <div className="feeling-picker feeling-picker--inline">
              {FEELINGS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className="feeling-btn"
                  style={{ "--feeling-color": FEELING_META[f].color }}
                  onClick={() => onSetActualFeeling(event._id, f)}
                >
                  {FEELING_META[f].label}
                </button>
              ))}
            </div>
          </div>
        )}

        {isPast && event.actualFeeling && (
          <span
            className="cal-event-actual"
            style={{ color: FEELING_META[event.actualFeeling]?.color }}
          >
            Was: {FEELING_META[event.actualFeeling]?.label}
          </span>
        )}
      </div>

      <div className="cal-event-actions">
        {onEdit && (
          <motion.button
            className="cal-event-edit-btn"
            type="button"
            onClick={() => onEdit(event._id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Edit
          </motion.button>
        )}
        <motion.button
          className="cal-event-del-btn"
          type="button"
          onClick={() => onDelete(event._id)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Delete
        </motion.button>
      </div>
    </motion.li>
  );
}
