const JournalEntry = require("../models/JournalEntry");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getJournalEntries = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };

  if (req.query.mood) {
    filter.mood = req.query.mood;
  }
  if (req.query.tag) {
    filter.tags = req.query.tag;
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [entries, total] = await Promise.all([
    JournalEntry.find(filter).sort(sortField).skip(skip).limit(limit),
    JournalEntry.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(entries, total));
});

const getJournalEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!entry) {
    return res.status(404).json({ success: false, message: "Journal entry not found", errors: [] });
  }

  res.status(200).json({ success: true, data: entry });
});

const createJournalEntry = asyncHandler(async (req, res) => {
  const { title, content, mood, tags, clarity, mentalState, folder } = req.body || {};

  const entry = await JournalEntry.create({
    user: req.user._id,
    title,
    content,
    mood,
    tags,
    clarity,
    mentalState,
    folder,
  });

  res.status(201).json({ success: true, data: entry });
});

const updateJournalEntry = asyncHandler(async (req, res) => {
  const updatedEntry = await JournalEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedEntry) {
    return res.status(404).json({ success: false, message: "Journal entry not found", errors: [] });
  }

  res.status(200).json({ success: true, data: updatedEntry });
});

const deleteJournalEntry = asyncHandler(async (req, res) => {
  const deletedEntry = await JournalEntry.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedEntry) {
    return res.status(404).json({ success: false, message: "Journal entry not found", errors: [] });
  }

  res.status(200).json({ success: true, data: { message: "Journal entry deleted successfully" } });
});

module.exports = {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
};
