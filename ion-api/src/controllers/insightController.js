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

// GET /api/insights/correlations
const getCorrelations = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const thirtyDaysAgo = new Date(Date.now() - 30 * DAY_MS);

  // Build a day→moodScore map from the last 30 mood entries
  const recentMoods = await MoodEntry.find({
    user: uid, date: { $gte: thirtyDaysAgo },
  }).select("date mood");

  const moodByDay = new Map();
  for (const m of recentMoods) {
    const key = new Date(m.date).toISOString().slice(0, 10);
    moodByDay.set(key, MOOD_SCORES[m.mood] ?? 3);
  }

  // Tasks completed per day in last 30 days
  const completedTasks = await Task.find({
    user: uid, completed: true, updatedAt: { $gte: thirtyDaysAgo },
  }).select("updatedAt");

  const tasksByDay = new Map();
  for (const t of completedTasks) {
    const key = new Date(t.updatedAt).toISOString().slice(0, 10);
    tasksByDay.set(key, (tasksByDay.get(key) || 0) + 1);
  }

  // Habits completed per day (any habit completion)
  const habits = await Habit.find({ user: uid }).select("completedDates");
  const habitsByDay = new Map();
  for (const h of habits) {
    for (const d of h.completedDates) {
      if (d < thirtyDaysAgo) continue;
      const key = new Date(d).toISOString().slice(0, 10);
      habitsByDay.set(key, (habitsByDay.get(key) || 0) + 1);
    }
  }

  // Compute correlations: split days into "high activity" vs "low activity"
  const days = [...moodByDay.keys()];
  const taskMoodPairs  = days.map(d => ({ tasks: tasksByDay.get(d) || 0, mood: moodByDay.get(d) }));
  const habitMoodPairs = days.map(d => ({ habits: habitsByDay.get(d) || 0, mood: moodByDay.get(d) }));

  function avgMoodWhen(pairs, key, pred) {
    const filtered = pairs.filter(p => pred(p[key]));
    if (!filtered.length) return null;
    return Math.round(filtered.reduce((s, p) => s + p.mood, 0) / filtered.length * 10) / 10;
  }

  const median = (arr) => {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  const taskCounts  = taskMoodPairs.map(p => p.tasks);
  const habitCounts = habitMoodPairs.map(p => p.habits);
  const taskMedian  = median(taskCounts);
  const habitMedian = median(habitCounts);

  const moodOnHighTaskDays  = avgMoodWhen(taskMoodPairs,  "tasks",  v => v >  taskMedian);
  const moodOnLowTaskDays   = avgMoodWhen(taskMoodPairs,  "tasks",  v => v <= taskMedian);
  const moodOnHighHabitDays = avgMoodWhen(habitMoodPairs, "habits", v => v >  habitMedian);
  const moodOnLowHabitDays  = avgMoodWhen(habitMoodPairs, "habits", v => v <= habitMedian);

  // Journal clarity vs average mood (aggregate per-entry comparison)
  const journalEntries = await JournalEntry.find({
    user: uid, clarity: { $ne: null }, createdAt: { $gte: thirtyDaysAgo },
  }).select("clarity createdAt");

  const clarityMoodPairs = journalEntries.map(e => {
    const key = new Date(e.createdAt).toISOString().slice(0, 10);
    return { clarity: e.clarity, mood: moodByDay.get(key) ?? null };
  }).filter(p => p.mood !== null);

  const moodWhenHighClarity = avgMoodWhen(clarityMoodPairs, "clarity", v => v >= 4);
  const moodWhenLowClarity  = avgMoodWhen(clarityMoodPairs, "clarity", v => v <= 2);

  function direction(high, low) {
    if (high === null || low === null) return "insufficient_data";
    if (high > low + 0.3) return "positive";
    if (high < low - 0.3) return "negative";
    return "neutral";
  }

  res.status(200).json({
    success: true,
    data: {
      taskVsMood: {
        moodOnHighTaskDays,
        moodOnLowTaskDays,
        direction: direction(moodOnHighTaskDays, moodOnLowTaskDays),
      },
      habitVsMood: {
        moodOnHighHabitDays,
        moodOnLowHabitDays,
        direction: direction(moodOnHighHabitDays, moodOnLowHabitDays),
      },
      clarityVsMood: {
        moodWhenHighClarity,
        moodWhenLowClarity,
        direction: direction(moodWhenHighClarity, moodWhenLowClarity),
      },
      daysAnalyzed: days.length,
    },
  });
});

function trendDirection(recent, previous, threshold = 0.5) {
  if (recent === null || previous === null) return null;
  if (recent > previous + threshold) return "up";
  if (recent < previous - threshold) return "down";
  return "stable";
}

// GET /api/insights/weekly-summary
const getWeeklySummary = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const weekStart = startOfWeek();
  const prevWeekStart = new Date(weekStart.getTime() - 7 * DAY_MS);

  const [
    tasksThisWeek, tasksPrevWeek,
    moodsThisWeek, moodsPrevWeek,
    journalThisWeek, journalPrevWeek,
    habitsThisWeek,
  ] = await Promise.all([
    Task.countDocuments({ user: uid, completed: true, updatedAt: { $gte: weekStart } }),
    Task.countDocuments({ user: uid, completed: true, updatedAt: { $gte: prevWeekStart, $lt: weekStart } }),
    MoodEntry.find({ user: uid, date: { $gte: weekStart } }).select("mood"),
    MoodEntry.find({ user: uid, date: { $gte: prevWeekStart, $lt: weekStart } }).select("mood"),
    JournalEntry.countDocuments({ user: uid, createdAt: { $gte: weekStart } }),
    JournalEntry.countDocuments({ user: uid, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
    Habit.find({ user: uid, active: true }).select("completedDates"),
  ]);

  const avgMood = (moods) => moods.length
    ? Math.round(moods.reduce((s, m) => s + MOOD_SCORES[m.mood], 0) / moods.length * 10) / 10
    : null;

  const habitCompletionsThisWeek = habitsThisWeek.reduce((sum, h) =>
    sum + h.completedDates.filter(d => new Date(d) >= weekStart).length, 0);

  const thisWeekMoodAvg = avgMood(moodsThisWeek);
  const prevWeekMoodAvg = avgMood(moodsPrevWeek);

  res.status(200).json({
    success: true,
    data: {
      tasksCompleted: tasksThisWeek,
      tasksTrend: trendDirection(tasksThisWeek, tasksPrevWeek),
      moodAverage: thisWeekMoodAvg,
      moodTrend: trendDirection(thisWeekMoodAvg, prevWeekMoodAvg, 0.3),
      journalEntries: journalThisWeek,
      journalTrend: trendDirection(journalThisWeek, journalPrevWeek),
      habitCompletions: habitCompletionsThisWeek,
      period: "week",
    },
  });
});

// GET /api/insights/monthly-summary
const getMonthlySummary = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const monthStart = startOfMonth();
  const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

  const [
    tasksThisMonth, tasksPrevMonth,
    moodsThisMonth, moodsPrevMonth,
    journalThisMonth, journalPrevMonth,
  ] = await Promise.all([
    Task.countDocuments({ user: uid, completed: true, updatedAt: { $gte: monthStart } }),
    Task.countDocuments({ user: uid, completed: true, updatedAt: { $gte: prevMonthStart, $lt: monthStart } }),
    MoodEntry.find({ user: uid, date: { $gte: monthStart } }).select("mood"),
    MoodEntry.find({ user: uid, date: { $gte: prevMonthStart, $lt: monthStart } }).select("mood"),
    JournalEntry.countDocuments({ user: uid, createdAt: { $gte: monthStart } }),
    JournalEntry.countDocuments({ user: uid, createdAt: { $gte: prevMonthStart, $lt: monthStart } }),
  ]);

  const avgMood = (moods) => moods.length
    ? Math.round(moods.reduce((s, m) => s + MOOD_SCORES[m.mood], 0) / moods.length * 10) / 10
    : null;

  res.status(200).json({
    success: true,
    data: {
      tasksCompleted: tasksThisMonth,
      tasksTrend: trendDirection(tasksThisMonth, tasksPrevMonth),
      moodAverage: avgMood(moodsThisMonth),
      moodTrend: trendDirection(avgMood(moodsThisMonth), avgMood(moodsPrevMonth), 0.3),
      journalEntries: journalThisMonth,
      journalTrend: trendDirection(journalThisMonth, journalPrevMonth),
      period: "month",
    },
  });
});

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// GET /api/insights/day-of-week
// Returns avg mood, task completions, and habit completions per day of week
// over the last 90 days, plus best and worst day by mood.
const getDayOfWeekInsights = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const ninetyDaysAgo = new Date(Date.now() - 90 * DAY_MS);

  const [moods, habits, tasks] = await Promise.all([
    MoodEntry.find({ user: uid, date: { $gte: ninetyDaysAgo } }).select("date mood"),
    Habit.find({ user: uid }).select("completedDates"),
    Task.find({ user: uid, completed: true, updatedAt: { $gte: ninetyDaysAgo } }).select("updatedAt"),
  ]);

  const moodByDow   = Array.from({ length: 7 }, () => []);
  const tasksByDow  = Array(7).fill(0);
  const habitsByDow = Array(7).fill(0);

  for (const m of moods) {
    const score = MOOD_SCORES[m.mood];
    if (score != null) moodByDow[new Date(m.date).getDay()].push(score);
  }
  for (const t of tasks) {
    tasksByDow[new Date(t.updatedAt).getDay()]++;
  }
  for (const h of habits) {
    for (const d of h.completedDates) {
      if (new Date(d) >= ninetyDaysAgo) habitsByDow[new Date(d).getDay()]++;
    }
  }

  const days = DOW_NAMES.map((name, i) => {
    const scores = moodByDow[i];
    const avgMood = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length * 10) / 10
      : null;
    return { day: name, dow: i, avgMood, moodEntries: scores.length, tasksCompleted: tasksByDow[i], habitCompletions: habitsByDow[i] };
  });

  const qualified = days.filter((d) => d.avgMood !== null && d.moodEntries >= 2);
  const bestDay   = qualified.length ? qualified.reduce((b, d) => d.avgMood > b.avgMood ? d : b) : null;
  const worstDay  = qualified.length ? qualified.reduce((w, d) => d.avgMood < w.avgMood ? d : w) : null;

  res.status(200).json({
    success: true,
    data: { days, bestDay, worstDay, insufficientData: qualified.length < 2 },
  });
});

// GET /api/insights/habit-mood
// For each active habit, computes avg mood on completion days vs all other days
// over the last 90 days. Sorted by absolute mood delta descending.
const getHabitMoodCorrelation = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const ninetyDaysAgo = new Date(Date.now() - 90 * DAY_MS);

  const [habits, moods] = await Promise.all([
    Habit.find({ user: uid, active: true }).select("name completedDates"),
    MoodEntry.find({ user: uid, date: { $gte: ninetyDaysAgo } }).select("date mood"),
  ]);

  const moodByDate = new Map();
  for (const m of moods) {
    moodByDate.set(new Date(m.date).toISOString().slice(0, 10), MOOD_SCORES[m.mood] ?? 3);
  }

  const results = [];

  for (const habit of habits) {
    const completionDates = new Set(
      habit.completedDates
        .filter((d) => new Date(d) >= ninetyDaysAgo)
        .map((d) => new Date(d).toISOString().slice(0, 10))
    );

    if (completionDates.size < 5) continue;

    const onDays = [], offDays = [];
    for (const [date, score] of moodByDate) {
      (completionDates.has(date) ? onDays : offDays).push(score);
    }

    if (onDays.length < 3 || offDays.length < 3) continue;

    const onAvg  = onDays.reduce((s, v) => s + v, 0) / onDays.length;
    const offAvg = offDays.reduce((s, v) => s + v, 0) / offDays.length;
    const delta  = Math.round((onAvg - offAvg) * 100) / 100;

    results.push({
      habitId: habit._id,
      habitName: habit.name,
      moodOnCompletionDays: Math.round(onAvg * 10) / 10,
      moodOnOtherDays: Math.round(offAvg * 10) / 10,
      delta,
      completionCount: completionDates.size,
      direction: Math.abs(delta) < 0.3 ? "neutral" : delta > 0 ? "positive" : "negative",
    });
  }

  results.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  res.status(200).json({
    success: true,
    data: { habits: results, daysAnalyzed: moodByDate.size },
  });
});

module.exports = {
  getOverview,
  getProductivity,
  getStreaks,
  getJournalFrequency,
  getHabitConsistency,
  getMoodSummary,
  getCorrelations,
  getWeeklySummary,
  getMonthlySummary,
  getDayOfWeekInsights,
  getHabitMoodCorrelation,
};
