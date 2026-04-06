import { useEffect, useState } from "react";

export default function useJournal() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("elarion-journal");
    return savedEntries ? JSON.parse(savedEntries) : [];
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    localStorage.setItem("elarion-journal", JSON.stringify(entries));
  }, [entries]);

  function handleAddEntry(e) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) return;

    const newEntry = {
      id: Date.now(),
      title: trimmedTitle || "Untitled Note",
      content: trimmedContent,
      createdAt: new Date().toLocaleString(),
    };

    setEntries((prev) => [newEntry, ...prev]);
    setTitle("");
    setContent("");
    setSelectedId(newEntry.id);
  }

  function handleDeleteEntry(id) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  const selectedEntry =
    entries.find((entry) => entry.id === selectedId) || entries[0] || null;

  return {
    entries,
    title,
    setTitle,
    content,
    setContent,
    selectedId,
    setSelectedId,
    selectedEntry,
    handleAddEntry,
    handleDeleteEntry,
  };
}