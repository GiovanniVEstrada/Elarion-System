import { motion } from "motion/react";

export default function SectionHeader({ kicker, title, subtitle }) {
  return (
    <motion.div
      className="feature-page-header"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.35 }}
    >
      {kicker && <span className="card-kicker">{kicker}</span>}
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </motion.div>
  );
}