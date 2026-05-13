const GUEST_SEED_KEY = "guest_seeded_at";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const GUEST_KEYS = [
  "guest_tasks",
  "guest_journal_entries",
  "guest_journal_folders",
  "guest_habits",
  "guest_moods",
  "guest_reflections",
  "guest_calendar",
];

let _checked = false;

// Clears all guest localStorage data if 24 hours have passed since first seed.
// The _checked flag ensures this only runs once per page load regardless of
// how many hooks call it.
export function checkGuestExpiry() {
  if (_checked) return;
  _checked = true;
  const ts = localStorage.getItem(GUEST_SEED_KEY);
  if (!ts || Date.now() - parseInt(ts, 10) > EXPIRY_MS) {
    GUEST_KEYS.forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem(GUEST_SEED_KEY);
  }
}

// Called by the first hook that seeds data. Subsequent calls are no-ops so
// the timestamp stays anchored to the original seed time.
export function markGuestDataSeeded() {
  if (!localStorage.getItem(GUEST_SEED_KEY)) {
    localStorage.setItem(GUEST_SEED_KEY, String(Date.now()));
  }
}
