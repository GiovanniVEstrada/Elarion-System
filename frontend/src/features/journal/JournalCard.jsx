import { useEffect, useState } from "react";

export default function JournalCard() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("elarion-journal");

    if (savedEntries) {
      return JSON.parse(savedEntries);
    }

    return [];
  });

  const [newEntry, setNewEntry] = useState("");

  useEffect(() => {
    localStorage.setItem("elarion-journal", JSON.stringify(entries));
  }, [entries]);

  function handleAddEntry(e) {
    e.preventDefault();

    const trimmedEntry = newEntry.trim();
    if (!trimmedEntry) return;

    const entry = {
      id: Date.now(),
      text: trimmedEntry,
      createdAt: new Date().toLocaleString(),
    };

    setEntries([entry, ...entries]);
    setNewEntry("");
  }

  function handleDeleteEntry(id) {
    setEntries(entries.filter((entry) => entry.id !== id));
  }

  return (
    <section className="dashboard-card">
      <span className="card-kicker">Reflection</span>
      <h2>Journal</h2>

      <form className="journal-form" onSubmit={handleAddEntry}>
        <textarea
          className="journal-textarea"
          placeholder="Write a reflection..."
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          rows="5"
        />
        <button className="journal-add-btn" type="submit">
          Save Entry
        </button>
      </form>

      <div className="journal-list">
        {entries.length === 0 ? (
            <p className="journal-empty">No journal entries yet.</p>
        ) : (
            <article className="journal-entry">
            <p className="journal-entry-text">{entries[0].text}</p>
            <div className="journal-entry-footer">
                <span className="journal-entry-date">
                {entries[0].createdAt}
                </span>
                <button
                className="journal-delete-btn"
                onClick={() => handleDeleteEntry(entries[0].id)}
                >
                Delete
                </button>
            </div>
            </article>
        )}
        </div>
    </section>
  );
}