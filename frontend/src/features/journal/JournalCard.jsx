import { Link } from "react-router-dom";
import { motion } from "motion/react";
import useJournal from "../../hooks/useJournal";

export default function JournalCard() {
  const {
    entries,
    content,
    setContent,
    handleAddEntry,
    handleDeleteEntry,
  } = useJournal();

  return (
    <motion.section
      className="dashboard-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <div className="dashboard-card-header">
        <div>
          <span className="card-kicker">Reflection</span>
          <h2>Journal</h2>
        </div>

        <Link to="/journal" className="card-link">
          View All →
        </Link>
      </div>

      <p className="card-meta">{entries.length} notes</p>

      <form className="journal-form" onSubmit={handleAddEntry}>
        <textarea
          className="journal-textarea"
          placeholder="Write a reflection..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="5"
        />

        <motion.button
          className="journal-add-btn"
          type="submit"
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          Save Entry
        </motion.button>
      </form>

      <div className="journal-list">
        {entries.length === 0 ? (
          <p className="journal-empty">No journal entries yet.</p>
        ) : (
          <motion.article
            className="journal-entry"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <h3 className="journal-entry-title">{entries[0].title}</h3>
            <p className="journal-entry-text">{entries[0].content}</p>

            <div className="journal-entry-footer">
              <span className="journal-entry-date">
                {entries[0].createdAt}
              </span>

              <motion.button
                className="journal-delete-btn"
                type="button"
                onClick={() => handleDeleteEntry(entries[0].id)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Delete
              </motion.button>
            </div>
          </motion.article>
        )}
      </div>

      {entries.length > 1 && (
        <p className="journal-more">+{entries.length - 1} older entries</p>
      )}
    </motion.section>
  );
}