const express = require("express");
const {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} = require("../controllers/journalController");
const validate = require("../middleware/validate");
const {
  journalEntrySchema,
  journalEntryUpdateSchema,
} = require("../validation/schemas");

const router = express.Router();

router.get("/", getJournalEntries);
router.post("/", validate(journalEntrySchema), createJournalEntry);
router.get("/:id", getJournalEntry);
router.patch("/:id", validate(journalEntryUpdateSchema), updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

module.exports = router;
