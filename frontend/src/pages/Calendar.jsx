import { motion, AnimatePresence } from "motion/react";
import { useCalendarContext } from "../context/CalendarContext";
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
  const W = 400, H = 20;
  const steps = 32;
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
    <svg
      className="cal-tide-line"
      viewBox="0 0 400 20"
      preserveAspectRatio="none"
      width="100%"
      height="20"
      aria-hidden="true"
    >
      <path
        d={CAL_WAVE_PATH}
        fill="none"
        stroke="rgba(78, 205, 196, 0.13)"
        strokeWidth="1.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Calendar() {
  const {
    eventTitle, setEventTitle,
    eventDate,  setEventDate,
    eventTime,  setEventTime,
    expectedFeeling, setExpectedFeeling,
    filter, setFilter,
    filteredEvents,
    upcomingCount, pastCount,
    handleAddEvent, handleDeleteEvent, handleSetActualFeeling,
    editingEventId, startEditingEvent, stopEditingEvent,
    formatDate, formatTime,
    selectedDay, setSelectedDay,
    currentMonth, prevMonth, nextMonth,
    getEventDatesInMonth,
  } = useCalendarContext();

  const { year, month } = currentMonth;
  const cells      = buildCalendarDays(year, month);
  const eventDates = getEventDatesInMonth(year, month);
  const todayStr   = getTodayStr();

  function handleDayClick(day) {
    const dateStr = toDateStr(year, month + 1, day);
    setSelectedDay((prev) => (prev === dateStr ? null : dateStr));
    setEventDate(dateStr);
  }

  return (
    <PageShell>
      <motion.header
        className="cal-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.36, ease: "easeOut" }}
      >
        <p className="cal-hero-kicker">{MONTHS[month]} {year}</p>
        <h1 className="cal-hero-title">A month of tides</h1>
      </motion.header>

      <motion.div
        className="calendar-page-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.38 }}
      >
        <div className="calendar-layout">

          {/* LEFT — Month Grid */}
          <div className="calendar-grid-panel">
            <div className="calendar-grid-header">
              <motion.button
                className="cal-nav-btn"
                type="button"
                aria-label="Previous month"
                onClick={prevMonth}
                {...hoverAnim}
                whileTap={{ scale: 0.96 }}
              >
                ←
              </motion.button>

              <span className="cal-month-label">{MONTHS[month]} {year}</span>

              <motion.button
                className="cal-nav-btn"
                type="button"
                aria-label="Next month"
                onClick={nextMonth}
                {...hoverAnim}
                whileTap={{ scale: 0.96 }}
              >
                →
              </motion.button>
            </div>

            <div className="calendar-day-names">
              {DAYS.map((d) => (
                <span key={d} className="cal-day-name">{d}</span>
              ))}
            </div>

            <CalTideLine />

            <div className="calendar-grid">
              {cells.map((cell, i) => {
                const dateStr    = cell.current ? toDateStr(year, month + 1, cell.day) : null;
                const isToday    = dateStr === todayStr;
                const isSelected = dateStr === selectedDay;
                const isPast     = dateStr && dateStr < todayStr && !isToday;
                const eventCount = dateStr ? (eventDates.get(dateStr) || 0) : 0;

                return (
                  <motion.button
                    key={i}
                    type="button"
                    className={[
                      "cal-day",
                      !cell.current                              ? "cal-day--outside"  : "",
                      cell.current && isToday                   ? "cal-day--today"    : "",
                      cell.current && isSelected && !isToday    ? "cal-day--selected" : "",
                      cell.current && isPast                    ? "cal-day--past"     : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => cell.current && handleDayClick(cell.day)}
                    whileHover={cell.current ? { scale: 1.08 } : {}}
                    whileTap={cell.current ? { scale: 0.95 } : {}}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="cal-day-num">{cell.day}</span>
                    {eventCount > 0 && (
                      <div className="cal-event-indicators">
                        {Array.from({ length: Math.min(eventCount, 3) }).map((_, idx) => (
                          <span key={idx} className="cal-event-dot" />
                        ))}
                        {eventCount > 3 && (
                          <span className="cal-event-count">+{eventCount - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Add / Edit Event + Event List */}
          <div className="calendar-side-panel">
            <div className="calendar-page-toolbar">
              <h2 className="cal-side-title">
                {editingEventId
                  ? "Edit Event"
                  : selectedDay ? formatDate(selectedDay) : "Add Event"}
              </h2>

              <form className="calendar-form calendar-form--stacked" onSubmit={handleAddEvent}>
                <input
                  className="calendar-input"
                  type="text"
                  placeholder="Event title..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    className="calendar-date-input"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="calendar-time-input"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>

                <div className="feeling-picker">
                  {FEELINGS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`feeling-btn${expectedFeeling === f ? " active" : ""}`}
                      style={{ "--feeling-color": FEELING_COLORS[f] }}
                      onClick={() => setExpectedFeeling(expectedFeeling === f ? null : f)}
                    >
                      {FEELING_LABELS[f]}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <motion.button
                    className="calendar-add-btn"
                    type="submit"
                    whileHover={{ y: -1, scale: 1.01 }}
                    {...tapAnim}
                  >
                    {editingEventId ? "Save Changes" : "Add Event"}
                  </motion.button>

                  {editingEventId && (
                    <motion.button
                      className="calendar-cancel-btn"
                      type="button"
                      onClick={stopEditingEvent}
                      {...hoverAnim}
                      {...tapAnim}
                    >
                      Cancel
                    </motion.button>
                  )}
                </div>
              </form>
            </div>

            <div className="calendar-page-list-wrap">
              {!selectedDay && !editingEventId && (
                <div className="calendar-page-controls">
                  <div className="calendar-filter-group">
                    {["all", "upcoming", "past"].map((f) => (
                      <motion.button
                        key={f}
                        type="button"
                        className={filter === f ? "calendar-filter-btn active" : "calendar-filter-btn"}
                        onClick={() => setFilter(f)}
                        {...hoverAnim}
                        {...tapAnim}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                  <div className="calendar-page-stats">
                    <span>{upcomingCount} upcoming</span>
                    <span>{pastCount} past</span>
                  </div>
                </div>
              )}

              {selectedDay && !editingEventId && (
                <motion.button
                  className="cal-clear-day-btn"
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  {...hoverAnim}
                  {...tapAnim}
                >
                  ← Show all events
                </motion.button>
              )}

              {filteredEvents.length === 0 ? (
                <div className="cal-empty">
                  <p className="cal-empty-headline">Still waters.</p>
                  <p className="cal-empty-sub">
                    {selectedDay ? "No events on this day." : "No events in this view."}
                  </p>
                </div>
              ) : (
                <ul className="calendar-list">
                  <AnimatePresence>
                    {filteredEvents.map((event) => (
                      <EventItem
                        key={event._id}
                        event={event}
                        onDelete={handleDeleteEvent}
                        onEdit={startEditingEvent}
                        onSetActualFeeling={handleSetActualFeeling}
                        formatDate={formatDate}
                        formatTime={formatTime}
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </PageShell>
  );
}
