import { NavLink, Link } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, isGuest, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <motion.nav
      className="navbar"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="navbar-brand"
        whileHover={{ y: -1, scale: 1.01 }}
        transition={{ duration: 0.18 }}
      >
        Elarion
      </motion.div>

      <div className="navbar-links">
        {[
          { to: "/",         label: "Alignment Center", end: true  },
          { to: "/tasks",    label: "Actions",          end: false },
          { to: "/journal",  label: "Reflection Log",   end: false },
          { to: "/calendar", label: "Calendar",         end: false },
          { to: "/reflect",  label: "Reflect",          end: false },
        ].map(({ to, label, end }) => (
          <motion.div key={to} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <NavLink to={to} end={end} className={linkClass}>{label}</NavLink>
          </motion.div>
        ))}
      </div>

      {user ? (
        <div className="navbar-user">
          <span className="navbar-username">{user.name}</span>
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <NavLink to="/settings" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
              Settings
            </NavLink>
          </motion.div>
          <motion.button
            className="nav-link navbar-logout"
            onClick={logout}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign out
          </motion.button>
        </div>
      ) : isGuest ? (
        <div className="navbar-user">
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/register" className="nav-link navbar-logout" style={{ color: "rgba(181,140,255,0.9)" }}>Sign up</Link>
        </div>
      ) : null}
    </motion.nav>
  );
}
