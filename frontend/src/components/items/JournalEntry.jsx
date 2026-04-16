import { motion } from "motion/react";

const MOOD_EMOJIS = ["", "😔", "😕", "😐", "🙂", "😊"];

function formatDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  return isNaN(d) ? raw : d.toLocaleString();
}

export default function JournalEntry({ entry, onDelete, onEdit, className = "journal-entry" }) {
  const hasMeta = entry.mood || entry.clarity || entry.mentalState;

  return (
    <motion.article
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
    >
      <h3 className="journal-entry-title">{entry.title}</h3>
      <p className="journal-entry-text">{entry.content}</p>

      {hasMeta && (
        <div className="entry-meta">
          {entry.mood && (
            <span className="entry-meta-chip entry-meta-chip--mood">
              {MOOD_EMOJIS[entry.mood]}
            </span>
          )}
          {entry.clarity && (
            <span className="entry-meta-chip entry-meta-chip--clarity">
              {"●".repeat(entry.clarity)}{"○".repeat(5 - entry.clarity)} clarity
            </span>
          )}
          {entry.mentalState && (
            <span className="entry-meta-chip entry-meta-chip--state">
              {entry.mentalState}
            </span>
          )}
        </div>
      )}

      <div className="journal-entry-footer">
        <span className="journal-entry-date">{formatDate(entry.createdAt)}</span>
        <div style={{ display: "flex", gap: "8px" }}>
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
