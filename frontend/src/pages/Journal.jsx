import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJournalContext } from "../context/JournalContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import JournalEntry from "../components/items/JournalEntry";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

export default function Journal() {
  const [showSidebar, setShowSidebar] = useState(false);
  const {
    entries,
    filteredEntries,
    loading,
    error,
    folders,
    activeFolderId,
    setActiveFolderId,
    addingFolder,
    setAddingFolder,
    newFolderName,
    setNewFolderName,
    handleAddFolder,
    handleDeleteFolder,
    searchQuery,
    setSearchQuery,
    title,
    setTitle,
    content,
    setContent,
    mood,
    setMood,
    clarity,
    setClarity,
    mentalState,
    setMentalState,
    selectedId,
    setSelectedId,
    editingId,
    startEditing,
    stopEditing,
    selectedEntry,
    handleAddEntry,
    handleDeleteEntry,
    refetch,
  } = useJournalContext();

  const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];
  const MENTAL_STATES = ["focused", "calm", "creative", "tired", "scattered", "anxious", "energized"];

  if (loading) return (
    <PageShell>
      <SectionHeader
        kicker="Workspace"
        title="Reflection Log"
        subtitle="Capture thoughts and notes — a space where patterns emerge over time."
      />
      <SkeletonList count={5} />
    </PageShell>
  );

  if (error) return (
    <PageShell>
      <div className="page-error">
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      <SectionHeader
        kicker="Workspace"
        title="Reflection Log"
        subtitle="Capture thoughts and notes — a space where patterns emerge over time."
      />

      <motion.div
        className="journal-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <button
          type="button"
          className="journal-sidebar-toggle"
          onClick={() => setShowSidebar((s) => !s)}
        >
          {showSidebar ? "▲ Hide notes" : "▼ Browse notes"}
        </button>

        <aside className={`journal-sidebar${showSidebar ? "" : " journal-sidebar-hidden"}`}>

          {/* Folders */}
          <div className="journal-folders">
            <div className="journal-folders-header">
              <h3>Folders</h3>
              <button
                className="journal-folder-add-btn"
                type="button"
                onClick={() => setAddingFolder(true)}
              >
                +
              </button>
            </div>

            {addingFolder && (
              <input
                className="journal-folder-new-input"
                autoFocus
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") { setAddingFolder(false); setNewFolderName(""); }
                }}
                onBlur={handleAddFolder}
              />
            )}

            <button
              type="button"
              className={`journal-folder-item ${activeFolderId === null ? "active" : ""}`}
              onClick={() => setActiveFolderId(null)}
            >
              <span>All Notes</span>
              <span className="journal-folder-count">{entries.length}</span>
            </button>

            {folders.map((folder) => {
              const count = entries.filter((e) => e.folder === folder.id).length;
              return (
                <div key={folder.id} className="journal-folder-row">
                  <button
                    type="button"
                    className={`journal-folder-item ${activeFolderId === folder.id ? "active" : ""}`}
                    onClick={() => setActiveFolderId(folder.id)}
                  >
                    <span>{folder.name}</span>
                    <span className="journal-folder-count">{count}</span>
                  </button>
                  <button
                    type="button"
                    className="journal-folder-delete-btn"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
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
                    key={entry._id}
                    type="button"
                    className={
                      selectedId === entry._id || (!selectedId && selectedEntry?._id === entry._id)
                        ? "journal-note-item active"
                        : "journal-note-item"
                    }
                    onClick={() => setSelectedId(entry._id)}
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
                    {activeFolderId === null && entry.folder && (
                      <span className="journal-note-folder-pill">
                        {entry.folder}
                      </span>
                    )}
                    <span>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ""}</span>
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

              <div className="journal-meta-pickers">
                {/* Mood */}
                <div className="picker-group">
                  <span className="picker-label">Mood</span>
                  <div className="mood-picker">
                    {MOOD_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`mood-btn${mood === i + 1 ? " active" : ""}`}
                        onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clarity */}
                <div className="picker-group">
                  <span className="picker-label">Clarity</span>
                  <div className="clarity-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`clarity-dot${clarity >= n ? " filled" : ""}`}
                        onClick={() => setClarity(clarity === n ? null : n)}
                      />
                    ))}
                  </div>
                </div>

                {/* Mental state */}
                <div className="picker-group">
                  <span className="picker-label">State</span>
                  <div className="mental-state-picker">
                    {MENTAL_STATES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`mental-state-tag${mentalState === s ? " active" : ""}`}
                        onClick={() => setMentalState(mentalState === s ? null : s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {folders.length > 0 && (
                <select
                  className="journal-folder-select"
                  value={activeFolderId ?? ""}
                  onChange={(e) =>
                    setActiveFolderId(e.target.value || null)
                  }
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

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
                  key={selectedEntry._id}
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
