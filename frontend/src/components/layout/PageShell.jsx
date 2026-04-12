import { motion } from "motion/react";

export default function PageShell({ children }) {
  return (
    <motion.section
      className="feature-page"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}