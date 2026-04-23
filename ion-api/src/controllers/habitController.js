const Habit = require("../models/Habit");
const asyncHandler = require("../utils/asyncHandler");
const paginate = require("../utils/paginate");

const getHabits = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };

  if (req.query.active !== undefined) {
    filter.active = req.query.active === "true";
  }
  if (req.query.frequency) {
    filter.frequency = req.query.frequency;
  }

  const sortField = req.query.sort || "-createdAt";
  const { skip, limit, buildResponse } = paginate(req.query);

  const [habits, total] = await Promise.all([
    Habit.find(filter).sort(sortField).skip(skip).limit(limit),
    Habit.countDocuments(filter),
  ]);

  res.status(200).json(buildResponse(habits, total));
});

const createHabit = asyncHandler(async (req, res) => {
  const { name, description, frequency } = req.body || {};

  const habit = await Habit.create({ user: req.user._id, name, description, frequency });
  res.status(201).json({ success: true, data: habit });
});

const updateHabit = asyncHandler(async (req, res) => {
  const updatedHabit = await Habit.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { returnDocument: "after", runValidators: true }
  );

  if (!updatedHabit) {
    return res.status(404).json({ success: false, message: "Habit not found", errors: [] });
  }

  res.status(200).json({ success: true, data: updatedHabit });
});

const deleteHabit = asyncHandler(async (req, res) => {
  const deletedHabit = await Habit.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!deletedHabit) {
    return res.status(404).json({ success: false, message: "Habit not found", errors: [] });
  }

  res.status(200).json({ success: true, data: { message: "Habit deleted successfully" } });
});

const DAY_MS = 86400000;

function calcCurrentStreak(dates) {
  if (!dates.length) return 0;
  const unique = [...new Set(dates.map((d) => {
    const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime();
  }))].sort((a, b) => a - b);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const last = unique[unique.length - 1];
  if (last !== todayMs && last !== todayMs - DAY_MS) return 0;

  let streak = 1;
  for (let i = unique.length - 2; i >= 0; i--) {
    if (unique[i + 1] - unique[i] === DAY_MS) streak++;
    else break;
  }
  return streak;
}

const completeHabit = asyncHandler(async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user._id });

  if (!habit) {
    return res.status(404).json({ success: false, message: "Habit not found", errors: [] });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alreadyCompleted = habit.completedDates.some((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  if (alreadyCompleted) {
    return res.status(400).json({ success: false, message: "Habit already completed today", errors: [] });
  }

  habit.completedDates.push(today);
  habit.cachedStreak = calcCurrentStreak(habit.completedDates);
  await habit.save();

  res.status(200).json({ success: true, data: habit });
});

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, completeHabit };
