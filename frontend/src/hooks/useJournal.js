import { useEffect, useState } from "react";

export default function useJournal() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("elarion-journal");
    return savedEntries ? JSON.parse(savedEntries) : [];
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    localStorage.setItem("elarion-journal", JSON.stringify(entries));
  }, [entries]);

  const filteredEntries = searchQuery.trim()
    ? entries.filter((e) => {
        const q = searchQuery.toLowerCase();
        return e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
      })
    : entries;

  function startEditing(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    setTitle(entry.title);
    setContent(entry.content);
    setEditingId(id);
  }

  function stopEditing() {
    setEditingId(null);
    setTitle("");
    setContent("");
  }

  function handleAddEntry(e) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle && !trimmedContent) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? { ...entry, title: trimmedTitle || "Untitled Note", content: trimmedContent }
            : entry
        )
      );
      stopEditing();
      return;
    }

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
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) stopEditing();
  }

  const selectedEntry =
    entries.find((entry) => entry.id === selectedId) || entries[0] || null;

  return {
    entries,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    title,
    setTitle,
    content,
    setContent,
    selectedId,
    setSelectedId,
    editingId,
    startEditing,
    stopEditing,
    selectedEntry,
    handleAddEntry,
    handleDeleteEntry,
  };
}
