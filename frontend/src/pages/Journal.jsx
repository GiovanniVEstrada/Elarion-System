import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useJournalContext } from "../context/JournalContext";
import PageShell from "../components/layout/PageShell";
import SkeletonList from "../components/SkeletonList";
import { tapAnim, hoverAnim } from "../utils/motion";

const MOOD_OPTIONS = [
  { value: 1, name: "Restless", color: "#ff6b6b" },
  { value: 2, name: "Tender",   color: "#b58cff" },
  { value: 3, name: "Still",    color: "#7ef0d3" },
  { value: 4, name: "Open",     color: "#74d8ff" },
  { value: 5, name: "Rising",   color: "#4ecdc4" },
];

const MENTAL_STATES = ["focused", "calm", "creative", "tired", "scattered", "anxious", "energized"];

const MOOD_TO_STATE = {
  5: { label: "RISING",   color: "#4ecdc4" },
  4: { label: "OPEN",     color: "#74d8ff" },
  3: { label: "STILL",    color: "#7ef0d3" },
  2: { label: "TENDER",   color: "#b58cff" },
  1: { label: "RESTLESS", color: "#ff6b6b" },
  great:   { label: "RISING",   color: "#4ecdc4" },
  good:    { label: "OPEN",     color: "#74d8ff" },
  neutral: { label: "STILL",    color: "#7ef0d3" },
  bad:     { label: "TENDER",   color: "#b58cff" },
  awful:   { label: "RESTLESS", color: "#ff6b6b" },
};

function moodMeta(value) {
  return MOOD_OPTIONS.find((o) => o.value === value) ?? {
    value: null, name: "Open", color: "rgba(140,168,179,0.5)",
  };
}

function formatEntryStamp(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
    const existing = groups.find((g) => g.key === key);
    if (existing) existing.entries.push(entry);
    else groups.push({ key, entries: [entry] });
    return groups;
  }, []);
}

// ── SwipeRow ───────────────────────────────────────────────────────────────

function SwipeRow({ onDelete, children }) {
  const [swiped, setSwiped] = useState(false);
  const touchStartX         = useRef(null);

  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 48)  setSwiped(true);
    if (delta < -24) setSwiped(false);
    touchStartX.current = null;
  }

  return (
    <div className="log-entry-wrap">
      <motion.div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        animate={{ x: swiped ? -80 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {swiped && (
          <motion.div
            className="log-entry-actions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="log-action-btn log-action-btn--delete"
              type="button"
              onClick={onDelete}
              aria-label="Delete entry"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TimelineEntry ──────────────────────────────────────────────────────────

function TimelineEntry({ entry, expanded, onToggle, onDelete, handleUpdateEntry }) {
  const [editTitle, setEditTitle] = useState(entry.title || "");
  const [editBody,  setEditBody]  = useState(entry.content || "");

  const state = MOOD_TO_STATE[entry.mood] ?? moodMeta(entry.mood);

  useEffect(() => {
    if (!expanded) {
      setEditTitle(entry.title || "");
      setEditBody(entry.content || "");
    }
  }, [expanded, entry.title, entry.content]);

  async function handleSave() {
    await handleUpdateEntry(entry._id, {
      title:   editTitle.trim() || "Untitled Note",
      content: editBody.trim(),
    });
    onToggle();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  }

  return (
    <motion.article
      role="button"
      tabIndex={0}
      className={["reflect-log-entry", expanded && "reflect-log-entry--expanded"].filter(Boolean).join(" ")}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      style={{ "--mood-color": state.color }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      {...hoverAnim}
      {...tapAnim}
    >
      <span className="reflect-log-dot" />
      <span className="glass-card reflect-log-card">
        <span className="reflect-log-topline">
          <span>{formatEntryStamp(entry.createdAt)}</span>
          <span className="reflect-log-state">{state.label}</span>
        </span>
        {entry.title     && <strong className="reflect-log-title">{entry.title}</strong>}
        {entry.content   && <span className="reflect-log-body">{entry.content}</span>}
        {entry.mentalState && <span className="reflect-log-mental">{entry.mentalState}</span>}

        {expanded && (
          <div
            className="tl-edit-fields"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <input
              className="tl-edit-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title..."
            />
            <textarea
              className="tl-edit-body"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={4}
            />
            <div className="tl-edit-meta">
              <span className="tl-edit-stats">
                <span className="tl-edit-mood-mini">
                  <span className="tl-edit-mood-mini-dot" />
                  {state.label}
                </span>
                {entry.clarity != null && <span>Clarity · {entry.clarity}</span>}
                {entry.mentalState     && <span>{entry.mentalState}</span>}
              </span>
              <span className="tl-edit-actions">
                <button
                  type="button"
                  className="tl-edit-btn delete"
                  onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="tl-edit-btn save"
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                >
                  Save
                </button>
              </span>
            </div>
            <p className="tl-edit-hint">Editing in place. Your draft above is untouched.</p>
          </div>
        )}
      </span>
    </motion.article>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Journal() {
  const [showMeta,    setShowMeta]    = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);
  const [fabOpen,     setFabOpen]     = useState(false);
  const editorRef = useRef(null);
  const titleRef  = useRef(null);

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
    handleAddEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    stopEditing,
    refetch,
  } = useJournalContext();

  const groupedEntries = useMemo(
    () => groupEntriesByDate(filteredEntries),
    [filteredEntries]
  );

  useEffect(() => {
    stopEditing();
    // Keep the compose card additive if the old edit flow left state behind.
  }, []);

  function handleEntryToggle(entryId) {
    setExpandedId((prev) => (prev === entryId ? null : entryId));
  }

  useEffect(() => {
    if (!fabOpen) return;
    window.requestAnimationFrame(() => titleRef.current?.focus());
  }, [fabOpen]);

  async function handleJournalSubmit(e) {
    const hasDraft = title.trim() || content.trim();
    await handleAddEntry(e);
    if (hasDraft) setFabOpen(false);
  }

  if (loading) return (
    <PageShell>
      <motion.header className="journal-hero tide-hero">
        <p className="journal-hero-kicker tide-hero-kicker">Reflection Log</p>
        <h1 className="journal-hero-title tide-hero-title">What you noticed</h1>
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
        className="journal-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="journal-hero-kicker tide-hero-kicker">{entries.length} entries</p>
        <h1 className="journal-hero-title tide-hero-title">What you noticed</h1>
      </motion.header>

      <motion.div
        className="journal-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.38 }}
      >
        {/* ── Compose card ── */}
        <section className="journal-top-controls">
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
                name="journal-folder-name"
                className="journal-folder-new-input"
                autoFocus
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFolder();
                  if (e.key === "Escape") { setAddingFolder(false); setNewFolderName(""); }
                }}
                onBlur={handleAddFolder}
              />
            )}

            <div className="journal-folder-track" aria-label="Journal folders">
              <button
                type="button"
                className={`journal-folder-item ${activeFolderId === null ? "active" : ""}`}
                onClick={() => setActiveFolderId(null)}
              >
                <span>All</span>
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
          </div>

          <input
            name="journal-search"
            className="journal-search-input"
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </section>

        <AnimatePresence>
          {fabOpen && (
            <>
              <motion.div
                className="fab-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setFabOpen(false)}
              />
              <motion.div
                className="fab-panel journal-compose-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
          <section className="tide-panel journal-editor-card" ref={editorRef}>
            <div className="journal-card-heading">
              <div>
                <p>New entry</p>
                <h2>Write what is true</h2>
              </div>
              {(title || content) && (
                <span className="journal-draft-pill">Draft</span>
              )}
            </div>

            <form className="journal-page-form" onSubmit={handleJournalSubmit}>
              <input
                ref={titleRef}
                name="journal-title"
                className="journal-title-input"
                type="text"
                placeholder="Entry title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
              />

              <textarea
                name="journal-content"
                className="journal-textarea journal-page-textarea"
                placeholder="Let the record be quiet and exact..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="10"
              />

              <div className="journal-meta-pickers">
                <div className="picker-group">
                  <span className="picker-label">Mood</span>
                  <div className="mood-orbs">
                    {MOOD_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`mood-orb${mood === o.value ? " active" : ""}`}
                        style={{ "--mood-color": o.color }}
                        onClick={() => setMood(mood === o.value ? null : o.value)}
                        aria-label={o.name}
                      >
                        <span className="mood-orb-dot" />
                        <span className="mood-orb-name">{o.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="journal-meta-toggle"
                  onClick={() => setShowMeta((v) => !v)}
                >
                  {showMeta ? "Hide context ↑" : "Add context ↓"}
                </button>

                <div className={`journal-meta-extra${showMeta ? "" : " journal-meta-extra--hidden"}`}>
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
              </div>

              <div className="journal-form-actions">
                <motion.button
                  className="journal-add-btn"
                  type="submit"
                  whileHover={{ y: -1, scale: 1.01 }}
                  {...tapAnim}
                >
                  Save Note
                </motion.button>
              </div>
            </form>
          </section>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Sidebar with past entries ── */}
        <section className="journal-history">
          <p className="journal-past-entries-kicker">Past entries</p>

          <div className="reflect-log-timeline">
            <AnimatePresence>
              {filteredEntries.length === 0 ? (
                <div className="journal-empty journal-empty--compact">
                  <p className="journal-empty-headline">
                    {searchQuery ? "No echo here." : "No pages yet."}
                  </p>
                  <p className="journal-empty-sub">
                    {searchQuery ? "Try a softer search." : "Write your first note above."}
                  </p>
                </div>
              ) : (
                groupedEntries.map((group) => (
                  <div className="reflect-log-group" key={group.key}>
                    <div className="reflect-log-date-row">
                      <span>{group.key}</span>
                    </div>
                    {group.entries.map((entry) => (
                      <SwipeRow
                        key={entry._id}
                        onDelete={() => handleDeleteEntry(entry._id)}
                      >
                        <TimelineEntry
                          entry={entry}
                          expanded={expandedId === entry._id}
                          onToggle={() => handleEntryToggle(entry._id)}
                          onDelete={handleDeleteEntry}
                          handleUpdateEntry={handleUpdateEntry}
                        />
                      </SwipeRow>
                    ))}
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>

      <motion.button
        className={`task-fab${fabOpen ? " task-fab--open" : ""}`}
        type="button"
        aria-label={fabOpen ? "Close new entry" : "New journal entry"}
        onClick={() => setFabOpen((open) => !open)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <motion.span
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: "block", lineHeight: 1 }}
        >
          +
        </motion.span>
      </motion.button>
    </PageShell>
  );
}
