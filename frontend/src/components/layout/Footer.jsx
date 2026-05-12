import { useTasksContext } from "../../context/TasksContext";
import { useJournalContext } from "../../context/JournalContext";
import { useCalendarContext } from "../../context/CalendarContext";
import logo from "../../assets/g_logo.png";

export default function Footer() {
  const { tasks } = useTasksContext();
  const { entries } = useJournalContext();
  const { events } = useCalendarContext();

  return (
    <footer className="footer">
      <div className="footer-brand">
        <span className="footer-name">Luren</span>
        <span className="footer-tagline">by Elarion · Track. Reflect. Evolve.</span>
      </div>
      <img src={logo} alt="" className="footer-stamp" />
      <p className="footer-stats">
        {tasks.length} tasks · {entries.length} entries · {events.length} events
      </p>
    </footer>
  );
}
