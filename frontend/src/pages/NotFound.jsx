import { Link } from "react-router-dom";
import { motion } from "motion/react";
import PageShell from "../components/layout/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <motion.div
        className="not-found-shell"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-sub">This page doesn't exist or was moved.</p>
        <Link to="/" className="not-found-btn">← Go home</Link>
      </motion.div>
    </PageShell>
  );
}
