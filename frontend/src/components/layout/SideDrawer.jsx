import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { getInitial, NAV_ITEMS } from "./navItems";

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function SideDrawer({ onClose, onLogout, user }) {
  const drawerRef = useRef(null);

  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    // Focus first focusable element on open
    const first = el.querySelector(FOCUSABLE);
    first?.focus();

    function handleTab(e) {
      if (e.key !== "Tab") return;
      const nodes = Array.from(el.querySelectorAll(FOCUSABLE));
      if (!nodes.length) return;
      const firstNode = nodes[0];
      const lastNode  = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === firstNode) {
          e.preventDefault();
          lastNode.focus();
        }
      } else {
        if (document.activeElement === lastNode) {
          e.preventDefault();
          firstNode.focus();
        }
      }
    }

    el.addEventListener("keydown", handleTab);
    return () => el.removeEventListener("keydown", handleTab);
  }, []);

  return (
    <>
      <motion.button
        className="side-drawer-scrim"
        type="button"
        aria-label="Close navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.aside
        ref={drawerRef}
        className="side-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        initial={{ x: "-104%" }}
        animate={{ x: 0 }}
        exit={{ x: "-104%" }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="side-drawer-profile">
          <div className="side-drawer-avatar">{getInitial(user)}</div>
          <div>
            <strong>{user?.name || "Luren"}</strong>
            <span>{user ? "Tide account" : "Sign in to sync your tide"}</span>
          </div>
        </div>

        <nav className="side-drawer-links" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ to, label, detail, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? "side-drawer-link active" : "side-drawer-link"
              }
              onClick={onClose}
            >
              <span className="side-drawer-icon">{icon}</span>
              <span className="side-drawer-label">{label}</span>
              <span className="side-drawer-detail">{detail}</span>
            </NavLink>
          ))}
        </nav>

        <div className="side-drawer-footer">
          <span>Luren V0.2.0</span>
          {user ? (
            <button type="button" onClick={onLogout}>Sign out</button>
          ) : (
            <Link to="/register" onClick={onClose}>Create account</Link>
          )}
        </div>
      </motion.aside>
    </>
  );
}
