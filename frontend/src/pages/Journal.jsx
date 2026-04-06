import { motion } from "motion/react";
import useJournal from "../hooks/useJournal";

export default function Journal() {
  const {
    entries,
    title,
    setTitle,
    content,
    setContent,
    selectedId,
    setSelectedId,
    selectedEntry,
    handleAddEntry,
    handleDeleteEntry,
  } = useJournal();

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
        <h1>Journal</h1>
        <p>
          Build thoughts, reflections, and notes in a space that can grow into
          something deeper later.
        </p>
      </motion.div>

      <motion.div
        className="journal-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <aside className="journal-sidebar">
          <div className="journal-sidebar-header">
            <h2>Notes</h2>
            <span>{entries.length}</span>
          </div>

          <div className="journal-note-list">
            {entries.length === 0 ? (
              <p className="journal-empty">No notes yet.</p>
            ) : (
              entries.map((entry) => (
                <motion.button
                  key={entry.id}
                  type="button"
                  className={
                    selectedId === entry.id || (!selectedId && selectedEntry?.id === entry.id)
                      ? "journal-note-item active"
                      : "journal-note-item"
                  }
                  onClick={() => setSelectedId(entry.id)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <strong>{entry.title}</strong>
                  <span>{entry.createdAt}</span>
                </motion.button>
              ))
            )}
          </div>
        </aside>

        <div className="journal-editor-wrap">
          <div className="journal-editor-card">
            <h2>Create Note</h2>

            <form className="journal-page-form" onSubmit={handleAddEntry}>
              <input
                className="journal-title-input"
                type="text"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="journal-textarea journal-page-textarea"
                placeholder="Write your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="10"
              />

              <motion.button
                className="journal-add-btn"
                type="submit"
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Note
              </motion.button>
            </form>
          </div>

          <div className="journal-preview-card">
            <h2>Selected Note</h2>

            {selectedEntry ? (
              <motion.article
                className="journal-entry journal-entry-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="journal-entry-title">{selectedEntry.title}</h3>
                <p className="journal-entry-text">{selectedEntry.content}</p>

                <div className="journal-entry-footer">
                  <span className="journal-entry-date">
                    {selectedEntry.createdAt}
                  </span>

                  <motion.button
                    className="journal-delete-btn"
                    type="button"
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.article>
            ) : (
              <p className="journal-empty">Select or create a note.</p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}