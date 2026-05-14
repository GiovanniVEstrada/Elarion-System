import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useJournalContext } from "../../context/JournalContext";
import JournalEntry from "../../components/items/JournalEntry";
import { tapAnim } from "../../utils/motion";

export default function JournalCard() {
  const {
    entries,
    content,
    setContent,
    handleAddEntry,
    handleDeleteEntry,
  } = useJournalContext();

  return (
    <motion.section
      className="dashboard-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
    >
      <div className="dashboard-card-header">
        <div>
          <span className="card-kicker">Reflection</span>
          <h2>Reflection Log</h2>
        </div>
        <Link to="/journal" className="card-link">View All →</Link>
      </div>

      <p className="card-meta">{entries.length} notes</p>

      <form className="journal-form" onSubmit={handleAddEntry}>
        <textarea
          name="journal-card-content"
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
          {...tapAnim}
        >
          Save Entry
        </motion.button>
      </form>

      <AnimatePresence mode="wait">
        {entries.length === 0 ? (
          <motion.p
            key="empty"
            className="journal-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            No entries yet.
          </motion.p>
        ) : (
          <JournalEntry
            key={entries[0]._id}
            entry={entries[0]}
            onDelete={handleDeleteEntry}
          />
        )}
      </AnimatePresence>

      {entries.length > 1 && (
        <p className="journal-more">+{entries.length - 1} older entries</p>
      )}
    </motion.section>
  );
}
