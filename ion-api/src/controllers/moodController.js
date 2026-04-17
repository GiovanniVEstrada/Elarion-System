const MoodEntry = require("../models/MoodEntry");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getMoods = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };

  if (req.query.mood) {
    filter.mood = req.query.mood;
  }

  const sortField = req.query.sort || "-date";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [moods, total] = await Promise.all([
    MoodEntry.find(filter).sort(sortField).skip(skip).limit(limit),
    MoodEntry.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(moods, total));
});

const createMood = asyncHandler(async (req, res) => {
  const { mood, note, date } = req.body || {};

  const entry = await MoodEntry.create({ user: req.user._id, mood, note, date });
  res.status(201).json({ success: true, data: entry });
});

const updateMood = asyncHandler(async (req, res) => {
  const updatedMood = await MoodEntry.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedMood) {
    return res.status(404).json({ success: false, message: "Mood entry not found", errors: [] });
  }

  res.status(200).json({ success: true, data: updatedMood });
});

const deleteMood = asyncHandler(async (req, res) => {
  const deletedMood = await MoodEntry.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedMood) {
    return res.status(404).json({ success: false, message: "Mood entry not found", errors: [] });
  }

  res.status(200).json({ success: true, data: { message: "Mood entry deleted successfully" } });
});

module.exports = { getMoods, createMood, updateMood, deleteMood };
