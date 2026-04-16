import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useMoodsContext, MOOD_OPTIONS } from "../context/MoodsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import { tapAnim } from "../utils/motion";

function moodMeta(value) {
  return MOOD_OPTIONS.find((m) => m.value === value) ?? { emoji: "•", label: value, color: "var(--text-soft)" };
}

function formatDate(raw) {
  const d = new Date(raw);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function Moods() {
  const {
    moods,
    loading,
    todaysMood,
    selectedMood,
    setSelectedMood,
    note,
    setNote,
    submitting,
    handleLog,
    handleDelete,
  } = useMoodsContext();
  const { isGuest } = useAuth();

  return (
    <PageShell>
      <SectionHeader
        kicker="Wellbeing"
        title="Mood"
        subtitle="A quick daily check-in. How you feel shapes how you work."
      />

      {isGuest && (
        <div className="guest-prompt">
          <p>Sign in to log your mood daily and track your wellbeing over time.</p>
          <div className="guest-prompt-actions">
            <Link to="/register" className="guest-prompt-btn guest-prompt-btn--primary">Sign up free</Link>
            <Link to="/login" className="guest-prompt-btn">Log in</Link>
          </div>
        </div>
      )}

      <motion.div
        className="feature-page moods-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        {/* ── Quick log ── */}
        <div className="tasks-page-toolbar">
          {todaysMood ? (
            <div className="mood-today-logged">
              <span className="mood-today-emoji">{moodMeta(todaysMood.mood).emoji}</span>
              <div>
                <p className="mood-today-label">Today you logged: <strong>{moodMeta(todaysMood.mood).label}</strong></p>
                {todaysMood.note && <p className="mood-today-note">"{todaysMood.note}"</p>}
              </div>
            </div>
          ) : (
            <form className="mood-log-form" onSubmit={handleLog}>
              <p className="mood-log-prompt">How are you feeling today?</p>
              <div className="mood-quick-btns">
                {MOOD_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    className={`mood-quick-btn${selectedMood === opt.value ? " active" : ""}`}
                    style={{ "--mood-color": opt.color }}
                    onClick={() => setSelectedMood(selectedMood === opt.value ? null : opt.value)}
                    title={opt.label}
                    {...tapAnim}
                  >
                    <span className="mood-quick-emoji">{opt.emoji}</span>
                    <span className="mood-quick-label">{opt.label}</span>
                  </motion.button>
                ))}
              </div>
              {selectedMood && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mood-note-row"
                >
                  <input
                    className="task-input"
                    type="text"
                    placeholder="Add a note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <motion.button
                    className="task-add-btn"
                    type="submit"
                    disabled={submitting}
                    {...tapAnim}
                  >
                    {submitting ? "Logging…" : "Log mood"}
                  </motion.button>
                </motion.div>
              )}
            </form>
          )}
        </div>

        {/* ── History ── */}
        <div className="tasks-page-list-wrap">
          {loading ? (
            <p className="tasks-page-empty">Loading…</p>
          ) : moods.length === 0 ? (
            <p className="tasks-page-empty">No mood entries yet. Log your first one above.</p>
          ) : (
            <ul className="task-list">
              <AnimatePresence>
                {moods.map((entry) => {
                  const meta = moodMeta(entry.mood);
                  return (
                    <motion.li
                      key={entry._id}
                      className="mood-history-item"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mood-history-left">
                        <span
                          className="mood-history-emoji"
                          style={{ color: meta.color }}
                        >
                          {meta.emoji}
                        </span>
                        <div className="mood-history-info">
                          <span className="mood-history-label" style={{ color: meta.color }}>
                            {meta.label}
                          </span>
                          {entry.note && (
                            <span className="mood-history-note">"{entry.note}"</span>
                          )}
                          <span className="mood-history-date">
                            {formatDate(entry.date ?? entry.createdAt)}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        className="task-delete-btn"
                        onClick={() => handleDelete(entry._id)}
                        title="Delete"
                        {...tapAnim}
                      >
                        ×
                      </motion.button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </motion.div>
    </PageShell>
  );
}
