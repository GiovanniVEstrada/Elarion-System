import { motion, AnimatePresence } from "motion/react";
import { useJournalContext } from "../context/JournalContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import JournalEntry from "../components/items/JournalEntry";
import { tapAnim, hoverAnim } from "../utils/motion";

export default function Journal() {
  const {
    entries,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    title,
    setTitle,
    content,
    setContent,
    selectedId,
    setSelectedId,
    editingId,
    startEditing,
    stopEditing,
    selectedEntry,
    handleAddEntry,
    handleDeleteEntry,
  } = useJournalContext();

  return (
    <PageShell>
      <SectionHeader
        kicker="Workspace"
        title="Journal"
        subtitle="Build thoughts, reflections, and notes in a space that can grow into something deeper later."
      />

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

          <input
            className="journal-search-input"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="journal-note-list">
            <AnimatePresence>
              {filteredEntries.length === 0 ? (
                <p className="journal-sidebar-empty">
                  {searchQuery ? "No notes match your search." : "No notes yet."}
                </p>
              ) : (
                filteredEntries.map((entry) => (
                  <motion.button
                    key={entry.id}
                    type="button"
                    className={
                      selectedId === entry.id || (!selectedId && selectedEntry?.id === entry.id)
                        ? "journal-note-item active"
                        : "journal-note-item"
                    }
                    onClick={() => setSelectedId(entry.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    {...hoverAnim}
                    {...tapAnim}
                  >
                    <strong>{entry.title}</strong>
                    {entry.content && (
                      <p className="journal-note-preview">{entry.content}</p>
                    )}
                    <span>{entry.createdAt}</span>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>
        </aside>

        <div className="journal-editor-wrap">
          <div className="journal-editor-card">
            <h2>{editingId ? "Edit Note" : "Create Note"}</h2>

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

              <div style={{ display: "flex", gap: "10px" }}>
                <motion.button
                  className="journal-add-btn"
                  type="submit"
                  whileHover={{ y: -1, scale: 1.01 }}
                  {...tapAnim}
                >
                  {editingId ? "Save Changes" : "Save Note"}
                </motion.button>

                {editingId && (
                  <motion.button
                    className="journal-cancel-btn"
                    type="button"
                    onClick={stopEditing}
                    {...hoverAnim}
                    {...tapAnim}
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </form>
          </div>

          <div className="journal-preview-card">
            <h2>Selected Note</h2>

            <AnimatePresence mode="wait">
              {selectedEntry ? (
                <JournalEntry
                  key={selectedEntry.id}
                  entry={selectedEntry}
                  onDelete={handleDeleteEntry}
                  onEdit={startEditing}
                  className="journal-entry journal-entry-full"
                />
              ) : (
                <motion.p
                  key="empty"
                  className="journal-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Select or create a note.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
}
