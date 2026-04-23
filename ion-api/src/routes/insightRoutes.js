const express = require("express");
const {
  getOverview,
  getProductivity,
  getStreaks,
  getJournalFrequency,
  getHabitConsistency,
  getMoodSummary,
  getCorrelations,
  getWeeklySummary,
  getMonthlySummary,
} = require("../controllers/insightController");

const router = express.Router();

router.get("/overview",          getOverview);
router.get("/productivity",      getProductivity);
router.get("/streaks",           getStreaks);
router.get("/journal-frequency", getJournalFrequency);
router.get("/habit-consistency", getHabitConsistency);
router.get("/mood-summary",      getMoodSummary);
router.get("/correlations",      getCorrelations);
router.get("/weekly-summary",    getWeeklySummary);
router.get("/monthly-summary",   getMonthlySummary);

module.exports = router;
