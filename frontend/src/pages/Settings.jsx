import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useHabitsContext } from "../context/HabitsContext";
import PageShell from "../components/layout/PageShell";
import client from "../api/client";

function habitStreak(habit) {
  return habit.currentStreak ?? habit.streak ?? 0;
}

export default function Settings() {
  const { user, updateUser, logout, deleteAccount } = useAuth();
  const { habits } = useHabitsContext();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [nameMsg, setNameMsg] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  const streakSummary = useMemo(() => {
    const current = habits.reduce((max, habit) => Math.max(max, habitStreak(habit)), 0);
    const active = habits.filter((habit) => habit.active !== false).length;
    const completions = habits.reduce((total, habit) => total + (habit.completedDates?.length ?? 0), 0);
    return { current, active, completions };
  }, [habits]);

  async function handleUpdateName(e) {
    e.preventDefault();
    setNameSaving(true);
    setNameMsg(null);
    try {
      await updateUser(name.trim());
      setNameMsg({ ok: true, text: "Name updated." });
    } catch {
      setNameMsg({ ok: false, text: "Failed to update name." });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSaving(true);
    setPwMsg(null);
    try {
      await client.patch("/auth/password", { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ ok: true, text: "Password updated." });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      const msg = err.response?.data?.message ?? "Failed to update password.";
      setPwMsg({ ok: false, text: msg });
    } finally {
      setPwSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const res = await client.get("/auth/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `elarion-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // The browser will surface download failures.
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await deleteAccount();
    } catch {
      setDeleteLoading(false);
      setDeleteStep(0);
    }
  }

  return (
    <PageShell>
      <motion.header
        className="settings-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="settings-hero-kicker tide-hero-kicker">Settings</p>
        <h1 className="settings-hero-title tide-hero-title">Your harbor</h1>
      </motion.header>

      <div className="settings-layout">
        <motion.section
          className="tide-panel settings-card settings-card--account"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          <div className="settings-card-heading">
            <p>Account</p>
            <h2>Identity and access</h2>
          </div>

          <div className="settings-profile-row">
            <div className="settings-avatar" aria-hidden="true">
              {(user?.name || user?.email || "E").slice(0, 1).toUpperCase()}
            </div>
            <p className="settings-meta">
              <span className="settings-label">Email</span>
              <span className="settings-value">{user?.email}</span>
            </p>
          </div>

          <form className="settings-form" onSubmit={handleUpdateName}>
            <label className="settings-label" htmlFor="settings-name">Display name</label>
            <input
              id="settings-name"
              className="settings-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
            />
            {nameMsg && (
              <p className={`settings-msg ${nameMsg.ok ? "settings-msg--ok" : "settings-msg--err"}`}>
                {nameMsg.text}
              </p>
            )}
            <button className="settings-btn" type="submit" disabled={nameSaving}>
              {nameSaving ? "Saving..." : "Save name"}
            </button>
          </form>

          <form className="settings-form settings-form--password" onSubmit={handleChangePassword}>
            <label className="settings-label" htmlFor="settings-current-pw">Current password</label>
            <input
              id="settings-current-pw"
              className="settings-input"
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
            />

            <label className="settings-label" htmlFor="settings-new-pw">New password</label>
            <input
              id="settings-new-pw"
              className="settings-input"
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={6}
              required
              autoComplete="new-password"
            />

            {pwMsg && (
              <p className={`settings-msg ${pwMsg.ok ? "settings-msg--ok" : "settings-msg--err"}`}>
                {pwMsg.text}
              </p>
            )}
            <button className="settings-btn settings-btn--ghost" type="submit" disabled={pwSaving}>
              {pwSaving ? "Updating..." : "Update password"}
            </button>
          </form>

          <button className="settings-btn settings-btn--quiet" type="button" onClick={logout}>
            Sign out
          </button>
        </motion.section>

        <div className="settings-side-stack">
          <motion.section
            className="tide-panel settings-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <div className="settings-card-heading">
              <p>Data</p>
              <h2>Your record</h2>
            </div>

            <div className="settings-streak-counter">
              <span className="settings-streak-value">{streakSummary.current}</span>
              <span className="settings-streak-label">day streak</span>
            </div>

            <div className="settings-stat-grid">
              <p>
                <span>{streakSummary.active}</span>
                active habits
              </p>
              <p>
                <span>{streakSummary.completions}</span>
                check-ins
              </p>
            </div>

            <p className="settings-desc">
              Download all your actions, habits, notes, and moods as a JSON file.
            </p>
            <button className="settings-btn" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? "Preparing..." : "Export data"}
            </button>
          </motion.section>

          <motion.section
            className="tide-panel settings-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <div className="settings-card-heading">
              <p>Focus</p>
              <h2>Alignment map</h2>
            </div>
            <p className="settings-desc">
              {user?.focusAreas?.length > 0
                ? `Aligned with: ${user.focusAreas.join(", ")}`
                : "No focus areas set yet."}
            </p>
            <button
              className="settings-btn settings-btn--ghost"
              type="button"
              onClick={() => navigate("/onboarding")}
            >
              {user?.onboardingComplete ? "Edit focus areas" : "Set up focus areas"}
            </button>
          </motion.section>
        </div>

        <motion.section
          className="tide-panel settings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.35 }}
        >
          <div className="settings-card-heading">
            <p>Legal</p>
            <h2>Privacy &amp; terms</h2>
          </div>
          <p className="settings-desc">
            Read how Luren collects, uses, and protects your data.
          </p>
          <Link to="/privacy" className="settings-btn settings-btn--ghost">
            Privacy Policy
          </Link>
        </motion.section>

        <motion.section
          className="tide-panel settings-card settings-card--danger"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <div className="settings-card-heading">
            <p>Danger zone</p>
            <h2>Close the harbor</h2>
          </div>
          <p className="settings-desc">
            Permanently delete your account and all data. This cannot be undone.
          </p>

          {deleteStep === 0 && (
            <button
              className="settings-btn settings-btn--danger"
              type="button"
              onClick={() => setDeleteStep(1)}
            >
              Delete my account
            </button>
          )}

          {deleteStep === 1 && (
            <div className="settings-delete-confirm">
              <p className="settings-delete-prompt">
                Type <strong>DELETE</strong> to confirm
              </p>
              <input
                name="settings-delete-confirm"
                className="settings-input settings-input--danger"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
              <div className="settings-delete-actions">
                <button
                  className="settings-btn settings-btn--ghost"
                  type="button"
                  onClick={() => { setDeleteStep(0); setDeleteConfirm(""); }}
                >
                  Cancel
                </button>
                <button
                  className="settings-btn settings-btn--danger"
                  type="button"
                  disabled={deleteConfirm !== "DELETE" || deleteLoading}
                  onClick={handleDelete}
                >
                  {deleteLoading ? "Deleting..." : "Confirm delete"}
                </button>
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </PageShell>
  );
}
