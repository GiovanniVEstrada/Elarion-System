const Task = require("../models/Task");
const JournalEntry = require("../models/JournalEntry");
const Habit = require("../models/Habit");
const MoodEntry = require("../models/MoodEntry");
const asyncHandler = require("../utils/asyncHandler");

const MOOD_SCORES = { great: 5, good: 4, neutral: 3, bad: 2, awful: 1 };
const DAY_MS = 86400000;

const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const calculateStreaks = (completedDates) => {
  if (!completedDates.length) return { currentStreak: 0, longestStreak: 0 };

  const dates = [
    ...new Set(
      completedDates.map((d) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    ),
  ].sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] - dates[i - 1] === DAY_MS) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const yesterdayMs = todayMs - DAY_MS;
  const last = dates[dates.length - 1];

  let current = 0;
  if (last === todayMs || last === yesterdayMs) {
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      if (dates[i + 1] - dates[i] === DAY_MS) {
        current++;
      } else {
        break;
      }
    }
  }

  return { currentStreak: current, longestStreak: longest };
};

// GET /api/insights/overview
const getOverview = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [totalTasks, completedTasks, totalJournalEntries, totalHabits, activeHabits] =
    await Promise.all([
      Task.countDocuments({ user: uid }),
      Task.countDocuments({ user: uid, completed: true }),
      JournalEntry.countDocuments({ user: uid }),
      Habit.countDocuments({ user: uid }),
      Habit.countDocuments({ user: uid, active: true }),
    ]);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

  res.status(200).json({
    success: true,
    data: {
      totalTasks,
      completedTasks,
      completionRate,
      totalJournalEntries,
      totalHabits,
      activeHabits,
    },
  });
});

// GET /api/insights/productivity
const getProductivity = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const now = new Date();

  const [
    completedThisWeek,
    overdueCount,
    totalTasks,
    completedTasks,
    alignmentAgg,
    energyAgg,
    recentIntentDocs,
  ] = await Promise.all([
    Task.countDocuments({ user: uid, completed: true, updatedAt: { $gte: startOfWeek() } }),
    Task.countDocuments({ user: uid, completed: false, dueDate: { $lt: now } }),
    Task.countDocuments({ user: uid }),
    Task.countDocuments({ user: uid, completed: true }),
    Task.aggregate([
      { $match: { user: uid, alignmentScore: { $ne: null } } },
      { $group: { _id: "$alignmentScore", count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { user: uid, energyLevel: { $ne: null } } },
      { $group: { _id: "$energyLevel", count: { $sum: 1 } } },
    ]),
    Task.find({ user: uid, intent: { $ne: null } })
      .sort("-createdAt")
      .limit(5)
      .select("intent"),
  ]);

  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

  const ALIGNMENT_LABELS = { 1: "off", 2: "neutral", 3: "aligned" };
  const alignmentBreakdown = { off: 0, neutral: 0, aligned: 0 };
  for (const { _id, count } of alignmentAgg) {
    const label = ALIGNMENT_LABELS[_id];
    if (label) alignmentBreakdown[label] = count;
  }

  const energyBreakdown = { low: 0, medium: 0, high: 0 };
  for (const { _id, count } of energyAgg) {
    if (_id in energyBreakdown) energyBreakdown[_id] = count;
  }

  const recentIntents = recentIntentDocs.map((t) => t.intent);

  res.status(200).json({
    success: true,
    data: {
      completedThisWeek,
      overdueCount,
      completionRate,
      alignmentBreakdown,
      energyBreakdown,
      recentIntents,
    },
  });
});

// GET /api/insights/streaks
const getStreaks = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id, active: true });

  const habitStreaks = habits.map((habit) => ({
    name: habit.name,
    frequency: habit.frequency,
    ...calculateStreaks(habit.completedDates),
  }));

  const allDates = habits.flatMap((h) =>
    h.completedDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  res.status(200).json({
    success: true,
    data: {
      habits: habitStreaks,
      totalActiveDays: new Set(allDates).size,
    },
  });
});

// GET /api/insights/journal-frequency
const getJournalFrequency = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [entriesThisWeek, entriesThisMonth, topMood, clarityAgg, mentalStateAgg, recentEntries] =
    await Promise.all([
      JournalEntry.countDocuments({ user: uid, createdAt: { $gte: startOfWeek() } }),
      JournalEntry.countDocuments({ user: uid, createdAt: { $gte: startOfMonth() } }),
      JournalEntry.aggregate([
        { $match: { user: uid } },
        { $group: { _id: "$mood", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]),
      JournalEntry.aggregate([
        { $match: { user: uid, clarity: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: "$clarity" } } },
      ]),
      JournalEntry.aggregate([
        { $match: { user: uid, mentalState: { $ne: null } } },
        { $group: { _id: "$mentalState", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      JournalEntry.find({ user: uid })
        .sort("-createdAt")
        .limit(12)
        .select("mood"),
    ]);

  const clarityAverage =
    clarityAgg[0] ? Math.round(clarityAgg[0].avg * 10) / 10 : null;

  const mentalStateCounts = Object.fromEntries(
    mentalStateAgg.map(({ _id, count }) => [_id, count])
  );

  // Reverse so trail runs oldest → newest, map mood string to 1–5
  const recentMoodTrail = recentEntries
    .reverse()
    .map((e) => MOOD_SCORES[e.mood]);

  res.status(200).json({
    success: true,
    data: {
      entriesThisWeek,
      entriesThisMonth,
      mostCommonMood: topMood[0]?._id || null,
      clarityAverage,
      mentalStateCounts,
      recentMoodTrail,
    },
  });
});

// GET /api/insights/habit-consistency
const getHabitConsistency = asyncHandler(async (req, res) => {
  const habits = await Habit.find({ user: req.user._id, active: true });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const habitStats = habits.map((habit) => {
    const created = new Date(habit.createdAt);
    created.setHours(0, 0, 0, 0);
    const daysSinceCreation = Math.max(1, Math.round((today - created) / DAY_MS) + 1);
    const completedCount = habit.completedDates.length;
    const consistencyRate = Math.round((completedCount / daysSinceCreation) * 1000) / 10;

    return { name: habit.name, frequency: habit.frequency, completedCount, daysSinceCreation, consistencyRate };
  });

  const overallConsistencyRate =
    habitStats.length > 0
      ? Math.round(
          (habitStats.reduce((sum, h) => sum + h.consistencyRate, 0) / habitStats.length) * 10
        ) / 10
      : 0;

  res.status(200).json({ success: true, data: { habits: habitStats, overallConsistencyRate } });
});

// GET /api/insights/mood-summary
const getMoodSummary = asyncHandler(async (req, res) => {
  const uid = req.user._id;

  const [allMoods, topMoodThisMonth] = await Promise.all([
    MoodEntry.find({ user: uid }).sort("date"),
    MoodEntry.aggregate([
      { $match: { user: uid, date: { $gte: startOfMonth() } } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]),
  ]);

  const averageScore =
    allMoods.length > 0
      ? Math.round(
          (allMoods.reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / allMoods.length) * 10
        ) / 10
      : null;

  let trend = null;
  if (allMoods.length >= 4) {
    const mid = Math.floor(allMoods.length / 2);
    const firstAvg =
      allMoods.slice(0, mid).reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) / mid;
    const secondAvg =
      allMoods.slice(mid).reduce((sum, e) => sum + MOOD_SCORES[e.mood], 0) /
      (allMoods.length - mid);
    if (secondAvg > firstAvg + 0.3) trend = "improving";
    else if (secondAvg < firstAvg - 0.3) trend = "declining";
    else trend = "stable";
  }

  res.status(200).json({
    success: true,
    data: {
      averageScore,
      mostFrequentMoodThisMonth: topMoodThisMonth[0]?._id || null,
      trend,
      totalEntries: allMoods.length,
    },
  });
});

module.exports = {
  getOverview,
  getProductivity,
  getStreaks,
  getJournalFrequency,
  getHabitConsistency,
  getMoodSummary,
};
