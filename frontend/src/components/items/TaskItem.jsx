import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const ENERGY_COLORS = { low: "#64dc82", medium: "#ffc83c", high: "#ff5a5a" };
const ALIGNMENT_OPTIONS = [
  { score: 1, label: "Off",     cls: "alignment-btn--off"     },
  { score: 2, label: "Neutral", cls: "alignment-btn--neutral" },
  { score: 3, label: "Aligned", cls: "alignment-btn--aligned" },
];
const ALIGNMENT_LABELS  = { 1: "Off", 2: "Neutral", 3: "Aligned" };
const ALIGNMENT_CLASSES = { 1: "alignment-badge--off", 2: "alignment-badge--neutral", 3: "alignment-badge--aligned" };

export default function TaskItem({ task, onToggle, onDelete, onEdit, onRate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [showRating, setShowRating] = useState(false);

  function handleSave() {
    if (draft.trim()) onEdit(task._id, draft);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter")  handleSave();
    if (e.key === "Escape") { setDraft(task.title); setEditing(false); }
  }

  function handleCheck() {
    if (!task.completed) {
      setShowRating(true);
    } else {
      onToggle(task._id);
    }
  }

  function handleRate(score) {
    onRate(task._id, score);
    onToggle(task._id);
    setShowRating(false);
  }

  function handleSkipRating() {
    onToggle(task._id);
    setShowRating(false);
  }

  if (editing) {
    return (
      <motion.li
        className="task-item"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <input
          className="task-edit-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
        />
        <motion.button
          className="task-save-btn"
          type="button"
          aria-label="Save"
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          ✓
        </motion.button>
        <motion.button
          className="task-cancel-btn"
          type="button"
          aria-label="Cancel"
          onMouseDown={(e) => { e.preventDefault(); setDraft(task.title); setEditing(false); }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          ✕
        </motion.button>
      </motion.li>
    );
  }

  if (showRating) {
    return (
      <motion.li
        className="task-item task-item--rating"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <div className="task-rating-top">
          {task.energyLevel && (
            <span className="task-energy-dot" style={{ background: ENERGY_COLORS[task.energyLevel] }} />
          )}
          <span className="task-text">{task.title}</span>
        </div>
        <div className="task-rating-row">
          <span className="alignment-prompt-label">Was this aligned?</span>
          <div className="alignment-options">
            {ALIGNMENT_OPTIONS.map(({ score, label, cls }) => (
              <button
                key={score}
                type="button"
                className={`alignment-btn ${cls}`}
                onClick={() => handleRate(score)}
              >
                {label}
              </button>
            ))}
            <button type="button" className="alignment-skip" onClick={handleSkipRating}>
              skip
            </button>
          </div>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li
      className="task-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      <label className="task-left">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheck}
        />
        <span className="task-content">
          {task.energyLevel && (
            <span className="task-energy-dot" style={{ background: ENERGY_COLORS[task.energyLevel] }} />
          )}
          <span className={task.completed ? "task-text completed" : "task-text"}>
            {task.title}
          </span>
        </span>
      </label>

      {task.intent && (
        <span className="task-intent">{task.intent}</span>
      )}

      <div className="task-actions">
        <AnimatePresence>
          {task.completed && task.alignmentScore && (
            <motion.span
              key="badge"
              className={`alignment-badge ${ALIGNMENT_CLASSES[task.alignmentScore]}`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
            >
              {ALIGNMENT_LABELS[task.alignmentScore]}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          className="task-edit-btn"
          type="button"
          onClick={() => { setDraft(task.title); setEditing(true); }}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Edit
        </motion.button>

        <motion.button
          className="task-delete-btn"
          type="button"
          onClick={() => onDelete(task._id)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          Delete
        </motion.button>
      </div>
    </motion.li>
  );
}
