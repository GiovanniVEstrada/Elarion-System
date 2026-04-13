import { NavLink } from "react-router-dom";
import { motion } from "motion/react";

export default function Navbar() {
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
        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <NavLink to="/tasks" className={linkClass}>
            Tasks
          </NavLink>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <NavLink to="/journal" className={linkClass}>
            Journal
          </NavLink>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <NavLink to="/calendar" className={linkClass}>
            Calendar
          </NavLink>
        </motion.div>

        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <NavLink to="/reflect" className={linkClass}>
            Reflect
          </NavLink>
        </motion.div>
      </div>
    </motion.nav>
  );
}