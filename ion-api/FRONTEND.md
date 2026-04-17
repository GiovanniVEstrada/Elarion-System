# Ion API — Frontend Integration Guide

This document maps every part of the API to what your frontend needs to build, manage, and display. Each section covers the API calls involved, the state to track, and how the pieces connect to each other.

---

## Global Setup

### Base URL

Store this in one place (environment variable or config file):

```
VITE_API_URL=http://localhost:5000/api
```

### Auth Header

Every protected request needs this header. Set it globally — don't repeat it per-call:

```js
// axios example
axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
```

### Token Storage

Store the JWT after login/register. `localStorage` is fine for a personal project:

```js
localStorage.setItem("token", data.token);
```

On app load, read it back and rehydrate your auth state before rendering protected routes.

---

## Phase 1 — Auth

**API endpoints used:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

**State to manage:**
```
user: { _id, name, email } | null
token: string | null
isAuthenticated: boolean
loading: boolean
```

**Pages/components needed:**
- Register page — form with name, email, password
- Login page — form with email, password
- Protected route wrapper — redirect to login if no token
- Navbar/header — show user name, logout button

**Flow:**
1. User submits register or login form
2. On success: save token, set user in state, redirect to dashboard
3. On every app load: call `GET /auth/me` with stored token to verify session is still valid
4. Logout: clear token from localStorage, reset auth state, redirect to login

**Connection to rest of app:**
- Nothing else works until this is done. Token is required for every other request.

---

## Phase 2 — Dashboard (Insights Overview)

**API endpoints used:**
- `GET /api/insights/overview`

**State to manage:**
```
overview: {
  totalTasks, completedTasks, completionRate,
  totalJournalEntries, totalHabits, activeHabits
} | null
```

**Components needed:**
- Dashboard page — the first thing the user sees after login
- Stat cards — one per metric (e.g. "9 / 14 tasks complete", "64.3% rate")

**Flow:**
1. On dashboard mount: fetch `/insights/overview`
2. Render stat cards from response

**Connection to rest of app:**
- This is the hub. Every other section feeds into the numbers shown here.
- After any create/complete/delete action in tasks, habits, etc. — refetch overview to keep counts fresh.
- You can eventually add a "last updated" timestamp and auto-refresh.

---

## Phase 3 — Tasks

**API endpoints used:**
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

**Query params to expose in UI:**
- `?completed=true/false` — toggle between active and done
- `?priority=high/medium/low` — filter dropdown
- `?sort=dueDate` — sort selector
- `?page=&limit=` — pagination controls

**State to manage:**
```
tasks: Task[]
pagination: { total, page, limit, totalPages }
filters: { completed, priority, sort }
loading: boolean
```

**Components needed:**
- Tasks page
- Task list — renders each task
- Task card — shows title, priority badge, due date, completed checkbox
- Create task form — title (required), priority, category, due date
- Edit task modal or inline editing
- Filter/sort bar
- Pagination controls

**Flow:**
1. On mount: fetch `GET /api/tasks` with current filters
2. Checking the checkbox: `PATCH /api/tasks/:id` with `{ completed: true }`
3. Submitting create form: `POST /api/tasks`, prepend result to list
4. Delete: `DELETE /api/tasks/:id`, remove from list
5. Filter change: re-fetch with new query params, reset to page 1

**Connection to rest of app:**
- Completed task count feeds `/insights/overview` and `/insights/productivity`
- Overdue tasks (past due date, not completed) surface in `/insights/productivity`
- After any mutation, optionally refetch dashboard overview

---

## Phase 4 — Journal

**API endpoints used:**
- `GET /api/journal`
- `POST /api/journal`
- `GET /api/journal/:id`
- `PATCH /api/journal/:id`
- `DELETE /api/journal/:id`

**Query params to expose:**
- `?mood=` — mood filter dropdown
- `?tag=` — tag filter (text input or tag chip)
- `?sort=` — newest first / oldest first
- `?page=&limit=`

**State to manage:**
```
entries: JournalEntry[]
activeEntry: JournalEntry | null
pagination: { total, page, limit, totalPages }
filters: { mood, tag, sort }
```

**Components needed:**
- Journal page — two-panel layout works well (list on left, entry on right)
- Entry list — shows title, mood indicator, date
- Entry detail view — full content, tags, mood
- Write/edit form — title, content (textarea), mood selector, tag input
- Mood selector — visual buttons or dropdown for great/good/neutral/bad/awful
- Tag input — comma-separated or chip-style

**Flow:**
1. On mount: fetch entry list
2. Click entry: fetch `GET /api/journal/:id`, display in detail view
3. New entry: open form, `POST /api/journal`, refresh list
4. Edit: pre-fill form with existing data, `PATCH /api/journal/:id`
5. Delete: confirm dialog, `DELETE /api/journal/:id`, remove from list

**Connection to rest of app:**
- Entry count feeds dashboard overview
- Mood field on entries feeds `/insights/journal-frequency` (most common mood)
- Tags are a future filter surface for insights

---

## Phase 5 — Habits

**API endpoints used:**
- `GET /api/habits`
- `POST /api/habits`
- `PATCH /api/habits/:id`
- `DELETE /api/habits/:id`
- `POST /api/habits/:id/complete`

**Query params to expose:**
- `?active=true/false` — show active vs archived
- `?frequency=daily/weekly`

**State to manage:**
```
habits: Habit[]
pagination: { total, page, limit, totalPages }
filters: { active, frequency }
```

**Components needed:**
- Habits page
- Habit card — name, frequency badge, streak indicator, complete button
- Complete button — disabled if already completed today (check `completedDates` array)
- Create habit form — name, description, frequency
- Archive toggle (PATCH `active: false` instead of deleting)

**Flow:**
1. On mount: fetch `GET /api/habits?active=true`
2. Complete button: `POST /api/habits/:id/complete`
   - If 400 "already completed today" — mark button as done, don't show error to user
3. Archive: `PATCH /api/habits/:id` with `{ active: false }`
4. Delete: `DELETE /api/habits/:id`

**Completed today check (client side):**
```js
const completedToday = (habit) => {
  const today = new Date().toDateString();
  return habit.completedDates.some(
    (d) => new Date(d).toDateString() === today
  );
};
```

Use this to disable the complete button before even making the request.

**Connection to rest of app:**
- Completions feed `/insights/streaks` and `/insights/habit-consistency`
- Active habit count feeds dashboard overview

---

## Phase 6 — Mood Tracker

**API endpoints used:**
- `GET /api/moods`
- `POST /api/moods`
- `PATCH /api/moods/:id`
- `DELETE /api/moods/:id`

**Query params to expose:**
- `?mood=` — filter by mood
- `?sort=date` or `?sort=-date`
- `?page=&limit=`

**State to manage:**
```
moods: MoodEntry[]
pagination: { total, page, limit, totalPages }
todaysMood: MoodEntry | null
```

**Components needed:**
- Mood log page — reverse chronological list
- Quick log widget — five mood buttons (great/good/neutral/bad/awful), optional note, one-tap submit
- Mood history list — date, mood icon/color, note
- Mood edit — change mood or note on a past entry

**Flow:**
1. On mount: fetch today's mood (check if `date` matches today in the list)
2. Quick log: `POST /api/moods` with mood + optional note
3. Edit past entry: `PATCH /api/moods/:id`
4. Delete: `DELETE /api/moods/:id`

**Connection to rest of app:**
- Mood entries feed `/insights/mood-summary` (average score, trend)
- Mood on journal entries and standalone mood logs are separate — but both contribute to the emotional picture
- Future: cross-reference mood trend with task completion rate

---

## Phase 7 — Insights Page

**API endpoints used:**
- `GET /api/insights/overview`
- `GET /api/insights/productivity`
- `GET /api/insights/streaks`
- `GET /api/insights/journal-frequency`
- `GET /api/insights/habit-consistency`
- `GET /api/insights/mood-summary`

**State to manage:**
```
insights: {
  overview: {...} | null,
  productivity: {...} | null,
  streaks: {...} | null,
  journalFrequency: {...} | null,
  habitConsistency: {...} | null,
  moodSummary: {...} | null,
}
loading: boolean
```

**Components needed:**
- Insights page — grid of cards/sections
- Overview card — stat tiles (reuse from dashboard)
- Productivity card — completed this week, overdue count, completion rate
- Streaks card — per-habit current/longest streak
- Journal card — entries this week/month, most common mood
- Habits card — per-habit consistency rate, overall rate
- Mood card — average score, trend badge, total entries

**Flow:**
1. On mount: fire all 6 requests in parallel (`Promise.all`)
2. Render each card independently so partial data shows while others load
3. Trend badge logic:
   - `improving` → green up arrow
   - `stable` → gray dash
   - `declining` → red down arrow
   - `null` → "Not enough data yet"

**Connection to rest of app:**
- This page is read-only — it reflects everything the user has done across all other sections
- Link each insight card back to its source (streak card → habits page, mood card → mood page, etc.)

---

## Data Flow Summary

```
Auth
  └── Token injected into every request

Tasks ──────────────────────────────┐
Journal ────────────────────────────┤──► Insights Page
Habits (completions) ───────────────┤     overview / productivity /
Moods ──────────────────────────────┘     streaks / journal-frequency /
                                          habit-consistency / mood-summary
                                               │
                                          Dashboard
                                          (overview widget)
```

---

## Suggested Build Order

| Step | What to build | Why |
|------|---------------|-----|
| 1 | Auth (register, login, token storage) | Nothing else works without it |
| 2 | Dashboard shell + overview widget | Gives you a home screen immediately |
| 3 | Tasks | Simplest resource, good for establishing patterns |
| 4 | Habits | Introduces the complete action — slightly more complex |
| 5 | Journal | Rich form with mood + tags |
| 6 | Mood tracker | Quick-log pattern, feeds insights |
| 7 | Full insights page | Pulls everything together — build last so there's real data to show |

---

## Notes

- **Pagination** — all list endpoints return `{ data: [], pagination: {} }`. Always read from `response.data.data`, not `response.data` directly.
- **404 on owned resources** — if a user tries to access another user's record, the API returns 404, not 403. Handle 404 the same way on the frontend.
- **Token expiry** — JWTs expire after 30 days. If a request returns 401, clear the token and redirect to login.
- **`completedDates` on habits** — this is an array of ISO date strings. Parse them client-side to show streaks or disable the complete button.
