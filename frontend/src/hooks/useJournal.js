import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

const MOOD_TO_STRING = { 1: "awful", 2: "bad", 3: "neutral", 4: "good", 5: "great" };
const MOOD_TO_NUM    = { awful: 1, bad: 2, neutral: 3, good: 4, great: 5 };

function normalizeEntry(e) {
  return { ...e, mood: typeof e.mood === "string" ? MOOD_TO_NUM[e.mood] ?? null : e.mood };
}

const GUEST_ENTRIES_KEY = "guest_journal_entries";
const GUEST_FOLDERS_KEY = "guest_journal_folders";
const sanitizeEntryId = (e) => ({ ...e, _id: typeof e._id === "number" ? `guest_${e._id}` : (e._id ?? `guest_${crypto.randomUUID()}`) });
const sanitizeFolderId = (f) => ({ ...f, id: typeof f.id === "number" ? `folder_${f.id}` : (f.id ?? crypto.randomUUID()) });
const guestLoadEntries  = () => { try { return (JSON.parse(localStorage.getItem(GUEST_ENTRIES_KEY) || "[]")).map(sanitizeEntryId); } catch { return []; } };
const guestLoadFolders  = () => { try { return (JSON.parse(localStorage.getItem(GUEST_FOLDERS_KEY) || "[]")).map(sanitizeFolderId); } catch { return []; } };
const guestSaveEntries  = (e) => localStorage.setItem(GUEST_ENTRIES_KEY, JSON.stringify(e));
const guestSaveFolders  = (f) => localStorage.setItem(GUEST_FOLDERS_KEY, JSON.stringify(f));

export default function useJournal() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState(null);
  const [clarity, setClarity] = useState(null);
  const [mentalState, setMentalState] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [folders, setFolders] = useState([]);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async () => {
    if (!isAuthenticated) {
      const saved = guestLoadEntries();
      setEntries(saved);
      setFolders(guestLoadFolders());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await client.get("/journal", { params: { limit: 100 } });
      const normalized = (res.data.data ?? res.data).map(normalizeEntry);
      setEntries(normalized);

      const seen = new Set();
      const derived = [];
      normalized.forEach((e) => {
        if (e.folder && !seen.has(e.folder)) {
          seen.add(e.folder);
          derived.push({ id: e.folder, name: e.folder });
        }
      });
      setFolders(derived);
    } catch (err) {
      console.error("Failed to fetch journal entries", err);
      setError(err.response?.data?.message || "Failed to load journal entries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading) return;
    fetchEntries();
  }, [fetchEntries, authLoading]);

  // ── Filtered list ────────────────────────────────────────────────

  const filteredEntries = entries
    .filter((e) => activeFolder === null || e.folder === activeFolder)
    .filter((e) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (e.title || "").toLowerCase().includes(q) || (e.content || "").toLowerCase().includes(q);
    });

  // ── Folder helpers ───────────────────────────────────────────────

  function handleAddFolder() {
    const name = newFolderName.trim();
    if (!name) { setAddingFolder(false); return; }
    if (!folders.find((f) => f.name === name)) {
      const updated = [...folders, { id: name, name }];
      setFolders(updated);
      if (!isAuthenticated) guestSaveFolders(updated);
    }
    setNewFolderName("");
    setAddingFolder(false);
  }

  async function handleDeleteFolder(folderName) {
    const affected = entries.filter((e) => e.folder === folderName);
    const updatedEntries = entries.map((e) => e.folder === folderName ? { ...e, folder: null } : e);
    const updatedFolders = folders.filter((f) => f.id !== folderName);
    setEntries(updatedEntries);
    setFolders(updatedFolders);
    if (activeFolder === folderName) setActiveFolder(null);

    if (!isAuthenticated) {
      guestSaveEntries(updatedEntries);
      guestSaveFolders(updatedFolders);
      return;
    }
    try {
      await Promise.all(affected.map((e) => client.patch(`/journal/${e._id}`, { folder: null })));
    } catch (err) {
      console.error("Failed to remove folder from entries", err);
    }
  }

  // ── Edit mode ────────────────────────────────────────────────────

  function startEditing(id) {
    const entry = entries.find((e) => e._id === id);
    if (!entry) return;
    setTitle(entry.title || "");
    setContent(entry.content || "");
    setMood(entry.mood || null);
    setClarity(entry.clarity || null);
    setMentalState(entry.mentalState || null);
    setEditingId(id);
  }

  function stopEditing() {
    setEditingId(null);
    setTitle(""); setContent(""); setMood(null); setClarity(null); setMentalState(null);
  }

  // ── CRUD ─────────────────────────────────────────────────────────

  async function handleAddEntry(e) {
    e.preventDefault();
    const trimmedTitle   = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle && !trimmedContent) return;

    const payload = {
      title:       trimmedTitle || "Untitled Note",
      content:     trimmedContent,
      mood:        mood ? MOOD_TO_STRING[mood] : undefined,
      clarity:     clarity ?? undefined,
      mentalState: mentalState ?? undefined,
      folder:      activeFolder ?? undefined,
    };

    if (!isAuthenticated) {
      if (editingId) {
        const updated = entries.map((en) =>
          en._id === editingId ? { ...en, ...payload, mood } : en
        );
        setEntries(updated);
        guestSaveEntries(updated);
        stopEditing();
      } else {
        const created = {
          _id: `guest_${crypto.randomUUID()}`,
          ...payload,
          mood,
          createdAt: new Date().toISOString(),
        };
        const updated = [created, ...entries];
        setEntries(updated);
        guestSaveEntries(updated);
        if (created.folder && !folders.find((f) => f.id === created.folder)) {
          const updatedFolders = [...folders, { id: created.folder, name: created.folder }];
          setFolders(updatedFolders);
          guestSaveFolders(updatedFolders);
        }
        setSelectedId(created._id);
        setTitle(""); setContent(""); setMood(null); setClarity(null); setMentalState(null);
      }
      return;
    }

    try {
      if (editingId) {
        const res = await client.patch(`/journal/${editingId}`, payload);
        const updated = normalizeEntry(res.data.data ?? res.data);
        setEntries((prev) => prev.map((en) => en._id === editingId ? updated : en));
        stopEditing();
      } else {
        const res = await client.post("/journal", payload);
        const created = normalizeEntry(res.data.data ?? res.data);
        setEntries((prev) => [created, ...prev]);
        if (created.folder && !folders.find((f) => f.id === created.folder)) {
          setFolders((prev) => [...prev, { id: created.folder, name: created.folder }]);
        }
        setSelectedId(created._id);
        setTitle(""); setContent(""); setMood(null); setClarity(null); setMentalState(null);
      }
    } catch (err) {
      console.error("Failed to save journal entry", err);
    }
  }

  async function handleUpdateEntry(id, patch) {
    if (!isAuthenticated) {
      const updated = entries.map((e) => e._id === id ? { ...e, ...patch } : e);
      setEntries(updated);
      guestSaveEntries(updated);
      return;
    }
    try {
      const res = await client.patch(`/journal/${id}`, patch);
      const updated = normalizeEntry(res.data.data ?? res.data);
      setEntries((prev) => prev.map((e) => e._id === id ? updated : e));
    } catch (err) {
      console.error("Failed to update entry", err);
    }
  }

  async function handleDeleteEntry(id) {
    const updated = entries.filter((e) => e._id !== id);
    setEntries(updated);
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) stopEditing();
    if (!isAuthenticated) { guestSaveEntries(updated); return; }
    try {
      await client.delete(`/journal/${id}`);
    } catch (err) {
      console.error("Failed to delete entry", err);
      fetchEntries();
    }
  }

  const selectedEntry = entries.find((e) => e._id === selectedId) || entries[0] || null;

  const activeFolderId    = activeFolder;
  const setActiveFolderId = setActiveFolder;

  return {
    entries,
    filteredEntries,
    loading,
    error,
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
    handleUpdateEntry,
    handleDeleteEntry,
    refetch: fetchEntries,
  };
}
