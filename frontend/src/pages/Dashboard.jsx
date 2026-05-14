import { useMemo } from "react";
import { motion } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
import { useTasksContext } from "../context/TasksContext";
import { useHabitsContext } from "../context/HabitsContext";
import { getTodayStr, formatTime } from "../utils/dateUtils";
import { useAuth } from "../context/AuthContext";

const DAY_ABBRS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const CELL_W = 46;
const CELL_GAP = 6;
const CELL_STEP = CELL_W + CELL_GAP;
const WAVE_W = 7 * CELL_W + 6 * CELL_GAP;
const WAVE_H = 34;

// Dot color logic — matches Calendar.jsx palette
const DOT_BOTH  = "#ffffff";       // both events + tasks
const DOT_EVENT = "#4ecdc4";       // teal — event
const DOT_TASK  = "#ffc83c";       // amber — action
const DOT_EMPTY = "rgba(78, 205, 196, 0.2)";
const DOT_FUTURE = "rgba(78, 205, 196, 0.4)";
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

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

function getDatePart(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function formatDueDate(value, todayStr) {
  const dateStr = getDatePart(value);
  if (!dateStr) return null;
  if (dateStr === todayStr) return "Due today";

  const formattedDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `Due ${formattedDate}`;
}

function getPriorityRank(priority) {
  return PRIORITY_RANK[priority] ?? PRIORITY_RANK.medium;
}

function getHabitStreak(habit) {
  return habit.currentStreak ?? habit.cachedStreak ?? habit.streak ?? 0;
}

function buildWavePath(xs, ys) {
  let d = `M ${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const mx = ((xs[i] + xs[i + 1]) / 2).toFixed(1);
    d += ` C ${mx} ${ys[i].toFixed(1)}, ${mx} ${ys[i + 1].toFixed(1)}, ${xs[i + 1].toFixed(1)} ${ys[i + 1].toFixed(1)}`;
  }
  return d;
}

function TideRibbon({ events, tasks }) {
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

  // Build per-date sets for quick lookup
  const eventDateSet = useMemo(() => {
    const s = new Set();
    events.forEach((e) => s.add(e.date));
    return s;
  }, [events]);

  const taskDateSet = useMemo(() => {
    const s = new Set();
    tasks.forEach((t) => {
      if (t.dueDate && !t.completed) {
        s.add(new Date(t.dueDate).toISOString().slice(0, 10));
      }
    });
    return s;
  }, [tasks]);

  const xs = days.map((_, i) => i * CELL_STEP + CELL_W / 2);
  const ys = days.map((_, i) => WAVE_H / 2 + Math.sin(i * Math.PI / 3) * (WAVE_H * 0.32));
  const pathD = buildWavePath(xs, ys);

  return (
    <div className="tide-ribbon-wrap">
      <div className="tide-ribbon">
        {days.map((d) => {
          const dateStr = toLocalDateStr(d);
          const isToday = dateStr === todayStr;
          const isPast  = d < todayStart;
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

        <path
          d={pathD}
          fill="none"
          stroke="rgba(78, 205, 196, 0.18)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {days.map((d, i) => {
          const dateStr  = toLocalDateStr(d);
          const isToday  = dateStr === todayStr;
          const isPast   = d < todayStart;
          const hasEvent = eventDateSet.has(dateStr);
          const hasTask  = taskDateSet.has(dateStr);

          let fill;
          if (isToday) {
            fill = "#4ecdc4";
          } else if (hasEvent && hasTask) {
            fill = DOT_BOTH;
          } else if (hasEvent) {
            fill = DOT_EVENT;
          } else if (hasTask) {
            fill = DOT_TASK;
          } else if (isPast) {
            fill = DOT_EMPTY;
          } else {
            fill = DOT_FUTURE;
          }

          return (
            <circle
              key={dateStr}
              cx={xs[i]}
              cy={ys[i]}
              r={isToday ? 5 : 3.5}
              fill={fill}
              filter={isToday ? "url(#tide-node-glow)" : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}

function AgendaCard({ item, active, habit, todayStr }) {
  const TYPE_LABEL = { task: "Action", event: "Event", habit: "Habit" };
  const dueDateLabel = item._type === "task" ? formatDueDate(item.dueDate, todayStr) : null;
  const priority = item.priority || "medium";
  const streak = getHabitStreak(item);

  return (
    <div className={[
      "agenda-card",
      active && "agenda-card--active",
      habit  && "agenda-card--habit",
    ].filter(Boolean).join(" ")}>
      <span
        className={`agenda-type-dot agenda-type-dot--${item._type}`}
        aria-label={TYPE_LABEL[item._type]}
      />
      <span className="agenda-title">{item.title ?? item.name}</span>
      {item._type === "event" && item.time && (
        <span className="agenda-time">{formatTime(item.time)}</span>
      )}
      {item._type === "task" && (
        <>
          <span className="agenda-badge agenda-badge--priority">{priority}</span>
          {dueDateLabel && (
            <span className="agenda-detail">{dueDateLabel}</span>
          )}
        </>
      )}
      {item._type === "habit" && (
        <span className="agenda-detail agenda-detail--streak">
          {streak} day{streak === 1 ? "" : "s"} streak
        </span>
      )}
    </div>
  );
}

function AgendaGroup({ label, labelClassName, items, emptyMessage, renderItem }) {
  return (
    <div className="agenda-group">
      <p className={`agenda-group-label ${labelClassName}`}>{label}</p>
      {items.length > 0 ? (
        items.map(renderItem)
      ) : (
        <p className="agenda-group-empty">{emptyMessage}</p>
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

  const todayEvents = useMemo(
    () => events.filter((e) => e.date === todayStr),
    [events, todayStr]
  );

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed),
    [tasks]
  );

  const pendingHabits = useMemo(
    () => habits.filter((h) => h.active !== false && !completedToday(h)),
    [habits, completedToday]
  );

  const nowItems = useMemo(
    () => todayEvents.filter((e) => isNow(e.time)).map((e) => ({ ...e, _type: "event" })),
    [todayEvents]
  );

  const nowIds = useMemo(() => new Set(nowItems.map((e) => e._id)), [nowItems]);

  const todayEventItems = useMemo(
    () => todayEvents
      .filter((e) => e.time && !nowIds.has(e._id))
      .sort((a, b) => a.time.localeCompare(b.time))
      .map((e) => ({ ...e, _type: "event" })),
    [todayEvents, nowIds]
  );

  const todayTaskItems = useMemo(
    () => pendingTasks
      .slice()
      .sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority))
      .map((t) => ({ ...t, _type: "task" })),
    [pendingTasks]
  );

  const habitItems = useMemo(
    () => pendingHabits
      .slice()
      .sort((a, b) => getHabitStreak(b) - getHabitStreak(a))
      .map((h) => ({ ...h, _type: "habit" })),
    [pendingHabits]
  );

  const heroDate    = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const greeting    = getGreeting();
  const hasAnything = nowItems.length > 0
    || todayEventItems.length > 0
    || todayTaskItems.length > 0
    || habitItems.length > 0;

  return (
    <div className="home-page app-mobile-frame">
      <TideRibbon events={events} tasks={tasks} />

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
      </motion.header>

      <motion.div
        className={`agenda-section${hasAnything ? " agenda-section--timeline" : ""}`}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4, ease: "easeOut" }}
      >
        {hasAnything ? (
          <>
            <AgendaGroup
              label="Now"
              labelClassName="agenda-group-label--now"
              items={nowItems}
              emptyMessage="Nothing scheduled right now"
              renderItem={(item) => (
                <AgendaCard key={`now-${item._id}`} item={item} active todayStr={todayStr} />
              )}
            />

            <AgendaGroup
              label="Today's Events"
              labelClassName="agenda-group-label--events"
              items={todayEventItems}
              emptyMessage="No events scheduled today"
              renderItem={(item) => (
                <AgendaCard key={`event-${item._id}`} item={item} todayStr={todayStr} />
              )}
            />

            <AgendaGroup
              label="Today's Tasks"
              labelClassName="agenda-group-label--tasks"
              items={todayTaskItems}
              emptyMessage="No tasks for today"
              renderItem={(item) => (
                <AgendaCard key={`task-${item._id}`} item={item} todayStr={todayStr} />
              )}
            />

            <AgendaGroup
              label="Habits"
              labelClassName="agenda-group-label--habits"
              items={habitItems}
              emptyMessage="All habits done"
              renderItem={(item) => (
                <AgendaCard key={`habit-${item._id}`} item={item} habit todayStr={todayStr} />
              )}
            />
          </>
        ) : (
          <div className="agenda-empty">
            <p className="agenda-empty-headline">The tide is still.</p>
            <p className="agenda-empty-sub">Add an action or calendar event to begin your day.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
