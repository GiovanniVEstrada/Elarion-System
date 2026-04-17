const express = require("express");
const {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} = require("../controllers/journalController");

const router = express.Router();

router.get("/", getJournalEntries);
router.post("/", createJournalEntry);
router.get("/:id", getJournalEntry);
router.patch("/:id", updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

module.exports = router;
