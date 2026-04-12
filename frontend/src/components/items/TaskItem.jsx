import { useState } from "react";
import { motion } from "motion/react";

export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  function handleSave() {
    if (draft.trim()) onEdit(task.id, draft);
    setEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") { setDraft(task.text); setEditing(false); }
  }

  return (
    <motion.li
      className="task-item"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      {editing ? (
        <>
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
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            ✓
          </motion.button>
          <motion.button
            className="task-cancel-btn"
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setDraft(task.text); setEditing(false); }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            ✕
          </motion.button>
        </>
      ) : (
        <>
          <label className="task-left">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id)}
            />
            <span className={task.completed ? "task-text completed" : "task-text"}>
              {task.text}
            </span>
          </label>

          <motion.button
            className="task-edit-btn"
            type="button"
            onClick={() => { setDraft(task.text); setEditing(true); }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Edit
          </motion.button>

          <motion.button
            className="task-delete-btn"
            type="button"
            onClick={() => onDelete(task.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Delete
          </motion.button>
        </>
      )}
    </motion.li>
  );
}
