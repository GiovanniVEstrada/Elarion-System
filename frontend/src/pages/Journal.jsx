import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJournalContext } from "../context/JournalContext";
import PageShell from "../components/layout/PageShell";
import JournalEntry from "../components/items/JournalEntry";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

const MOOD_OPTIONS = [
  { value: 1, label: "Low", color: "#ff6b6b" },
  { value: 2, label: "Heavy", color: "#ff9f43" },
  { value: 3, label: "Even", color: "#ffd166" },
  { value: 4, label: "Light", color: "#7bd88f" },
  { value: 5, label: "Bright", color: "#4ecdc4" },
];

const MENTAL_STATES = ["focused", "calm", "creative", "tired", "scattered", "anxious", "energized"];

const MOOD_TO_STATE = {
  5: { label: "RISING", color: "#4ecdc4" },
  4: { label: "OPEN", color: "#74d8ff" },
  3: { label: "STILL", color: "#7ef0d3" },
  2: { label: "TENDER", color: "#b58cff" },
  1: { label: "RESTLESS", color: "#ff6b6b" },
  great: { label: "RISING", color: "#4ecdc4" },
  good: { label: "OPEN", color: "#74d8ff" },
  neutral: { label: "STILL", color: "#7ef0d3" },
  bad: { label: "TENDER", color: "#b58cff" },
  awful: { label: "RESTLESS", color: "#ff6b6b" },
};

function moodMeta(value) {
  return MOOD_OPTIONS.find((option) => option.value === value) ?? {
    value: null,
    label: "Open",
    color: "rgba(140, 168, 179, 0.5)",
  };
}

function formatEntryStamp(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGroupDate(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

function groupEntriesByDate(entries) {
  return entries.reduce((groups, entry) => {
    const key = formatGroupDate(entry.createdAt) || "UNDATED";
    const existing = groups.find((group) => group.key === key);
    if (existing) existing.entries.push(entry);
    else groups.push({ key, entries: [entry] });
    return groups;
  }, []);
}

export default function Journal() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const editorRef = useRef(null);
  const titleRef = useRef(null);

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

  const groupedEntries = useMemo(
    () => groupEntriesByDate(filteredEntries),
    [filteredEntries]
  );

  function focusNewEntry() {
    stopEditing();
    setSelectedId(null);
    setShowSidebar(false);
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      titleRef.current?.focus();
    });
  }

  function toggleEntry(entryId) {
    setSelectedId(entryId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }

  if (loading) return (
    <PageShell>
      <motion.header className="journal-hero">
        <p className="journal-hero-kicker">Reflection Log</p>
        <h1 className="journal-hero-title">What you noticed</h1>
      </motion.header>
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
      <motion.header
        className="journal-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="journal-hero-kicker">{entries.length} entries</p>
        <h1 className="journal-hero-title">What you noticed</h1>
      </motion.header>

      <motion.div
        className="journal-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
      >
        <button
          type="button"
          className="journal-sidebar-toggle"
          onClick={() => setShowSidebar((s) => !s)}
        >
          {showSidebar ? "Hide notes" : "Browse notes"}
        </button>

        <aside className={`journal-sidebar${showSidebar ? "" : " journal-sidebar-hidden"}`}>
          <div className="journal-folders">
            <div className="journal-folders-header">
              <h3>Folders</h3>
              <button
                className="journal-folder-add-btn"
                type="button"
                onClick={() => setAddingFolder(true)}
                aria-label="Add folder"
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
                  if (e.key === "Escape") {
                    setAddingFolder(false);
                    setNewFolderName("");
                  }
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
                    aria-label={`Delete ${folder.name}`}
                  >
                    x
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

          <div className="reflect-log-timeline">
            <AnimatePresence>
              {filteredEntries.length === 0 ? (
                <div className="journal-empty journal-empty--compact">
                  <p className="journal-empty-headline">
                    {searchQuery ? "No echo here." : "No pages yet."}
                  </p>
                  <p className="journal-empty-sub">
                    {searchQuery ? "Try a softer search." : "Start a note with the + button."}
                  </p>
                </div>
              ) : (
                groupedEntries.map((group) => (
                  <div className="reflect-log-group" key={group.key}>
                    <div className="reflect-log-date-row">
                      <span>{group.key}</span>
                    </div>
                    {group.entries.map((entry) => {
                      const state = MOOD_TO_STATE[entry.mood] ?? moodMeta(entry.mood);
                      const expanded = expandedIds.has(entry._id);
                      return (
                        <motion.button
                          key={entry._id}
                          type="button"
                          className={[
                            "reflect-log-entry",
                            expanded && "reflect-log-entry--expanded",
                            selectedId === entry._id || (!selectedId && selectedEntry?._id === entry._id)
                              ? "active"
                              : "",
                          ].filter(Boolean).join(" ")}
                          onClick={() => toggleEntry(entry._id)}
                          style={{ "--mood-color": state.color }}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -12, scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                          {...hoverAnim}
                          {...tapAnim}
                        >
                          <span className="reflect-log-dot" />
                          <span className="reflect-log-card">
                            <span className="reflect-log-topline">
                              <span>{formatEntryStamp(entry.createdAt)}</span>
                              <span className="reflect-log-state">{state.label}</span>
                            </span>
                            {entry.title && (
                              <strong className="reflect-log-title">{entry.title}</strong>
                            )}
                            {entry.content && (
                              <span className="reflect-log-body">{entry.content}</span>
                            )}
                            {entry.mentalState && (
                              <span className="reflect-log-mental">{entry.mentalState}</span>
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </aside>

        <div className="journal-editor-wrap">
          <section className="journal-editor-card" ref={editorRef}>
            <div className="journal-card-heading">
              <p>{editingId ? "Revision" : "New entry"}</p>
              <h2>{editingId ? "Return to the note" : "Write what is true"}</h2>
            </div>

            <form className="journal-page-form" onSubmit={handleAddEntry}>
              <input
                ref={titleRef}
                className="journal-title-input"
                type="text"
                placeholder="Entry title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <textarea
                className="journal-textarea journal-page-textarea"
                placeholder="Let the record be quiet and exact..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="10"
              />

              <div className="journal-meta-pickers">
                <div className="picker-group">
                  <span className="picker-label">Mood</span>
                  <div className="mood-picker">
                    {MOOD_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`mood-btn${mood === option.value ? " active" : ""}`}
                        onClick={() => setMood(mood === option.value ? null : option.value)}
                        style={{ "--mood-color": option.color }}
                        aria-label={option.label}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="picker-group">
                  <span className="picker-label">Clarity</span>
                  <div className="clarity-picker">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`clarity-dot${clarity >= n ? " filled" : ""}`}
                        onClick={() => setClarity(clarity === n ? null : n)}
                        aria-label={`Clarity ${n}`}
                      />
                    ))}
                  </div>
                </div>

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
                  onChange={(e) => setActiveFolderId(e.target.value || null)}
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="journal-form-actions">
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
          </section>

          <section className="journal-preview-card">
            <div className="journal-card-heading">
              <p>Selected note</p>
              <h2>Held in view</h2>
            </div>

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
                <motion.div
                  key="empty"
                  className="journal-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="journal-empty-headline">A blank page waits.</p>
                  <p className="journal-empty-sub">Select a note or begin a new record.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </motion.div>

      <motion.button
        className="journal-fab"
        type="button"
        aria-label="New journal entry"
        onClick={focusNewEntry}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        +
      </motion.button>
    </PageShell>
  );
}
