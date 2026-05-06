import { motion } from "motion/react";

const MOODS = {
  1: { label: "Low", color: "#ff6b6b" },
  2: { label: "Heavy", color: "#ff9f43" },
  3: { label: "Even", color: "#ffd166" },
  4: { label: "Light", color: "#7bd88f" },
  5: { label: "Bright", color: "#4ecdc4" },
};

function formatDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d) ? raw : d.toLocaleString();
}

export default function JournalEntry({ entry, onDelete, onEdit, className = "journal-entry" }) {
  const mood = MOODS[entry.mood] ?? null;
  const hasMeta = entry.mood || entry.clarity || entry.mentalState;

  return (
    <motion.article
      className={className}
      style={{ "--mood-color": mood?.color ?? "rgba(140, 168, 179, 0.5)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
    >
      <div className="journal-entry-main">
        <div className="journal-entry-mood" aria-label={mood ? `Mood ${mood.label}` : "No mood"}>
          <span>{entry.mood || ""}</span>
          <small>{mood?.label ?? "Open"}</small>
        </div>

        <div className="journal-entry-body">
          <h3 className="journal-entry-title">{entry.title}</h3>
          <p className="journal-entry-text">{entry.content}</p>

          {hasMeta && (
            <div className="entry-meta">
              {mood && (
                <span className="entry-meta-chip entry-meta-chip--mood">
                  {mood.label}
                </span>
              )}
              {entry.clarity && (
                <span className="entry-meta-chip entry-meta-chip--clarity">
                  clarity {entry.clarity}/5
                </span>
              )}
              {entry.mentalState && (
                <span className="entry-meta-chip entry-meta-chip--state">
                  {entry.mentalState}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="journal-entry-footer">
        <span className="journal-entry-date">{formatDate(entry.createdAt)}</span>
        <div className="journal-entry-actions">
          {onEdit && (
            <motion.button
              className="journal-edit-btn"
              type="button"
              onClick={() => onEdit(entry._id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit
            </motion.button>
          )}
          <motion.button
            className="journal-delete-btn"
            type="button"
            onClick={() => onDelete(entry._id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Delete
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
