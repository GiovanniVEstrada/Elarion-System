import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useMoodsContext } from "../context/MoodsContext";
import { useReflectionsContext } from "../context/ReflectionsContext";
import { useJournalContext } from "../context/JournalContext";
import { useTasksContext } from "../context/TasksContext";
import PageShell from "../components/layout/PageShell";
import MoodTideChart from "../components/MoodTideChart";
import useInsights from "../hooks/useInsights";

const MOOD_SCORE = { great: 10, good: 7.5, neutral: 5, bad: 2.5, awful: 1 };

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES  = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MS_DAY     = 24 * 60 * 60 * 1000;

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function dateKey(raw) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function buildWeekData(moods, weekStart) {
  return DAY_LABELS.map((day, index) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + index);
    const key = dateKey(d);
    const scores = moods
      .filter((e) => dateKey(e.date ?? e.createdAt) === key)
      .map((e) => MOOD_SCORE[e.mood])
      .filter((s) => s != null);
    const value = average(scores);
    return { day, value, hasEntry: scores.length > 0, date: d, dayName: DAY_NAMES[index] };
  });
}

function entriesInRange(entries, start, end) {
  return entries.filter((e) => {
    const d = new Date(e.date ?? e.createdAt);
    return !Number.isNaN(d.getTime()) && d >= start && d < end;
  });
}

function detectStreak(entries) {
  const days = new Set(entries.map((e) => dateKey(e.createdAt)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function detectPattern(weekData) {
  const valid = weekData.filter((item) => item.value != null);
  if (valid.length < 2) return "Patterns surface with more entries.";

  const avg = average(valid.map((item) => item.value));
  if (avg >= 8) return "The tide has been high this week.";
  if (avg <= 3) return "The water has been low. Rest is data too.";

  const firstThree = average(weekData.slice(0, 3).filter((item) => item.value != null).map((item) => item.value));
  const lastThree  = average(weekData.slice(4, 7).filter((item) => item.value != null).map((item) => item.value));
  if (firstThree != null && lastThree != null && lastThree - firstThree >= 1) return "The current is rising.";
  if (firstThree != null && lastThree != null && firstThree - lastThree >= 1) return "The tide is pulling back.";

  const peak   = valid.reduce((best, item) => item.value > best.value ? item : best, valid[0]);
  const others = valid.filter((item) => item !== peak);
  if (others.length && peak.value - Math.max(...others.map((item) => item.value)) >= 1) {
    return `Energy rose highest on ${peak.dayName}.`;
  }

  return "The week holds steady.";
}

function patternSubtitle(pattern) {
  if (pattern.includes("high"))    return "Mood tracked as a lifted line, with the week holding above the usual waterline.";
  if (pattern.includes("low"))     return "Mood moved through quieter water this week, pointing toward rest and recovery.";
  if (pattern.includes("rising"))  return "Mood tracked as a flowing line, with the current rising toward the weekend.";
  if (pattern.includes("pulling")) return "Mood tracked as a flowing line, with the tide easing back late in the week.";
  if (pattern.includes("highest")) return pattern.replace("Energy rose", "Energy rises");
  return "Mood tracked as a flowing line. Log more days to sharpen the signal.";
}

// Derives a pattern string from cross-source correlation data returned by
// /api/insights/correlations. Returns null if data is insufficient so the
// caller can fall back to the local week-only detectPattern.
function buildCorrelationPattern(correlations) {
  if (!correlations || correlations.daysAnalyzed < 7) return null;

  const { habitVsMood, taskVsMood, clarityVsMood } = correlations;

  if (habitVsMood.direction === "positive" && habitVsMood.moodOnHighHabitDays != null) {
    const delta = (habitVsMood.moodOnHighHabitDays - habitVsMood.moodOnLowHabitDays).toFixed(1);
    return `Habit days lift your mood by ${delta} pts on average.`;
  }
  if (taskVsMood.direction === "positive" && taskVsMood.moodOnHighTaskDays != null) {
    const delta = (taskVsMood.moodOnHighTaskDays - taskVsMood.moodOnLowTaskDays).toFixed(1);
    return `Getting more done tracks with a +${delta} mood lift.`;
  }
  if (clarityVsMood.direction === "positive" && clarityVsMood.moodWhenHighClarity != null) {
    return "Your clearest journal days align with your highest mood scores.";
  }
  if (habitVsMood.direction === "negative" && habitVsMood.moodOnHighHabitDays != null) {
    return "Your mood pattern doesn't follow the usual habit rhythm — something else is driving it.";
  }

  return null;
}

export default function Reflect() {
  const { moods }                       = useMoodsContext();
  const { reflections }                 = useReflectionsContext();
  const { entries: journalEntries }     = useJournalContext();
  const { tasks }                       = useTasksContext();
  const { correlations, dayOfWeek, loading: insightsLoading } = useInsights();

  const weekStart     = useMemo(() => startOfWeek(), []);
  const nextWeekStart = useMemo(() => new Date(weekStart.getTime() + 7 * MS_DAY), [weekStart]);
  const lastWeekStart = useMemo(() => new Date(weekStart.getTime() - 7 * MS_DAY), [weekStart]);

  const weekData           = useMemo(() => buildWeekData(moods, weekStart), [moods, weekStart]);
  const thisWeekMoods      = useMemo(() => entriesInRange(moods, weekStart, nextWeekStart), [moods, weekStart, nextWeekStart]);
  const lastWeekMoods      = useMemo(() => entriesInRange(moods, lastWeekStart, weekStart), [moods, lastWeekStart, weekStart]);
  const thisWeekJournal    = useMemo(() => entriesInRange(journalEntries, weekStart, nextWeekStart), [journalEntries, weekStart, nextWeekStart]);
  const thisWeekReflections = useMemo(() => entriesInRange(reflections, weekStart, nextWeekStart), [reflections, weekStart, nextWeekStart]);
  const completedWithSignal = useMemo(
    () => tasks.filter((t) => t.completed && (t.alignmentScore || t.postMood)),
    [tasks]
  );

  const validScores = weekData.filter((item) => item.value != null).map((item) => item.value);
  const avgMood     = average(validScores);
  const lastAvg     = average(
    lastWeekMoods.map((e) => MOOD_SCORE[e.mood]).filter((s) => s != null)
  );
  const delta         = avgMood != null && lastAvg != null ? avgMood - lastAvg : null;
  const journalStreak = detectStreak(journalEntries);

  const correlationPattern = useMemo(() => buildCorrelationPattern(correlations), [correlations]);
  const pattern            = correlationPattern ?? detectPattern(weekData);
  const patternIsFromApi   = correlationPattern !== null;

  // Reorder API days (Sun=0…Sat=6) to display Mon-first: Mon Tue Wed Thu Fri Sat Sun
  const dowDays = useMemo(() => {
    if (!dayOfWeek?.days?.length) return [];
    const d = dayOfWeek.days;
    return [...d.slice(1), d[0]];
  }, [dayOfWeek]);

  return (
    <PageShell>
      <motion.header
        className="reflect-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="reflect-hero-kicker tide-hero-kicker">This Week</p>
        <h1 className="reflect-hero-title tide-hero-title">Your tide chart</h1>
        <p className="reflect-hero-subtitle">{patternSubtitle(pattern)}</p>
      </motion.header>

      {moods.length === 0 ? (
        /* ── No data ever: full empty state ── */
        <motion.div
          className="glass-card reflect-empty-state"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.38 }}
        >
          <p className="reflect-empty-kicker">No tide yet</p>
          <h2 className="reflect-empty-title">The water is still.</h2>
          <p className="reflect-empty-sub">
            Your mood chart fills as you write. Head to your journal to log your first reflection.
          </p>
          <Link to="/journal" className="reflect-empty-cta">Begin a reflection →</Link>
        </motion.div>
      ) : (
        /* ── Insights section ── */
        <motion.section
          className="reflect-insights"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.38 }}
        >
          <div className="glass-card reflect-chart-card">
            <MoodTideChart weekData={weekData} />
          </div>

          <div className="reflect-stat-row">
            <div className="glass-card reflect-stat-card">
              <p className="reflect-stat-kicker">Avg Mood</p>
              <strong className="reflect-stat-value">{avgMood == null ? "--" : avgMood.toFixed(1)}</strong>
              <span className={[
                "reflect-stat-sub",
                delta > 0 && "reflect-stat-sub--up",
                delta < 0 && "reflect-stat-sub--down",
              ].filter(Boolean).join(" ")}>
                {delta == null ? "No prior data" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} vs last`}
              </span>
            </div>

            <div className="glass-card reflect-stat-card">
              <p className="reflect-stat-kicker">Reflections</p>
              <strong className="reflect-stat-value">{thisWeekJournal.length}</strong>
              <span className="reflect-stat-sub">
                {journalStreak} day{journalStreak === 1 ? "" : "s"} · streak
              </span>
            </div>
          </div>

          <div className="glass-card reflect-pattern-card">
            <p className="reflect-pattern-kicker">Pattern Noticed</p>
            {insightsLoading ? (
              <p className="reflect-pattern-text reflect-pattern-text--loading">Reading the signal…</p>
            ) : (
              <>
                <p className="reflect-pattern-text">{pattern || "Patterns surface with more time."}</p>
                {patternIsFromApi && (
                  <p className="reflect-pattern-source">
                    {correlations.daysAnalyzed}-day cross-source correlation
                  </p>
                )}
              </>
            )}
          </div>

          {!insightsLoading && dayOfWeek && !dayOfWeek.insufficientData && (
            <motion.div
              className="glass-card reflect-dow-card"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
            >
              <p className="reflect-pattern-kicker">Peak Day</p>
              <div className="reflect-dow-header">
                <p className="reflect-dow-best-name">
                  {dayOfWeek.bestDay.day}
                  <span className="reflect-dow-best-score">
                    {dayOfWeek.bestDay.avgMood.toFixed(1)} / 5
                  </span>
                </p>
              </div>
              <div className="reflect-dow-chart">
                {dowDays.map((d) => {
                  const isBest  = dayOfWeek.bestDay?.dow  === d.dow;
                  const isWorst = dayOfWeek.worstDay?.dow === d.dow;
                  const heightPct = d.avgMood ? (d.avgMood / 5) * 100 : 0;
                  const barClass = isBest  ? "reflect-dow-bar--best"
                                 : isWorst ? "reflect-dow-bar--worst"
                                 : d.avgMood ? "reflect-dow-bar--normal"
                                 : "reflect-dow-bar--empty";
                  return (
                    <div key={d.dow} className="reflect-dow-col">
                      <div className="reflect-dow-track">
                        <div
                          className={`reflect-dow-bar ${barClass}`}
                          style={{ height: `${heightPct || 8}%` }}
                        />
                      </div>
                      <span className={`reflect-dow-label${isBest ? " reflect-dow-label--best" : ""}`}>
                        {d.day[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
              {dayOfWeek.worstDay && (
                <p className="reflect-dow-worst-note">
                  Lowest on {dayOfWeek.worstDay.day} · {dayOfWeek.worstDay.avgMood.toFixed(1)} avg
                </p>
              )}
            </motion.div>
          )}

          <div className="reflect-signal-strip">
            <span>{thisWeekMoods.length} mood logs</span>
            <span>{thisWeekReflections.length} predictions</span>
            <span>{completedWithSignal.length} action signals</span>
          </div>

          {thisWeekMoods.length === 0 && (
            <Link to="/journal" className="reflect-week-nudge">
              No entries this week · Write in your journal to update the tide →
            </Link>
          )}
        </motion.section>
      )}

    </PageShell>
  );
}
