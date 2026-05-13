import { Link, NavLink } from "react-router-dom";
import { motion } from "motion/react";
import { getInitial } from "./navItems";

export default function TopChrome({ isGuest, onOpen, menuBtnRef, title, user }) {
  return (
    <motion.header
      className="app-top-chrome"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <button
        ref={menuBtnRef}
        className="nav-menu-btn"
        type="button"
        aria-label="Open navigation"
        onClick={onOpen}
      >
        ≋
      </button>
      <span className="nav-screen-title">{title}</span>
      {user ? (
        <NavLink to="/settings" className="nav-profile-btn" aria-label="Settings">
          {getInitial(user)}
        </NavLink>
      ) : isGuest ? (
        <Link to="/login" className="nav-profile-btn" aria-label="Log in">
          L
        </Link>
      ) : (
        <span className="nav-profile-btn">L</span>
      )}
    </motion.header>
  );
}
