export default function App() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Elarion</h1>
          <p>{today}</p>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-card">
          <h2>Tasks</h2>
          <p>Your task system will go here.</p>
        </section>

        <section className="dashboard-card">
          <h2>Journal</h2>
          <p>Your journal system will go here.</p>
        </section>

        <section className="dashboard-card">
          <h2>Calendar</h2>
          <p>Your calendar system will go here.</p>
        </section>
      </main>
    </div>
  );
}