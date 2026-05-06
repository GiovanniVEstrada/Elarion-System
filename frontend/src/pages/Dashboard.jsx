import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
import { useTasksContext } from "../context/TasksContext";
import { useHabitsContext } from "../context/HabitsContext";
import { getTodayStr, formatTime } from "../utils/dateUtils";
import { useAuth } from "../context/AuthContext";

// ── MOCK DATA — delete this block (and the three _eff_* lines below) when real data flows ──
const _mn = new Date();
const _MOCK_EVENTS = [
  { _id: "m-evt-1", title: "Morning alignment block", date: getTodayStr(),
    time: `${_mn.getHours()}:${String(_mn.getMinutes()).padStart(2, "0")}` },
];
const _MOCK_TASKS = [
  { _id: "m-task-1", title: "Write project proposal",      completed: false, priority: "high"   },
  { _id: "m-task-2", title: "Review design system notes",  completed: false                     },
  { _id: "m-task-3", title: "Send weekly update",          completed: false, priority: "medium" },
];
const _MOCK_HABITS = [
  { _id: "m-hab-1", name: "Morning journal", active: true, completedDates: [] },
  { _id: "m-hab-2", name: "Evening walk",    active: true, completedDates: [] },
];
// ── END MOCK ─────────────────────────────────────────────────────────────────────────────────

const DAY_ABBRS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const CELL_W = 46;
const CELL_GAP = 6;
const CELL_STEP = CELL_W + CELL_GAP;      // 52
const WAVE_W = 7 * CELL_W + 6 * CELL_GAP; // 358
const WAVE_H = 34;

function toLocalDateStr(d) {
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isNow(timeStr) {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(":").map(Number);
  const eventMin = h * 60 + (m || 0);
  const now = new Date();
  return Math.abs(eventMin - (now.getHours() * 60 + now.getMinutes())) <= 90;
}

function buildWavePath(xs, ys) {
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const mx = ((xs[i] + xs[i + 1]) / 2).toFixed(1);
    d += ` C ${mx} ${ys[i].toFixed(1)}, ${mx} ${ys[i + 1].toFixed(1)}, ${xs[i + 1].toFixed(1)} ${ys[i + 1].toFixed(1)}`;
  }
  return d;
}

function TideRibbon() {
  const todayStr = getTodayStr();

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() + i - 3);
      return d;
    }), [todayStart]);

  const xs = days.map((_, i) => i * CELL_STEP + CELL_W / 2);
  const ys = days.map((_, i) => WAVE_H / 2 + Math.sin(i * Math.PI / 3) * (WAVE_H * 0.32));
  const pathD = buildWavePath(xs, ys);

  return (
    <div className="tide-ribbon-wrap">
      <div className="tide-ribbon">
        {days.map((d) => {
          const dateStr = toLocalDateStr(d);
          const isToday = dateStr === todayStr;
          const isPast = d < todayStart;
          return (
            <div
              key={dateStr}
              className={[
                "tide-day",
                isToday && "tide-day--today",
                isPast && !isToday && "tide-day--past",
              ].filter(Boolean).join(" ")}
            >
              <span className="tide-day-label">{DAY_ABBRS[d.getDay()]}</span>
              <span className="tide-day-num">{d.getDate()}</span>
            </div>
          );
        })}
      </div>

      <svg
        className="tide-wave"
        width={WAVE_W}
        height={WAVE_H}
        viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
        aria-hidden="true"
      >
        <defs>
          <filter id="tide-node-glow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wave line */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(78, 205, 196, 0.18)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Nodes */}
        {days.map((d, i) => {
          const dateStr = toLocalDateStr(d);
          const isToday = dateStr === todayStr;
          const isPast = d < todayStart;
          return (
            <circle
              key={dateStr}
              cx={xs[i]}
              cy={ys[i]}
              r={isToday ? 5 : 3.5}
              fill={
                isToday
                  ? "#4ecdc4"
                  : isPast
                  ? "rgba(78, 205, 196, 0.2)"
                  : "rgba(78, 205, 196, 0.4)"
              }
              filter={isToday ? "url(#tide-node-glow)" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}

function AgendaCard({ item, active, soon }) {
  const DOT_COLOR = {
    task:  "var(--accent)",
    event: "var(--accent-teal)",
    habit: "var(--accent-3)",
  };
  const TYPE_LABEL = { task: "Action", event: "Event", habit: "Habit" };

  return (
    <div className={[
      "agenda-card",
      active && "agenda-card--active",
      soon && "agenda-card--soon",
    ].filter(Boolean).join(" ")}>
      <span
        className="agenda-type-dot"
        style={{ background: DOT_COLOR[item._type] }}
        aria-label={TYPE_LABEL[item._type]}
      />
      <span className="agenda-title">{item.title ?? item.name}</span>
      {item.time && (
        <span className="agenda-time">{formatTime(item.time)}</span>
      )}
      {item._type === "task" && item.priority && (
        <span className="agenda-badge">{item.priority}</span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { events } = useCalendarContext();
  const { tasks } = useTasksContext();
  const { habits, completedToday } = useHabitsContext();

  const todayStr = getTodayStr();
  const today    = new Date();

  // ── delete these three lines with the mock block above when real data flows ──
  const _eff_events = events.length === 0 ? _MOCK_EVENTS : events;
  const _eff_tasks  = tasks.length  === 0 ? _MOCK_TASKS  : tasks;
  const _eff_habits = habits.length === 0 ? _MOCK_HABITS : habits;
  // ────────────────────────────────────────────────────────────────────────────

  const todayEvents = useMemo(
    () => _eff_events.filter((e) => e.date === todayStr),
    [_eff_events, todayStr]
  );

  const pendingTasks = useMemo(
    () => _eff_tasks.filter((t) => !t.completed),
    [_eff_tasks]
  );

  const pendingHabits = useMemo(
    () => _eff_habits.filter((h) => h.active !== false && !completedToday(h)),
    [_eff_habits, completedToday]
  );

  const nowItems = useMemo(
    () => todayEvents.filter((e) => isNow(e.time)).map((e) => ({ ...e, _type: "event" })),
    [todayEvents]
  );

  const nowIds = useMemo(() => new Set(nowItems.map((e) => e._id)), [nowItems]);

  const todayItems = useMemo(() => [
    ...todayEvents.filter((e) => !nowIds.has(e._id)).map((e) => ({ ...e, _type: "event" })),
    ...pendingTasks.map((t) => ({ ...t, _type: "task" })),
  ], [todayEvents, nowIds, pendingTasks]);

  const soonItems = useMemo(
    () => pendingHabits.slice(0, 5).map((h) => ({ ...h, _type: "habit" })),
    [pendingHabits]
  );

  const heroDate    = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const greeting    = getGreeting();
  const hasAnything = nowItems.length > 0 || todayItems.length > 0 || soonItems.length > 0;

  return (
    <div className="home-page">
      <TideRibbon />

      <motion.header
        className="home-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: "easeOut" }}
      >
        <div className="home-hero-inner">
          <p className="home-hero-kicker">Today</p>
          <h1 className="home-hero-date">{heroDate}</h1>
          <p className="home-hero-sub">{greeting}{user?.name ? `, ${user.name}` : ""}</p>
        </div>
        <Link to="/settings" className="home-settings-btn" aria-label="Settings">⚙</Link>
      </motion.header>

      <motion.div
        className={`agenda-section${hasAnything ? " agenda-section--timeline" : ""}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4, ease: "easeOut" }}
      >
        {nowItems.length > 0 && (
          <div className="agenda-group">
            <p className="agenda-group-label agenda-group-label--now">Now</p>
            {nowItems.map((item) => (
              <AgendaCard key={item._id} item={item} active />
            ))}
          </div>
        )}

        {todayItems.length > 0 && (
          <div className="agenda-group">
            <p className="agenda-group-label agenda-group-label--today">Today</p>
            {todayItems.map((item) => (
              <AgendaCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {soonItems.length > 0 && (
          <div className="agenda-group">
            <p className="agenda-group-label agenda-group-label--soon">Soon</p>
            {soonItems.map((item) => (
              <AgendaCard key={item._id} item={item} soon />
            ))}
          </div>
        )}

        {!hasAnything && (
          <div className="agenda-empty">
            <p className="agenda-empty-headline">The tide is still.</p>
            <p className="agenda-empty-sub">Add an action or calendar event to begin your day.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
