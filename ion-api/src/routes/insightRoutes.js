const express = require("express");
const {
  getOverview,
  getProductivity,
  getStreaks,
  getJournalFrequency,
  getHabitConsistency,
  getMoodSummary,
} = require("../controllers/insightController");

const router = express.Router();

router.get("/overview", getOverview);
router.get("/productivity", getProductivity);
router.get("/streaks", getStreaks);
router.get("/journal-frequency", getJournalFrequency);
router.get("/habit-consistency", getHabitConsistency);
router.get("/mood-summary", getMoodSummary);

module.exports = router;
