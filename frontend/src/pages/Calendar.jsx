import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
import { useTasksContext } from "../context/TasksContext";
import PageShell from "../components/layout/PageShell";
import EventItem from "../components/items/EventItem";
import { getTodayStr, toDateStr } from "../utils/dateUtils";
import { tapAnim, hoverAnim } from "../utils/motion";

const DAYS    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS  = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const FEELINGS       = ["energizing", "neutral", "necessary", "draining"];
const FEELING_LABELS = { energizing: "Energizing", neutral: "Neutral", necessary: "Necessary", draining: "Draining" };
const FEELING_COLORS = { energizing: "#64dc82", neutral: "#74d8ff", necessary: "#ffc83c", draining: "#ff5a5a" };

const DOT_EVENT = "#4ecdc4";
const DOT_TASK  = "#ffc83c";

// Day timeline constants
const DAY_START_HOUR = 6;   // 6 AM
const DAY_END_HOUR   = 23;  // 11 PM
const HOUR_PX        = 64;  // pixels per hour

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(minutes, startHour = DAY_START_HOUR) {
  return ((minutes - startHour * 60) / 60) * HOUR_PX;
}

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "am" : "pm";
  const h12  = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

function buildCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false });
  for (let d = 1; d <= daysInMonth; d++)  cells.push({ day: d, current: true  });
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++)    cells.push({ day: d, current: false });
  return cells;
}

function buildCalWavePath() {
  const W = 400, H = 20, steps = 32;
  const pts = Array.from({ length: steps + 1 }, (_, i) => [
    (i / steps) * W,
    H / 2 + Math.sin((i / steps) * Math.PI * 2 * 3) * 5,
  ]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) / 2).toFixed(1);
    d += ` C ${mx} ${pts[i][1].toFixed(1)}, ${mx} ${pts[i+1][1].toFixed(1)}, ${pts[i+1][0].toFixed(1)} ${pts[i+1][1].toFixed(1)}`;
  }
  return d;
}

const CAL_WAVE_PATH = buildCalWavePath();

function CalTideLine() {
  return (
    <svg className="cal-tide-line" viewBox="0 0 400 20" preserveAspectRatio="none" width="100%" height="20" aria-hidden="true">
      <path d={CAL_WAVE_PATH} fill="none" stroke="rgba(78, 205, 196, 0.13)" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function fmtModalDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Day View ─────────────────────────────────────────────────────────────────

function DayTimeline({ dateStr, events, tasks, onEditEvent, onDeleteEvent, onSetActualFeeling, formatDate, formatTime, onOpenAdd }) {
  const totalPx    = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX;
  const hours      = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i);

  const todayNow   = new Date();
  const nowMinutes = todayNow.toISOString().slice(0, 10) === dateStr
    ? todayNow.getHours() * 60 + todayNow.getMinutes()
    : null;

  const dayEvents = events.filter((e) => e.date === dateStr);
  const dayTasks  = tasks.filter((t) => t.dueDate?.slice(0, 10) === dateStr && !t.completed);

  // Separate timed vs. all-day events
  const timedEvents   = dayEvents.filter((e) => e.time);
  const allDayEvents  = dayEvents.filter((e) => !e.time);

  const FEELING_COLORS_MAP = { energizing: "#64dc82", neutral: "#74d8ff", necessary: "#ffc83c", draining: "#ff5a5a" };

  return (
    <div className="tide-panel day-timeline-wrap">

      {/* All-day strip */}
      {(allDayEvents.length > 0 || dayTasks.length > 0) && (
        <div className="day-allday-strip">
          <span className="day-allday-label">All day</span>
          <div className="day-allday-items">
            {allDayEvents.map((ev) => (
              <div key={ev._id} className="day-allday-event" style={{ borderColor: FEELING_COLORS_MAP[ev.expectedFeeling] || DOT_EVENT }}>
                {ev.title}
              </div>
            ))}
            {dayTasks.map((t) => (
              <div key={t._id} className="day-allday-action">◆ {t.title}</div>
            ))}
          </div>
        </div>
      )}

      {/* Hour grid */}
      <div className="day-timeline" style={{ height: `${totalPx}px` }}>

        {/* Hour lines + labels */}
        {hours.map((h) => (
          <div
            key={h}
            className="day-hour-row"
            style={{ top: `${(h - DAY_START_HOUR) * HOUR_PX}px` }}
          >
            <span className="day-hour-label">{fmt12(`${String(h).padStart(2, "0")}:00`)}</span>
            <div className="day-hour-line" />
          </div>
        ))}

        {/* Now indicator */}
        {nowMinutes != null && nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= DAY_END_HOUR * 60 && (
          <div className="day-now-line" style={{ top: `${minutesToPx(nowMinutes)}px` }}>
            <span className="day-now-dot" />
          </div>
        )}

        {/* Timed events */}
        {timedEvents.map((ev) => {
          const startMin = timeToMinutes(ev.time);
          const endMin   = ev.endTime ? timeToMinutes(ev.endTime) : startMin + 45;
          const clampedStart = Math.max(startMin, DAY_START_HOUR * 60);
          const clampedEnd   = Math.min(endMin,   DAY_END_HOUR   * 60);
          const top    = minutesToPx(clampedStart);
          const height = Math.max(((clampedEnd - clampedStart) / 60) * HOUR_PX, 28);
          const color  = FEELING_COLORS_MAP[ev.expectedFeeling] || DOT_EVENT;

          return (
            <div
              key={ev._id}
              className="day-event-block"
              style={{ top: `${top}px`, height: `${height}px`, borderColor: color, background: `${color}18` }}
            >
              <div className="day-event-block-inner">
                <span className="day-event-block-title">{ev.title}</span>
                <span className="day-event-block-time">
                  {fmt12(ev.time)}{ev.endTime ? ` – ${fmt12(ev.endTime)}` : ""}
                </span>
              </div>
              <div className="day-event-block-actions">
                <button type="button" className="cal-event-edit-btn" onClick={() => onEditEvent(ev._id)}>Edit</button>
                <button type="button" className="cal-event-del-btn" onClick={() => onDeleteEvent(ev._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {dayEvents.length === 0 && dayTasks.length === 0 && (
        <div className="cal-empty" style={{ paddingTop: "40px" }}>
          <p className="cal-empty-headline">Still water.</p>
          <p className="cal-empty-sub">Nothing scheduled. Add an event or action below.</p>
        </div>
      )}
    </div>
  );
}

// ── Day Agenda Panel (below month grid) ──────────────────────────────────────

function DayAgendaPanel({ dateStr, events, tasks, onEdit, onDelete, onAdd, onTimeline, onClear }) {
  const FEELING_CLR = { energizing: "#64dc82", neutral: "#74d8ff", necessary: "#ffc83c", draining: "#ff5a5a" };

  const dateLabel = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const dayEvents = events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return -1;
      if (!b.time) return 1;
      return a.time.localeCompare(b.time);
    });

  const dayTasks = tasks.filter((t) => t.dueDate?.slice(0, 10) === dateStr && !t.completed);
  const total    = dayEvents.length + dayTasks.length;

  return (
    <motion.div
      className="cal-day-agenda"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {/* Header row */}
      <div className="cal-day-agenda-head">
        <div className="cal-day-agenda-headleft">
          <p className="cal-day-agenda-label">{dateLabel}</p>
          {total > 0 && (
            <p className="cal-day-agenda-count">{total} item{total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="cal-day-agenda-btns">
          <motion.button type="button" className="cal-add-day-btn" onClick={onAdd} {...tapAnim}>
            + Add
          </motion.button>
          <motion.button type="button" className="cal-agenda-timeline-btn" onClick={onTimeline} {...tapAnim}>
            Timeline →
          </motion.button>
          <button type="button" className="cal-agenda-close-btn" onClick={onClear} aria-label="Close">×</button>
        </div>
      </div>

      {/* Content */}
      {total === 0 ? (
        <div className="cal-day-agenda-empty">
          <p className="cal-day-agenda-empty-text">Still water — nothing here yet.</p>
        </div>
      ) : (
        <div className="cal-day-agenda-list">
          {dayEvents.map((ev) => {
            const color = FEELING_CLR[ev.expectedFeeling] || DOT_EVENT;
            return (
              <motion.div
                key={ev._id}
                className="cal-agenda-row"
                style={{ "--row-color": color }}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
              >
                <div className="cal-agenda-row-bar" />
                <div className="cal-agenda-row-body">
                  <span className="cal-agenda-row-title">{ev.title}</span>
                  <span className="cal-agenda-row-time">
                    {ev.time ? fmt12(ev.time) : "All day"}
                    {ev.time && ev.endTime ? ` – ${fmt12(ev.endTime)}` : ""}
                  </span>
                </div>
                <div className="cal-agenda-row-actions">
                  <button type="button" className="cal-agenda-icon-btn" onClick={() => onEdit(ev._id)} title="Edit">✎</button>
                  <button type="button" className="cal-agenda-icon-btn cal-agenda-icon-btn--danger" onClick={() => onDelete(ev._id)} title="Delete">×</button>
                </div>
              </motion.div>
            );
          })}
          {dayTasks.map((t) => (
            <motion.div
              key={t._id}
              className="cal-agenda-row cal-agenda-row--task"
              style={{ "--row-color": DOT_TASK }}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className="cal-agenda-row-bar" />
              <div className="cal-agenda-row-body">
                <span className="cal-agenda-row-title">{t.title}</span>
                <span className="cal-agenda-row-type">Action</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Add / Edit Modal ──────────────────────────────────────────────────────────

function AddModal({ dateStr, onClose, onAddEvent, onAddAction, editEvent, onUpdateEvent }) {
  const isEdit = Boolean(editEvent);
  const [step, setStep]           = useState(isEdit ? "event" : "pick");
  const [evtTitle, setEvtTitle]   = useState(editEvent?.title ?? "");
  const [evtTime, setEvtTime]     = useState(editEvent?.time ?? "");
  const [evtEndTime, setEvtEndTime] = useState(editEvent?.endTime ?? "");
  const [evtFeeling, setEvtFeeling] = useState(editEvent?.expectedFeeling ?? null);
  const [actTitle, setActTitle]   = useState("");
  const [busy, setBusy]           = useState(false);

  async function handleEventSubmit(e) {
    e.preventDefault();
    if (!evtTitle.trim() || busy) return;
    setBusy(true);
    if (isEdit) {
      await onUpdateEvent(editEvent._id, { title: evtTitle.trim(), date: dateStr, time: evtTime, endTime: evtEndTime, feeling: evtFeeling });
    } else {
      await onAddEvent({ title: evtTitle.trim(), date: dateStr, time: evtTime, endTime: evtEndTime, feeling: evtFeeling });
    }
    setBusy(false);
    onClose();
  }

  async function handleActionSubmit(e) {
    e.preventDefault();
    if (!actTitle.trim() || busy) return;
    setBusy(true);
    await onAddAction(actTitle.trim(), dateStr);
    setBusy(false);
    onClose();
  }

  return (
    <motion.div className="day-type-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="day-type-modal"
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="day-type-modal-close" onClick={onClose} type="button">×</button>
        <p className="day-type-modal-date">{fmtModalDate(dateStr)}</p>

        <AnimatePresence mode="wait">
          {step === "pick" && (
            <motion.div key="pick" className="day-type-choices" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.16 }}>
              <p className="day-type-modal-title">What are you adding?</p>
              <motion.button className="day-type-btn day-type-btn--event" type="button" onClick={() => setStep("event")} {...tapAnim}>
                <span className="day-type-btn-icon">◎</span>
                <div className="day-type-btn-info">
                  <span className="day-type-btn-label">Event</span>
                  <span className="day-type-btn-sub">Scheduled moment</span>
                </div>
              </motion.button>
              <motion.button className="day-type-btn day-type-btn--action" type="button" onClick={() => setStep("action")} {...tapAnim}>
                <span className="day-type-btn-icon" style={{ color: DOT_TASK }}>◆</span>
                <div className="day-type-btn-info">
                  <span className="day-type-btn-label">Action</span>
                  <span className="day-type-btn-sub">What needs doing</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {step === "event" && (
            <motion.form key="event" className="day-type-form" onSubmit={handleEventSubmit} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
              <p className="day-type-modal-title">{isEdit ? "Edit event" : "New event"}</p>
              <input id="evt-title" name="evt-title" className="calendar-input" type="text" placeholder="Event title…" value={evtTitle} onChange={(e) => setEvtTitle(e.target.value)} autoFocus autoComplete="off" />
              <div className="day-type-time-row">
                <div className="day-type-time-field">
                  <label htmlFor="evt-time" className="day-type-time-label">Start</label>
                  <input id="evt-time" name="evt-time" className="calendar-time-input" type="time" value={evtTime} onChange={(e) => setEvtTime(e.target.value)} />
                </div>
                <div className="day-type-time-sep">→</div>
                <div className="day-type-time-field">
                  <label htmlFor="evt-end-time" className="day-type-time-label">End</label>
                  <input id="evt-end-time" name="evt-end-time" className="calendar-time-input" type="time" value={evtEndTime} onChange={(e) => setEvtEndTime(e.target.value)} />
                </div>
              </div>
              <div className="feeling-picker">
                {FEELINGS.map((f) => (
                  <button key={f} type="button" className={`feeling-btn${evtFeeling === f ? " active" : ""}`} style={{ "--feeling-color": FEELING_COLORS[f] }} onClick={() => setEvtFeeling(evtFeeling === f ? null : f)}>
                    {FEELING_LABELS[f]}
                  </button>
                ))}
              </div>
              <div className="day-type-form-row">
                {!isEdit && <button type="button" className="day-type-back-btn" onClick={() => setStep("pick")}>← Back</button>}
                <motion.button className="calendar-add-btn" type="submit" style={{ flex: 1 }} disabled={busy} {...tapAnim}>
                  {isEdit ? "Save changes" : "Add event"}
                </motion.button>
              </div>
            </motion.form>
          )}

          {step === "action" && (
            <motion.form key="action" className="day-type-form" onSubmit={handleActionSubmit} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
              <p className="day-type-modal-title">New action</p>
              <input id="act-title" name="act-title" className="task-input" type="text" placeholder="What needs to be done?" value={actTitle} onChange={(e) => setActTitle(e.target.value)} autoFocus autoComplete="off" />
              <div className="day-type-form-row">
                <button type="button" className="day-type-back-btn" onClick={() => setStep("pick")}>← Back</button>
                <motion.button className="task-add-btn" type="submit" style={{ flex: 1 }} disabled={busy} {...tapAnim}>Add action</motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Main Calendar page ────────────────────────────────────────────────────────

export default function Calendar() {
  const [viewMode, setViewMode]   = useState("month");  // "month" | "day"
  const [dayDate, setDayDate]     = useState(() => getTodayStr());
  const [modalDate, setModalDate] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [sideFilter, setSideFilter] = useState("events");

  const {
    events,
    filter, setFilter,
    filteredEvents,
    upcomingCount, pastCount,
    handleDeleteEvent, handleSetActualFeeling,
    addEventDirect, editEventDirect,
    formatDate, formatTime,
    selectedDay, setSelectedDay,
    currentMonth, prevMonth, nextMonth,
    getEventDatesInMonth,
  } = useCalendarContext();

  const { tasks, addTaskWithDate } = useTasksContext();

  const { year, month } = currentMonth;
  const cells      = buildCalendarDays(year, month);
  const eventDates = getEventDatesInMonth(year, month);
  const todayStr   = getTodayStr();

  const taskDates = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (!t.dueDate || t.completed) return;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.toISOString().slice(0, 10);
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [tasks, year, month]);

  const datedTasks = useMemo(
    () => tasks.filter((t) => t.dueDate && !t.completed).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    [tasks]
  );

  const visibleTasks = useMemo(
    () => selectedDay ? datedTasks.filter((t) => t.dueDate?.slice(0, 10) === selectedDay) : datedTasks,
    [datedTasks, selectedDay]
  );

  function openModal(dateStr) {
    setEditEvent(null);
    setModalDate(dateStr ?? selectedDay ?? getTodayStr());
  }

  function openEdit(id) {
    const ev = events.find((e) => e._id === id);
    if (!ev) return;
    setEditEvent(ev);
    setModalDate(ev.date);
  }

  function closeModal() {
    setModalDate(null);
    setEditEvent(null);
  }

  function handleDayClick(day) {
    const dateStr = toDateStr(year, month + 1, day);
    if (selectedDay === dateStr) {
      setSelectedDay(null);
    } else {
      setSelectedDay(dateStr);
      setDayDate(dateStr);
    }
  }

  function zoomToDay(dateStr) {
    setDayDate(dateStr);
    setViewMode("day");
  }

  function prevDay() {
    const d = new Date(dayDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setDayDate(d.toISOString().slice(0, 10));
  }

  function nextDay() {
    const d = new Date(dayDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setDayDate(d.toISOString().slice(0, 10));
  }

  const dayDisplayLabel = dayDate
    ? new Date(dayDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    : "";

  // ── Month view ──────────────────────────────────────────────────────────────

  const monthView = (
    <motion.div className="calendar-page-shell" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.38 }}>
      <div className="calendar-layout">

        {/* LEFT — Month Grid */}
        <div className="tide-panel calendar-grid-panel">
          <div className="calendar-grid-header">
            <motion.button className="cal-nav-btn" type="button" aria-label="Previous month" onClick={prevMonth} {...hoverAnim} whileTap={{ scale: 0.96 }}>←</motion.button>
            <span className="cal-month-label">{MONTHS[month]} {year}</span>
            <motion.button className="cal-nav-btn" type="button" aria-label="Next month" onClick={nextMonth} {...hoverAnim} whileTap={{ scale: 0.96 }}>→</motion.button>
          </div>

          <div className="calendar-day-names">
            {DAYS.map((d) => <span key={d} className="cal-day-name">{d}</span>)}
          </div>

          <CalTideLine />

          <div className="calendar-grid">
            {cells.map((cell, i) => {
              const dateStr    = cell.current ? toDateStr(year, month + 1, cell.day) : null;
              const isToday    = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              const isPast     = dateStr && dateStr < todayStr && !isToday;
              const evtCount   = dateStr ? (eventDates.get(dateStr) || 0) : 0;
              const tskCount   = dateStr ? (taskDates.get(dateStr) || 0) : 0;
              const total      = evtCount + tskCount;
              const evtDots    = Math.min(evtCount, 2);
              const tskDots    = Math.min(tskCount, Math.max(0, 3 - evtDots));

              return (
                <motion.button
                  key={i}
                  type="button"
                  className={[
                    "cal-day",
                    !cell.current ? "cal-day--outside" : "",
                    cell.current && isToday ? "cal-day--today" : "",
                    cell.current && isSelected && !isToday ? "cal-day--selected" : "",
                    cell.current && isPast ? "cal-day--past" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => cell.current && handleDayClick(cell.day)}
                  whileHover={cell.current ? { scale: 1.08 } : {}}
                  whileTap={cell.current ? { scale: 0.95 } : {}}
                  transition={{ duration: 0.15 }}
                >
                  <span className="cal-day-num">{cell.day}</span>
                  {total > 0 && (
                    <div className="cal-event-indicators">
                      {Array.from({ length: evtDots }, (_, idx) => (
                        <span key={`e-${idx}`} className="cal-event-dot" style={{ background: DOT_EVENT }} />
                      ))}
                      {Array.from({ length: tskDots }, (_, idx) => (
                        <span key={`t-${idx}`} className="cal-event-dot" style={{ background: DOT_TASK }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="cal-legend">
            <span className="cal-legend-item"><span className="cal-event-dot" style={{ background: DOT_EVENT }} /> Event</span>
            <span className="cal-legend-item"><span className="cal-event-dot" style={{ background: DOT_TASK }} /> Action</span>
          </div>

          <AnimatePresence>
            {selectedDay && (
              <DayAgendaPanel
                dateStr={selectedDay}
                events={events}
                tasks={tasks}
                onEdit={openEdit}
                onDelete={handleDeleteEvent}
                onAdd={() => openModal(selectedDay)}
                onTimeline={() => zoomToDay(selectedDay)}
                onClear={() => setSelectedDay(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — Events / Actions list */}
        <div className="calendar-side-panel">
          <div className="calendar-page-controls">
            <div className="calendar-filter-group">
              {["events", "actions"].map((f) => (
                <motion.button key={f} type="button" className={sideFilter === f ? "calendar-filter-btn active" : "calendar-filter-btn"} onClick={() => setSideFilter(f)} {...hoverAnim} {...tapAnim}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>

            {selectedDay ? (
              <div className="calendar-page-stats">
                <span className="cal-side-day-label">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ) : (
              <div className="calendar-page-stats">
                {sideFilter === "events" && <><span>{upcomingCount} upcoming</span><span>{pastCount} past</span></>}
                {sideFilter === "actions" && <span>{datedTasks.length} scheduled</span>}
              </div>
            )}
          </div>

          {sideFilter === "events" && !selectedDay && (
            <div className="calendar-filter-group calendar-filter-group--sub">
              {["all", "upcoming", "past"].map((f) => (
                <motion.button key={f} type="button" className={filter === f ? "calendar-filter-btn active" : "calendar-filter-btn"} onClick={() => setFilter(f)} {...hoverAnim} {...tapAnim}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          )}

          {sideFilter === "events" && (
            <div className="tide-panel cal-list-glass">
              {filteredEvents.length === 0 ? (
                <div className="cal-empty">
                  <p className="cal-empty-headline">Still waters.</p>
                  <p className="cal-empty-sub">{selectedDay ? "No events on this day." : "No events in this view."}</p>
                </div>
              ) : (
                <ul className="calendar-list">
                  <AnimatePresence>
                    {filteredEvents.map((event) => (
                      <EventItem key={event._id} event={event} onDelete={handleDeleteEvent} onEdit={openEdit} onSetActualFeeling={handleSetActualFeeling} formatDate={formatDate} formatTime={formatTime} />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          )}

          {sideFilter === "actions" && (
            <div className="tide-panel cal-list-glass">
              {visibleTasks.length === 0 ? (
                <div className="cal-empty">
                  <p className="cal-empty-headline">Clear currents.</p>
                  <p className="cal-empty-sub">{selectedDay ? "No actions on this day." : "No scheduled actions ahead."}</p>
                </div>
              ) : (
                <ul className="calendar-list">
                  <AnimatePresence>
                    {visibleTasks.map((task) => (
                      <motion.li key={task._id} className="cal-action-item" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}>
                        <span className="cal-action-dot" style={{ background: DOT_TASK }} />
                        <div className="cal-action-body">
                          <span className="cal-event-title">{task.title}</span>
                          <span className="cal-event-meta">
                            {new Date(task.dueDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // ── Day view ────────────────────────────────────────────────────────────────

  const dayView = (
    <motion.div className="day-view-shell" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32 }}>
      <div className="day-view-header">
        <motion.button className="cal-nav-btn" type="button" onClick={() => setViewMode("month")} {...hoverAnim} whileTap={{ scale: 0.96 }}>← Month</motion.button>
        <div className="day-view-nav">
          <motion.button className="cal-nav-btn" type="button" onClick={prevDay} aria-label="Previous day" {...hoverAnim} whileTap={{ scale: 0.96 }}>←</motion.button>
          <span className="day-view-date-label">{dayDisplayLabel}</span>
          <motion.button className="cal-nav-btn" type="button" onClick={nextDay} aria-label="Next day" {...hoverAnim} whileTap={{ scale: 0.96 }}>→</motion.button>
        </div>
        <motion.button className="cal-add-day-btn" type="button" onClick={() => openModal(dayDate)} {...tapAnim}>+ Add</motion.button>
      </div>

      <DayTimeline
        dateStr={dayDate}
        events={events}
        tasks={tasks}
        onEditEvent={openEdit}
        onDeleteEvent={handleDeleteEvent}
        onSetActualFeeling={handleSetActualFeeling}
        formatDate={formatDate}
        formatTime={formatTime}
        onOpenAdd={openModal}
      />
    </motion.div>
  );

  return (
    <PageShell>
      <motion.header
        className="cal-hero tide-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <div className="cal-hero-row">
          <div>
            <p className="cal-hero-kicker tide-hero-kicker">{MONTHS[month]} {year}</p>
            <h1 className="cal-hero-title tide-hero-title">A month of tides</h1>
          </div>
          <div className="cal-view-toggle">
            <motion.button
              className={`cal-view-btn${viewMode === "month" ? " active" : ""}`}
              type="button"
              onClick={() => setViewMode("month")}
              {...tapAnim}
            >
              Month
            </motion.button>
            <motion.button
              className={`cal-view-btn${viewMode === "day" ? " active" : ""}`}
              type="button"
              onClick={() => { setDayDate(selectedDay || getTodayStr()); setViewMode("day"); }}
              {...tapAnim}
            >
              Day
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {viewMode === "month"
          ? <motion.div key="month">{monthView}</motion.div>
          : <motion.div key="day">{dayView}</motion.div>
        }
      </AnimatePresence>

      {/* FAB (month view only) */}
      {viewMode === "month" && (
        <motion.button className="task-fab" type="button" aria-label="Add event or action" onClick={() => openModal(null)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>+</motion.button>
      )}

      <AnimatePresence>
        {modalDate && (
          <AddModal dateStr={modalDate} onClose={closeModal} onAddEvent={addEventDirect} onAddAction={addTaskWithDate} editEvent={editEvent} onUpdateEvent={editEventDirect} />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
