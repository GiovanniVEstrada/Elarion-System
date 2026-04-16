import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";
import client from "../api/client";

const MOOD_EMOJIS  = ["", "😔", "😕", "😐", "🙂", "😊"];
const MOOD_COLORS  = ["", "#ff5a5a", "#ff9a5a", "#ffc83c", "#8de88d", "#64dc82"];
const ENERGY_COLORS = { low: "#64dc82", medium: "#ffc83c", high: "#ff5a5a" };
const FEELING_COLORS = { energizing: "#64dc82", neutral: "var(--accent)", necessary: "#ffc83c", draining: "#ff5a5a" };
const FEELINGS = ["energizing", "neutral", "necessary", "draining"];

const TREND_MAP = {
  improving: { icon: "↑", color: "#64dc82" },
  stable:    { icon: "—", color: "var(--text-soft)" },
  declining: { icon: "↓", color: "#ff5a5a" },
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

export default function Reflect() {
  const { events } = useCalendarContext();
  const [insights, setInsights] = useState({
    productivity: null,
    streaks: null,
    journalFrequency: null,
    habitConsistency: null,
    moodSummary: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      client.get("/insights/productivity"),
      client.get("/insights/streaks"),
      client.get("/insights/journal-frequency"),
      client.get("/insights/habit-consistency"),
      client.get("/insights/mood-summary"),
    ]).then(([prod, str, jf, hc, ms]) => {
      setInsights({
        productivity:      prod.status   === "fulfilled" ? prod.value.data   : null,
        streaks:           str.status    === "fulfilled" ? str.value.data    : null,
        journalFrequency:  jf.status     === "fulfilled" ? jf.value.data     : null,
        habitConsistency:  hc.status     === "fulfilled" ? hc.value.data     : null,
        moodSummary:       ms.status     === "fulfilled" ? ms.value.data     : null,
      });
      setLoading(false);
    });
  }, []);

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

  return (
    <PageShell>
      <SectionHeader
        kicker="Insights"
        title="Reflect"
        subtitle="Patterns from your actions — what your choices reveal over time."
      />

      <motion.div
        className="reflect-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="reflect-grid">

          {/* ── Tasks ── */}
          <StatCard title="Tasks" delay={0.12}>
            <p className="reflect-meta">
              {ratedTotal - 1 > 0 ? `${ratedTotal - 1} rated` : "No ratings yet"}
            </p>
            {ratedTotal <= 1 ? (
              <EmptyState message="Complete tasks and rate your alignment to see patterns here." />
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
          <StatCard title="Journal" delay={0.18}>
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

        </div>
      </motion.div>
    </PageShell>
  );
}
