import { motion } from "motion/react";

export default function JournalEntry({ entry, onDelete, onEdit, className = "journal-entry" }) {
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

      <div className="journal-entry-footer">
        <span className="journal-entry-date">{entry.createdAt}</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {onEdit && (
            <motion.button
              className="journal-edit-btn"
              type="button"
              onClick={() => onEdit(entry.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              Edit
            </motion.button>
          )}
          <motion.button
            className="journal-delete-btn"
            type="button"
            onClick={() => onDelete(entry.id)}
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
