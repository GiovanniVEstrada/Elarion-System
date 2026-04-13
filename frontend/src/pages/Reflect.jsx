import { useMemo } from "react";
import { motion } from "motion/react";
import { useTasksContext } from "../context/TasksContext";
import { useJournalContext } from "../context/JournalContext";
import { useCalendarContext } from "../context/CalendarContext";
import PageShell from "../components/layout/PageShell";
import SectionHeader from "../components/layout/SectionHeader";

const MOOD_EMOJIS = ["", "😔", "😕", "😐", "🙂", "😊"];
const MOOD_COLORS = ["", "#ff5a5a", "#ff9a5a", "#ffc83c", "#8de88d", "#64dc82"];
const ENERGY_COLORS = { low: "#64dc82", medium: "#ffc83c", high: "#ff5a5a" };
const FEELING_COLORS = { energizing: "#64dc82", neutral: "var(--accent)", necessary: "#ffc83c", draining: "#ff5a5a" };
const FEELINGS = ["energizing", "neutral", "necessary", "draining"];

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

export default function Reflect() {
  const { tasks } = useTasksContext();
  const { entries } = useJournalContext();
  const { events } = useCalendarContext();

  // ── Tasks stats ──────────────────────────────────────────────────
  const taskStats = useMemo(() => {
    const ratedTasks = tasks.filter((t) => t.alignmentScore !== null);
    const counts = { off: 0, neutral: 0, aligned: 0 };
    ratedTasks.forEach((t) => {
      if (t.alignmentScore === 1) counts.off++;
      else if (t.alignmentScore === 2) counts.neutral++;
      else if (t.alignmentScore === 3) counts.aligned++;
    });

    const energyCounts = { low: 0, medium: 0, high: 0 };
    tasks.forEach((t) => { if (t.energyLevel) energyCounts[t.energyLevel]++; });
    const maxEnergy = Math.max(...Object.values(energyCounts), 1);

    const recentIntents = tasks
      .filter((t) => t.intent && t.intent.trim())
      .slice(0, 5)
      .map((t) => t.intent);

    return { ratedTasks, counts, energyCounts, maxEnergy, recentIntents, total: tasks.length };
  }, [tasks]);

  // ── Journal stats ────────────────────────────────────────────────
  const journalStats = useMemo(() => {
    const moodEntries = entries.filter((e) => e.mood);
    const clarityEntries = entries.filter((e) => e.clarity);

    const avgMood = moodEntries.length
      ? (moodEntries.reduce((s, e) => s + e.mood, 0) / moodEntries.length).toFixed(1)
      : null;
    const avgClarity = clarityEntries.length
      ? (clarityEntries.reduce((s, e) => s + e.clarity, 0) / clarityEntries.length).toFixed(1)
      : null;

    const recentMoods = entries.filter((e) => e.mood).slice(0, 12);

    const stateCounts = {};
    entries.forEach((e) => {
      if (e.mentalState) stateCounts[e.mentalState] = (stateCounts[e.mentalState] || 0) + 1;
    });
    const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);

    return { moodEntries, avgMood, avgClarity, recentMoods, sortedStates, total: entries.length };
  }, [entries]);

  // ── Calendar stats ───────────────────────────────────────────────
  const calendarStats = useMemo(() => {
    const ratedEvents = events.filter((e) => e.actualFeeling);
    const withExpected = ratedEvents.filter((e) => e.expectedFeeling);
    const matched = withExpected.filter((e) => e.expectedFeeling === e.actualFeeling).length;
    const accuracy = withExpected.length
      ? Math.round((matched / withExpected.length) * 100)
      : null;

    const feelingCounts = { energizing: 0, neutral: 0, necessary: 0, draining: 0 };
    ratedEvents.forEach((e) => {
      if (feelingCounts[e.actualFeeling] !== undefined) feelingCounts[e.actualFeeling]++;
    });
    const maxFeeling = Math.max(...Object.values(feelingCounts), 1);

    return { ratedEvents, withExpected, accuracy, feelingCounts, maxFeeling, total: events.length };
  }, [events]);

  const { ratedTasks, counts, energyCounts, maxEnergy, recentIntents } = taskStats;
  const ratedTotal = ratedTasks.length || 1;

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
              {ratedTasks.length} / {taskStats.total} rated
            </p>

            {ratedTasks.length === 0 ? (
              <EmptyState message="Complete tasks and rate your alignment to see patterns here." />
            ) : (
              <>
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">Alignment</span>
                  <div className="align-bar" style={{ marginTop: 8 }}>
                    {counts.off > 0 && (
                      <div className="align-seg align-seg-off" style={{ flex: counts.off }} />
                    )}
                    {counts.neutral > 0 && (
                      <div className="align-seg align-seg-neutral" style={{ flex: counts.neutral }} />
                    )}
                    {counts.aligned > 0 && (
                      <div className="align-seg align-seg-aligned" style={{ flex: counts.aligned }} />
                    )}
                  </div>
                  <div className="align-legend">
                    <span style={{ color: "#ff5a5a" }}>Off {counts.off}</span>
                    <span style={{ color: "#ffc83c" }}>Neutral {counts.neutral}</span>
                    <span style={{ color: "#64dc82" }}>Aligned {counts.aligned}</span>
                  </div>
                </div>

                {(energyCounts.low + energyCounts.medium + energyCounts.high) > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Energy</span>
                    {["low", "medium", "high"].map((level) => (
                      energyCounts[level] > 0 && (
                        <div key={level} className="data-row">
                          <span className="data-row-label" style={{ color: ENERGY_COLORS[level] }}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </span>
                          <div className="data-bar-track">
                            <div
                              className="data-bar"
                              style={{
                                width: `${(energyCounts[level] / maxEnergy) * 100}%`,
                                background: ENERGY_COLORS[level],
                              }}
                            />
                          </div>
                          <span className="data-row-count">{energyCounts[level]}</span>
                        </div>
                      )
                    ))}
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
              </>
            )}
          </StatCard>

          {/* ── Journal ── */}
          <StatCard title="Journal" delay={0.18}>
            <p className="reflect-meta">
              {journalStats.moodEntries.length} / {journalStats.total} with mood data
            </p>

            {journalStats.moodEntries.length === 0 ? (
              <EmptyState message="Add mood and state when writing notes to see patterns here." />
            ) : (
              <>
                <div className="reflect-subsection">
                  <span className="reflect-sublabel">Mood trail</span>
                  <div className="mood-dots">
                    {journalStats.recentMoods.map((entry, i) => (
                      <div
                        key={i}
                        className="mood-dot"
                        title={MOOD_EMOJIS[entry.mood]}
                        style={{ background: MOOD_COLORS[entry.mood] }}
                      />
                    ))}
                  </div>
                </div>

                <div className="reflect-subsection reflect-averages">
                  {journalStats.avgMood && (
                    <div className="reflect-avg">
                      <span className="reflect-avg-emoji">{MOOD_EMOJIS[Math.round(Number(journalStats.avgMood))]}</span>
                      <span className="reflect-avg-label">avg mood</span>
                    </div>
                  )}
                  {journalStats.avgClarity && (
                    <div className="reflect-avg">
                      <span className="reflect-avg-num">{journalStats.avgClarity}<span className="reflect-avg-denom">/5</span></span>
                      <span className="reflect-avg-label">avg clarity</span>
                    </div>
                  )}
                </div>

                {journalStats.sortedStates.length > 0 && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Mental states</span>
                    <div className="state-chips">
                      {journalStats.sortedStates.map(([state, count]) => (
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

          {/* ── Calendar ── */}
          <StatCard title="Calendar" delay={0.24}>
            <p className="reflect-meta">
              {calendarStats.ratedEvents.length} / {calendarStats.total} events rated
            </p>

            {calendarStats.ratedEvents.length === 0 ? (
              <EmptyState message="Rate how past events actually felt to see patterns here." />
            ) : (
              <>
                {calendarStats.accuracy !== null && (
                  <div className="reflect-subsection">
                    <span className="reflect-sublabel">Prediction accuracy</span>
                    <div className="reflect-accuracy">
                      <span className="reflect-big-stat">{calendarStats.accuracy}%</span>
                      <span className="reflect-accuracy-note">
                        of {calendarStats.withExpected.length} predicted events matched how they felt
                      </span>
                    </div>
                  </div>
                )}

                <div className="reflect-subsection">
                  <span className="reflect-sublabel">How events actually felt</span>
                  {FEELINGS.map((f) => (
                    calendarStats.feelingCounts[f] > 0 && (
                      <div key={f} className="data-row">
                        <span className="data-row-label" style={{ color: FEELING_COLORS[f] }}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </span>
                        <div className="data-bar-track">
                          <div
                            className="data-bar"
                            style={{
                              width: `${(calendarStats.feelingCounts[f] / calendarStats.maxFeeling) * 100}%`,
                              background: FEELING_COLORS[f],
                            }}
                          />
                        </div>
                        <span className="data-row-count">{calendarStats.feelingCounts[f]}</span>
                      </div>
                    )
                  ))}
                </div>
              </>
            )}
          </StatCard>

        </div>
      </motion.div>
    </PageShell>
  );
}
