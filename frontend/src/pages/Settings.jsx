import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function Settings() {
  const { user, updateUser, logout, deleteAccount } = useAuth();

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
      // silent — browser shows download error natively
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
    <div className="feature-page">
      <motion.div
        className="feature-page-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1>Settings</h1>
        <p>Manage your account and data.</p>
      </motion.div>

      <div className="settings-sections">

        {/* ── Profile ── */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          <h2 className="settings-card-title">Profile</h2>

          <p className="settings-meta">
            <span className="settings-label">Email</span>
            <span className="settings-value">{user?.email}</span>
          </p>

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
              {nameSaving ? "Saving…" : "Save name"}
            </button>
          </form>
        </motion.section>

        {/* ── Password ── */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <h2 className="settings-card-title">Change Password</h2>

          <form className="settings-form" onSubmit={handleChangePassword}>
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
            <button className="settings-btn" type="submit" disabled={pwSaving}>
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </form>
        </motion.section>

        {/* ── Data ── */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <h2 className="settings-card-title">Your Data</h2>
          <p className="settings-desc">
            Download all your tasks, habits, journal entries, and moods as a JSON file.
          </p>
          <button className="settings-btn" onClick={handleExport} disabled={exporting}>
            {exporting ? "Preparing…" : "Export data"}
          </button>
        </motion.section>

        {/* ── Account ── */}
        <motion.section
          className="settings-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <h2 className="settings-card-title">Account</h2>
          <button
            className="settings-btn settings-btn--ghost"
            onClick={logout}
          >
            Sign out
          </button>
        </motion.section>

        {/* ── Danger Zone ── */}
        <motion.section
          className="settings-card settings-card--danger"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <h2 className="settings-card-title settings-card-title--danger">Danger Zone</h2>
          <p className="settings-desc">
            Permanently delete your account and all data. This cannot be undone.
          </p>

          {deleteStep === 0 && (
            <button
              className="settings-btn settings-btn--danger"
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
                className="settings-input settings-input--danger"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                autoFocus
              />
              <div className="settings-delete-actions">
                <button
                  className="settings-btn settings-btn--ghost"
                  onClick={() => { setDeleteStep(0); setDeleteConfirm(""); }}
                >
                  Cancel
                </button>
                <button
                  className="settings-btn settings-btn--danger"
                  disabled={deleteConfirm !== "DELETE" || deleteLoading}
                  onClick={handleDelete}
                >
                  {deleteLoading ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          )}
        </motion.section>

      </div>
    </div>
  );
}
