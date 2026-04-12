import { useEffect, useState } from "react";

export default function useJournal() {
  const [entries, setEntries] = useState(() => {
    const savedEntries = localStorage.getItem("elarion-journal");
    return savedEntries ? JSON.parse(savedEntries) : [];
  });

  const [folders, setFolders] = useState(() => {
    return JSON.parse(localStorage.getItem("elarion-folders") || "[]");
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(null);
  const [clarity, setClarity] = useState(null);
  const [mentalState, setMentalState] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    localStorage.setItem("elarion-journal", JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem("elarion-folders", JSON.stringify(folders));
  }, [folders]);

  const filteredEntries = entries
    .filter((e) => activeFolderId === null || e.folderId === activeFolderId)
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
    });

  function handleAddFolder() {
    if (!newFolderName.trim()) {
      setAddingFolder(false);
      return;
    }
    setFolders((prev) => [...prev, { id: Date.now(), name: newFolderName.trim() }]);
    setNewFolderName("");
    setAddingFolder(false);
  }

  function handleDeleteFolder(id) {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setEntries((prev) =>
      prev.map((e) => (e.folderId === id ? { ...e, folderId: null } : e))
    );
    if (activeFolderId === id) setActiveFolderId(null);
  }

  function startEditing(id) {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood || null);
    setClarity(entry.clarity || null);
    setMentalState(entry.mentalState || null);
    setEditingId(id);
  }

  function stopEditing() {
    setEditingId(null);
    setTitle("");
    setContent("");
    setMood(null);
    setClarity(null);
    setMentalState(null);
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
            ? {
                ...entry,
                title: trimmedTitle || "Untitled Note",
                content: trimmedContent,
                mood,
                clarity,
                mentalState,
              }
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
      folderId: activeFolderId,
      mood,
      clarity,
      mentalState,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setTitle("");
    setContent("");
    setMood(null);
    setClarity(null);
    setMentalState(null);
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
    folders,
    activeFolderId,
    setActiveFolderId,
    addingFolder,
    setAddingFolder,
    newFolderName,
    setNewFolderName,
    handleAddFolder,
    handleDeleteFolder,
    searchQuery,
    setSearchQuery,
    title,
    setTitle,
    content,
    setContent,
    mood,
    setMood,
    clarity,
    setClarity,
    mentalState,
    setMentalState,
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
