import { useMemo } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useMoodsContext } from "../context/MoodsContext";
import { useReflectionsContext } from "../context/ReflectionsContext";
import { useJournalContext } from "../context/JournalContext";
import { useTasksContext } from "../context/TasksContext";
import PageShell from "../components/layout/PageShell";
import MoodTideChart from "../components/MoodTideChart";

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

export default function Reflect() {
  const { moods }                       = useMoodsContext();
  const { reflections }                 = useReflectionsContext();
  const { entries: journalEntries }     = useJournalContext();
  const { tasks }                       = useTasksContext();

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
  const pattern       = detectPattern(weekData);
  const journalStreak = detectStreak(journalEntries);

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
            <p className="reflect-pattern-text">{pattern || "Patterns surface with more time."}</p>
          </div>

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
