const Reflection = require("../models/Reflection");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/reflections — last 30 days
const getReflections = asyncHandler(async (req, res) => {
  const reflections = await Reflection.find({ user: req.user._id })
    .sort({ date: -1 })
    .limit(30);
  res.status(200).json({ success: true, data: reflections });
});

// POST /api/reflections — upsert by date (one reflection per day)
const upsertReflection = asyncHandler(async (req, res) => {
  const { date, predictedMood, actualMood, alignmentAverage, notes } = req.body;

  const reflection = await Reflection.findOneAndUpdate(
    { user: req.user._id, date },
    { predictedMood, actualMood, alignmentAverage, notes },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: reflection });
});

// PATCH /api/reflections/:date — partial update for a specific day
const updateReflection = asyncHandler(async (req, res) => {
  const reflection = await Reflection.findOneAndUpdate(
    { user: req.user._id, date: req.params.date },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!reflection) {
    return res.status(404).json({ success: false, message: "Reflection not found" });
  }

  res.status(200).json({ success: true, data: reflection });
});

module.exports = { getReflections, upsertReflection, updateReflection };
