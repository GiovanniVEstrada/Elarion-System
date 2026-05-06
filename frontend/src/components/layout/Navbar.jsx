import { useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Today", detail: "Calendar", icon: "◐", end: true },
  { to: "/calendar", label: "Month", detail: "Pool grid", icon: "▦", end: false },
  { to: "/tasks", label: "Actions", detail: "Active", icon: "✓", end: false },
  { to: "/journal", label: "Reflect Log", detail: "Entries", icon: "✎", end: false },
  { to: "/reflect", label: "Insights", detail: "Weekly", icon: "✦", end: false },
  { to: "/settings", label: "Settings", detail: "Account", icon: "⚙", end: false },
];

const ROUTE_TITLES = {
  "/": "Thursday · Apr 30",
  "/calendar": "Calendar",
  "/tasks": "Actions",
  "/journal": "Reflect Log",
  "/reflect": "Insights",
  "/settings": "Settings",
};

function getInitial(user) {
  return (user?.name || user?.email || "M").slice(0, 1).toUpperCase();
}

export default function Navbar() {
  const { user, isGuest, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const topTitle = ROUTE_TITLES[location.pathname] ?? "Elarion";

  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <>
      <motion.header
        className="app-top-chrome"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <button
          className="nav-menu-btn"
          type="button"
          aria-label="Open navigation"
          onClick={() => setDrawerOpen(true)}
        >
          ≋
        </button>
        <span className="nav-screen-title">{topTitle}</span>
        {user ? (
          <NavLink to="/settings" className="nav-profile-btn" aria-label="Settings">
            {getInitial(user)}
          </NavLink>
        ) : isGuest ? (
          <Link to="/login" className="nav-profile-btn" aria-label="Log in">
            G
          </Link>
        ) : (
          <span className="nav-profile-btn">M</span>
        )}
      </motion.header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.button
              className="side-drawer-scrim"
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={closeDrawer}
            />
            <motion.aside
              className="side-drawer"
              initial={{ x: "-104%" }}
              animate={{ x: 0 }}
              exit={{ x: "-104%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="side-drawer-profile">
                <div className="side-drawer-avatar">{getInitial(user)}</div>
                <div>
                  <strong>{user?.name || "Mira Halden"}</strong>
                  <span>Tide · variant A</span>
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
                    onClick={closeDrawer}
                  >
                    <span className="side-drawer-icon">{icon}</span>
                    <span className="side-drawer-label">{label}</span>
                    <span className="side-drawer-detail">{detail}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="side-drawer-footer">
                <span>ELARION · V0.2.0</span>
                {user ? (
                  <button type="button" onClick={logout}>Sign out</button>
                ) : (
                  <Link to="/register" onClick={closeDrawer}>Create account</Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
