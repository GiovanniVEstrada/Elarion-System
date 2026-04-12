import { motion } from "motion/react";
import { getTodayStr } from "../../utils/dateUtils";

const FEELINGS = ["energizing", "neutral", "necessary", "draining"];
const FEELING_META = {
  energizing: { label: "Energizing", cls: "feeling-chip--energizing" },
  neutral:    { label: "Neutral",    cls: "feeling-chip--neutral"    },
  necessary:  { label: "Necessary",  cls: "feeling-chip--necessary"  },
  draining:   { label: "Draining",   cls: "feeling-chip--draining"   },
};

export default function EventItem({ event, onDelete, onEdit, onSetActualFeeling, formatDate, formatTime }) {
  const isPast = event.date < getTodayStr();

  return (
    <motion.li
      className="calendar-event"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      <div className="calendar-event-info">
        <div className="calendar-event-title-row">
          <h3>{event.title}</h3>
          {event.expectedFeeling && (
            <span className={`feeling-chip ${FEELING_META[event.expectedFeeling].cls}`}>
              {FEELING_META[event.expectedFeeling].label}
            </span>
          )}
        </div>
        <p className="calendar-event-date">
          {formatDate(event.date)}
          {event.time && formatTime && (
            <span style={{ opacity: 0.7 }}> · {formatTime(event.time)}</span>
          )}
        </p>

        {isPast && onSetActualFeeling && (
          <div className="actual-feeling-row">
            {event.actualFeeling ? (
              <span className={`feeling-chip ${FEELING_META[event.actualFeeling].cls}`}>
                Actually: {FEELING_META[event.actualFeeling].label}
              </span>
            ) : (
              <div className="actual-feeling-prompt">
                <span className="actual-feeling-label">How was it?</span>
                <div className="feeling-picker feeling-picker--inline">
                  {FEELINGS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`feeling-btn feeling-btn--${f}`}
                      onClick={() => onSetActualFeeling(event.id, f)}
                    >
                      {FEELING_META[f].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignSelf: "flex-start" }}>
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
