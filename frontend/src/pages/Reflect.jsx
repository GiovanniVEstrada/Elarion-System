import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
import { useMoodsContext, MOOD_OPTIONS } from "../context/MoodsContext";
import { useReflectionsContext } from "../context/ReflectionsContext";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import client from "../api/client";
import { tapAnim } from "../utils/motion";
import { getTodayStr } from "../utils/dateUtils";

const MOOD_EMOJIS  = ["", "😔", "😕", "😐", "🙂", "😊"];
const MOOD_COLORS  = ["", "#ff5a5a", "#ff9a5a", "#ffc83c", "#8de88d", "#64dc82"];
const ENERGY_COLORS = { low: "#64dc82", medium: "#ffc83c", high: "#ff5a5a" };
const FEELING_COLORS = { energizing: "#64dc82", neutral: "var(--accent)", necessary: "#ffc83c", draining: "#ff5a5a" };
const FEELINGS = ["energizing", "neutral", "necessary", "draining"];

const TREND_MAP = {
  improving: { icon: "↑", color: "#64dc82" },
  stable:    { icon: "—", color: "var(--text-soft)" },
  declining: { icon: "↓", color: "#ff5a5a" },
  up:        { icon: "↑", color: "#64dc82" },
  down:      { icon: "↓", color: "#ff5a5a" },
};

const REFLECTION_MOOD_OPTIONS = [
  { value: "great",   emoji: "😊", label: "Great"   },
  { value: "good",    emoji: "🙂", label: "Good"    },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "bad",     emoji: "😕", label: "Bad"     },
  { value: "awful",   emoji: "😔", label: "Awful"   },
];

function reflMoodMeta(value) {
  return REFLECTION_MOOD_OPTIONS.find((m) => m.value === value) ?? { emoji: "•", label: value ?? "" };
}

const CORR_DIR = {
  positive:           { label: "positive link",  color: "#64dc82" },
  negative:           { label: "negative link",  color: "#ff5a5a" },
  neutral:            { label: "no clear link",  color: "var(--text-soft)" },
  insufficient_data:  { label: "not enough data", color: "var(--text-soft)" },
};

function StatCard({ title, children, delay = 0 }) {
  return (
    <motion.div
      className="reflect-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38 }}
    >
      <p className="reflect-card-title">{title}</p>
      {children}
    </motion.div>
  );
}

function EmptyState({ message }) {
  return <p className="reflect-empty">{message}</p>;
}

function DataBar({ label, value, max, color }) {
  return (
    <div className="data-row">
      <span className="data-row-label" style={{ color }}>{label}</span>
      <div className="data-bar-track">
        <div className="data-bar" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="data-row-count">{value}</span>
    </div>
  );
}

function moodMeta(value) {
  return MOOD_OPTIONS.find((m) => m.value === value) ?? { emoji: "•", label: value, color: "var(--text-soft)" };
}

export default function Reflect() {
  const { events } = useCalendarContext();
  const { isGuest } = useAuth();
  const {
    todaysMood, selectedMood, setSelectedMood,
    note, setNote, submitting, handleLog,
  } = useMoodsContext();
  const { reflections, todayReflection, upsertReflection } = useReflectionsContext();
  const [insights, setInsights] = useState({
    productivity: null,
    streaks: null,
    journalFrequency: null,
    habitConsistency: null,
    moodSummary: null,
    correlations: null,
    weeklySummary: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    Promise.allSettled([
      client.get("/insights/productivity"),
      client.get("/insights/streaks"),
      client.get("/insights/journal-frequency"),
      client.get("/insights/habit-consistency"),
      client.get("/insights/mood-summary"),
      client.get("/insights/correlations"),
      client.get("/insights/weekly-summary"),
    ]).then(([prod, str, jf, hc, ms, corr, wk]) => {
      setInsights({
        productivity:     prod.status === "fulfilled" ? prod.value.data.data : null,
        streaks:          str.status  === "fulfilled" ? str.value.data.data  : null,
        journalFrequency: jf.status   === "fulfilled" ? jf.value.data.data   : null,
        habitConsistency: hc.status   === "fulfilled" ? hc.value.data.data   : null,
        moodSummary:      ms.status   === "fulfilled" ? ms.value.data.data   : null,
        correlations:     corr.status === "fulfilled" ? corr.value.data.data : null,
        weeklySummary:    wk.status   === "fulfilled" ? wk.value.data.data   : null,
      });
      setLoading(false);
    });
  }, [isGuest]);

  // ── Local calendar stats (stays localStorage) ──────────────────
  const ratedEvents  = events.filter((e) => e.actualFeeling);
  const withExpected = ratedEvents.filter((e) => e.expectedFeeling);
  const matched      = withExpected.filter((e) => e.expectedFeeling === e.actualFeeling).length;
  const calAccuracy  = withExpected.length ? Math.round((matched / withExpected.length) * 100) : null;
  const feelingCounts = { energizing: 0, neutral: 0, necessary: 0, draining: 0 };
  ratedEvents.forEach((e) => { if (feelingCounts[e.actualFeeling] !== undefined) feelingCounts[e.actualFeeling]++; });
  const maxFeeling = Math.max(...Object.values(feelingCounts), 1);

  // ── Derived from API ────────────────────────────────────────────
  const prod  = insights.productivity;
  const jf    = insights.journalFrequency;
  const hc    = insights.habitConsistency;
  const ms    = insights.moodSummary;
  const str   = insights.streaks;
  const corr  = insights.correlations;
  const wk    = insights.weeklySummary;

  const alignCounts = prod?.alignmentBreakdown ?? { off: 0, neutral: 0, aligned: 0 };
  const ratedTotal  = (alignCounts.off + alignCounts.neutral + alignCounts.aligned) || 1;

  const energyCounts = prod?.energyBreakdown ?? { low: 0, medium: 0, high: 0 };
  const maxEnergy    = Math.max(...Object.values(energyCounts), 1);

  const recentIntents    = prod?.recentIntents ?? [];
  const recentMoodTrail  = jf?.recentMoodTrail ?? [];
  const avgMoodNum       = ms?.averageScore ?? null;
  const avgClarity       = jf?.clarityAverage ?? null;
  const mentalStateCounts = jf?.mentalStateCounts ? Object.entries(jf.mentalStateCounts).sort((a, b) => b[1] - a[1]) : [];

  const trend = ms?.trend ? TREND_MAP[ms.trend] : null;

  // ── Prediction accuracy ─────────────────────────────────────────
  const reflWithBoth = reflections.filter((r) => r.predictedMood && r.actualMood);
  const reflMatched  = reflWithBoth.filter((r) => r.predictedMood === r.actualMood).length;
  const predAccuracy = reflWithBoth.length >= 3
    ? Math.round((reflMatched / reflWithBoth.length) * 100)
    : null;

  return (
    <PageShell>
      <SectionHeader
        kicker="Insights"
        title="Reflect"
        subtitle="Patterns from your actions — what your choices reveal over time."
      />

      {/* ── Mood check-in ── */}
      <motion.div
        className="reflect-mood-checkin"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isGuest ? (
          <div className="reflect-mood-guest">
            <span>Sign in to log your mood and track wellbeing over time.</span>
            <div className="guest-banner-actions">
              <Link to="/register" className="guest-banner-btn guest-banner-btn--primary">Sign up</Link>
              <Link to="/login" className="guest-banner-btn">Log in</Link>
            </div>
          </div>
        ) : todaysMood ? (
          <div className="mood-today-logged">
            <span className="mood-today-emoji">{moodMeta(todaysMood.mood).emoji}</span>
            <div>
              <p className="mood-today-label">Today: <strong>{moodMeta(todaysMood.mood).label}</strong></p>
              {todaysMood.note && <p className="mood-today-note">"{todaysMood.note}"</p>}
            </div>
          </div>
        ) : (
          <form className="reflect-mood-form" onSubmit={handleLog}>
            <span className="reflect-mood-prompt">How are you feeling today?</span>
            <div className="mood-quick-btns mood-quick-btns--compact">
              {MOOD_OPTIONS.map((opt) => (
                <motion.button
                  key={opt.value}
                  type="button"
                  className={`mood-quick-btn${selectedMood === opt.value ? " active" : ""}`}
                  style={{ "--mood-color": opt.color }}
                  onClick={() => setSelectedMood(selectedMood === opt.value ? null : opt.value)}
                  title={opt.label}
                  {...tapAnim}
                >
                  <span className="mood-quick-emoji">{opt.emoji}</span>
                  <span className="mood-quick-label">{opt.label}</span>
                </motion.button>
              ))}
            </div>
            <AnimatePresence>
              {selectedMood && (
                <motion.div
                  className="mood-note-row"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <input
                    className="task-input"
                    type="text"
                    placeholder="Add a note (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <motion.button className="task-add-btn" type="submit" disabled={submitting} {...tapAnim}>
                    {submitting ? "…" : "Log"}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        )}
      </motion.div>

      {/* ── Daily prediction widget ── */}
      {!isGuest && (
        <motion.div
          className="prediction-widget"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          {!todayReflection?.predictedMood ? (
            <>
              <span className="prediction-prompt">Predict your mood for today</span>
              <div className="prediction-mood-row">
                {REFLECTION_MOOD_OPTIONS.map(({ value, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    className="prediction-mood-btn"
                    onClick={() => upsertReflection({ date: getTodayStr(), predictedMood: value })}
                    title={value}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          ) : !todayReflection?.actualMood ? (
            <>
              <div className="prediction-set-row">
                <span className="prediction-prompt">
                  Predicted: {reflMoodMeta(todayReflection.predictedMood).emoji} {reflMoodMeta(todayReflection.predictedMood).label}
                </span>
                <span className="prediction-divider">·</span>
                <span className="prediction-prompt prediction-prompt--soft">How did today actually go?</span>
              </div>
              <div className="prediction-mood-row">
                {REFLECTION_MOOD_OPTIONS.map(({ value, emoji }) => (
                  <button
                    key={value}
                    type="button"
                    className="prediction-mood-btn"
                    onClick={() => upsertReflection({
                      date: getTodayStr(),
                      predictedMood: todayReflection.predictedMood,
                      actualMood: value,
                    })}
                    title={value}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="prediction-result">
              <span className="prediction-result-emoji">{reflMoodMeta(todayReflection.predictedMood).emoji}</span>
              <span className="prediction-arrow">→</span>
              <span className="prediction-result-emoji">{reflMoodMeta(todayReflection.actualMood).emoji}</span>
              <span className="prediction-match-label">
                {todayReflection.predictedMood === todayReflection.actualMood
                  ? "Spot on!"
                  : `Predicted ${reflMoodMeta(todayReflection.predictedMood).label}, was ${reflMoodMeta(todayReflection.actualMood).label}`}
              </span>
              {predAccuracy !== null && (
                <span className="prediction-accuracy-inline">
                  {predAccuracy}% accurate over {reflWithBoth.length} days
                </span>
              )}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        className="reflect-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="reflect-grid">

          {/* ── Tasks ── */}
          <StatCard title="Actions" delay={0.12}>
            <p className="reflect-meta">
              {ratedTotal - 1 > 0 ? `${ratedTotal - 1} rated` : "No ratings yet"}
            </p>
            {ratedTotal <= 1 ? (
              <EmptyState message="Complete actions and rate your alignment to see patterns here." />
            ) : (
              <>
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">Alignment</span>
                  <div className="align-bar" style={{ marginTop: 8 }}>
                    {alignCounts.off     > 0 && <div className="align-seg align-seg-off"     style={{ flex: alignCounts.off }} />}
                    {alignCounts.neutral > 0 && <div className="align-seg align-seg-neutral" style={{ flex: alignCounts.neutral }} />}
                    {alignCounts.aligned > 0 && <div className="align-seg align-seg-aligned" style={{ flex: alignCounts.aligned }} />}
                  </div>
                  <div className="align-legend">
                    <span style={{ color: "#ff5a5a" }}>Off {alignCounts.off}</span>
                    <span style={{ color: "#ffc83c" }}>Neutral {alignCounts.neutral}</span>
                    <span style={{ color: "#64dc82" }}>Aligned {alignCounts.aligned}</span>
                  </div>
                </div>

                {(energyCounts.low + energyCounts.medium + energyCounts.high) > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Energy</span>
                    {["low", "medium", "high"].map((level) =>
                      energyCounts[level] > 0 && (
                        <DataBar key={level} label={level.charAt(0).toUpperCase() + level.slice(1)} value={energyCounts[level]} max={maxEnergy} color={ENERGY_COLORS[level]} />
                      )
                    )}
                  </div>
                )}

                {recentIntents.length > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Recent intent</span>
                    <ul className="reflect-intents">
                      {recentIntents.map((intent, i) => (
                        <li key={i} className="reflect-intent-item">"{intent}"</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prod && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">This week</span>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-soft)", margin: 0 }}>
                      {prod.completedThisWeek ?? 0} completed · {prod.overdueCount ?? 0} overdue
                    </p>
                  </div>
                )}
              </>
            )}
          </StatCard>

          {/* ── Journal ── */}
          <StatCard title="Reflection Log" delay={0.18}>
            <p className="reflect-meta">
              {jf ? `${jf.entriesThisWeek ?? 0} this week · ${jf.entriesThisMonth ?? 0} this month` : "—"}
            </p>
            {recentMoodTrail.length === 0 ? (
              <EmptyState message="Add mood when writing notes to see patterns here." />
            ) : (
              <>
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">Mood trail</span>
                  <div className="mood-dots">
                    {recentMoodTrail.map((val, i) => (
                      <div
                        key={i}
                        className="mood-dot"
                        title={MOOD_EMOJIS[val]}
                        style={{ background: MOOD_COLORS[val] }}
                      />
                    ))}
                  </div>
                </div>

                <div className="reflect-subsection reflect-averages">
                  {avgMoodNum != null && (
                    <div className="reflect-avg">
                      <span className="reflect-avg-emoji">{MOOD_EMOJIS[Math.round(avgMoodNum)]}</span>
                      <span className="reflect-avg-label">avg mood</span>
                    </div>
                  )}
                  {avgClarity != null && (
                    <div className="reflect-avg">
                      <span className="reflect-avg-num">{Number(avgClarity).toFixed(1)}<span className="reflect-avg-denom">/5</span></span>
                      <span className="reflect-avg-label">avg clarity</span>
                    </div>
                  )}
                </div>

                {mentalStateCounts.length > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Mental states</span>
                    <div className="state-chips">
                      {mentalStateCounts.map(([state, count]) => (
                        <span key={state} className="state-chip">
                          {state} <span className="state-chip-count">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </StatCard>

          {/* ── Calendar (local) ── */}
          <StatCard title="Calendar" delay={0.24}>
            <p className="reflect-meta">{ratedEvents.length} / {events.length} events rated</p>
            {ratedEvents.length === 0 ? (
              <EmptyState message="Rate how past events actually felt to see patterns here." />
            ) : (
              <>
                {calAccuracy !== null && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Prediction accuracy</span>
                    <div className="reflect-accuracy">
                      <span className="reflect-big-stat">{calAccuracy}%</span>
                      <span className="reflect-accuracy-note">of {withExpected.length} predicted events matched</span>
                    </div>
                  </div>
                )}
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">How events actually felt</span>
                  {FEELINGS.map((f) =>
                    feelingCounts[f] > 0 && (
                      <DataBar key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} value={feelingCounts[f]} max={maxFeeling} color={FEELING_COLORS[f]} />
                    )
                  )}
                </div>
              </>
            )}
          </StatCard>

          {/* ── Mood summary ── */}
          <StatCard title="Mood" delay={0.30}>
            {!ms ? (
              <EmptyState message={loading ? "Loading…" : "Not enough data yet."} />
            ) : (
              <>
                <p className="reflect-meta">
                  {ms.totalEntries ?? 0} entries
                  {trend && (
                    <span style={{ color: trend.color, marginLeft: 8 }}>{trend.icon} {ms.trend}</span>
                  )}
                </p>
                {ms.averageScore != null && (
                  <div className="reflect-subsection reflect-averages">
                    <div className="reflect-avg">
                      <span className="reflect-avg-emoji">{MOOD_EMOJIS[Math.round(ms.averageScore)]}</span>
                      <span className="reflect-avg-num">{Number(ms.averageScore).toFixed(1)}<span className="reflect-avg-denom">/5</span></span>
                      <span className="reflect-avg-label">avg mood</span>
                    </div>
                  </div>
                )}
                {ms.moodCounts && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Breakdown</span>
                    <div className="state-chips">
                      {Object.entries(ms.moodCounts).map(([mood, count]) => (
                        <span key={mood} className="state-chip">{mood} <span className="state-chip-count">{count}</span></span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </StatCard>

          {/* ── Habits streaks ── */}
          <StatCard title="Habits" delay={0.36}>
            {!hc ? (
              <EmptyState message={loading ? "Loading…" : "Not enough data yet."} />
            ) : (
              <>
                <p className="reflect-meta">
                  {hc.overallConsistencyRate != null ? `${Math.round(hc.overallConsistencyRate)}% overall consistency` : "—"}
                </p>
                {str?.habits?.length > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Streaks</span>
                    {str.habits.map((h) => (
                      <div key={h._id ?? h.name} className="data-row">
                        <span className="data-row-label" style={{ width: "auto", flex: 1, color: "var(--text)" }}>{h.name}</span>
                        <span className="data-row-count" style={{ width: "auto" }}>🔥 {h.currentStreak ?? 0}</span>
                      </div>
                    ))}
                  </div>
                )}
                {hc.habits?.length > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Consistency</span>
                    {hc.habits.map((h) => {
                      const rate = Math.round(h.consistencyRate ?? 0);
                      return (
                        <div key={h._id ?? h.name} className="data-row">
                          <span className="data-row-label" style={{ width: "auto", flex: 1, color: "var(--text)" }}>{h.name}</span>
                          <div className="data-bar-track" style={{ maxWidth: 80 }}>
                            <div className="data-bar" style={{ width: `${rate}%`, background: "var(--accent-2)" }} />
                          </div>
                          <span className="data-row-count">{rate}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </StatCard>

          {/* ── This Week ── */}
          <StatCard title="This Week" delay={0.42}>
            {!wk ? (
              <EmptyState message={loading ? "Loading…" : "Not enough data yet."} />
            ) : (
              <div className="reflect-subsection">
                {[
                  { label: "Actions completed", value: wk.tasksCompleted, trend: wk.tasksTrend },
                  { label: "Mood average",       value: wk.moodAverage != null ? `${Number(wk.moodAverage).toFixed(1)}/5` : "—", trend: wk.moodTrend },
                  { label: "Notes written",      value: wk.journalEntries, trend: wk.journalTrend },
                ].map(({ label, value, trend: t }) => {
                  const tm = t ? TREND_MAP[t] : null;
                  return (
                    <div key={label} className="data-row">
                      <span className="data-row-label" style={{ flex: 1, color: "var(--text-soft)" }}>{label}</span>
                      <span className="data-row-count" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {value ?? 0}
                        {tm && <span style={{ color: tm.color, fontSize: "0.9em" }}>{tm.icon}</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </StatCard>

          {/* ── Patterns ── */}
          <StatCard title="Patterns" delay={0.48}>
            {!corr ? (
              <EmptyState message={loading ? "Loading…" : "Log data for 7+ days to see patterns."} />
            ) : corr.daysAnalyzed < 5 ? (
              <EmptyState message={`${corr.daysAnalyzed} days of data — keep going to unlock patterns.`} />
            ) : (
              <div className="reflect-subsection">
                {[
                  {
                    label: "Completing actions",
                    dir: corr.taskVsMood?.direction,
                    high: corr.taskVsMood?.moodOnHighTaskDays,
                    low:  corr.taskVsMood?.moodOnLowTaskDays,
                  },
                  {
                    label: "Doing habits",
                    dir: corr.habitVsMood?.direction,
                    high: corr.habitVsMood?.moodOnHighHabitDays,
                    low:  corr.habitVsMood?.moodOnLowHabitDays,
                  },
                  {
                    label: "Writing with clarity",
                    dir: corr.clarityVsMood?.direction,
                    high: corr.clarityVsMood?.moodWhenHighClarity,
                    low:  corr.clarityVsMood?.moodWhenLowClarity,
                  },
                ].map(({ label, dir, high, low }) => {
                  const meta = CORR_DIR[dir] ?? CORR_DIR.insufficient_data;
                  return (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div className="data-row">
                        <span className="data-row-label" style={{ flex: 1, color: "var(--text)" }}>{label}</span>
                        <span style={{ fontSize: "0.78rem", color: meta.color }}>{meta.label}</span>
                      </div>
                      {high != null && low != null && dir !== "insufficient_data" && (
                        <p style={{ fontSize: "0.76rem", color: "var(--text-soft)", margin: "2px 0 0", opacity: 0.7 }}>
                          mood {Number(high).toFixed(1)} on high days vs {Number(low).toFixed(1)} on low
                        </p>
                      )}
                    </div>
                  );
                })}
                <p style={{ fontSize: "0.72rem", color: "var(--text-soft)", opacity: 0.45, marginTop: 8 }}>
                  Based on {corr.daysAnalyzed} days of data
                </p>
              </div>
            )}
          </StatCard>

          {/* ── Prediction accuracy ── */}
          <StatCard title="Prediction" delay={0.54}>
            {reflWithBoth.length === 0 ? (
              <EmptyState message="Predict your daily mood to track accuracy over time." />
            ) : (
              <>
                <p className="reflect-meta">{reflWithBoth.length} prediction{reflWithBoth.length !== 1 ? "s" : ""} recorded</p>
                {predAccuracy !== null && (
                  <div className="reflect-subsection reflect-averages">
                    <div className="reflect-avg">
                      <span className="reflect-avg-num">{predAccuracy}<span className="reflect-avg-denom">%</span></span>
                      <span className="reflect-avg-label">prediction accuracy</span>
                    </div>
                  </div>
                )}
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">Recent</span>
                  <div className="mood-dots">
                    {reflections
                      .filter((r) => r.predictedMood && r.actualMood)
                      .slice(0, 14)
                      .map((r, i) => (
                        <div
                          key={i}
                          className="mood-dot"
                          title={`Predicted ${r.predictedMood}, was ${r.actualMood}`}
                          style={{
                            background: r.predictedMood === r.actualMood ? "#64dc82" : "#ffc83c",
                            borderRadius: r.predictedMood === r.actualMood ? "50%" : "3px",
                          }}
                        />
                      ))}
                  </div>
                </div>
              </>
            )}
          </StatCard>

        </div>
      </motion.div>
    </PageShell>
  );
}
