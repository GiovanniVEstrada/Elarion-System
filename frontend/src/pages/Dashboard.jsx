import TaskCard from "../features/tasks/TaskCard";
import JournalCard from "../features/journal/JournalCard";
import CalendarCard from "../features/calendar/CalendarCard";

export default function Dashboard() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-title-group">
          <h1>Elarion</h1>
          <p>{today}</p>
        </div>
      </header>

      <main className="dashboard-main">
        <TaskCard />
        <JournalCard />
        <CalendarCard />
      </main>
    </div>
  );
}