# Elarion Project Audit

Date: 2026-05-12 (Sprint 5 update)

## Executive Summary

Sprint 5 addressed UI polish and critical mobile bugs. The app shell background is now seamless (transparent at the top chrome, full-width fill). A calendar grid overflow bug that pushed the layout off-screen on all phone sizes when a day had many events has been fixed. The past-entries log with swipe-to-delete has been moved from the Insights page to the Journal page, giving users direct delete access in the right context.

Earlier sprints: glass CSS migration complete across all tracked files, dead CSS stripped, backend route tests written, Android/cross-device sizing pass done. What remains before App Store submission is real-device testing, the `sentimentScore` decision, and store preparation.

## Current Verification Status

### Frontend

- `npm run lint` in `frontend` passes.
- `npm run build` in `frontend` passes when run outside the Windows sandbox.
- The sandboxed build can fail with `spawn EPERM` while Vite loads config. This appears environmental; the production build itself succeeds.

### Backend

- API modules load successfully.
- `connectDB` throws on failure instead of calling `process.exit(1)`. Tests will no longer hang or kill the Jest process on a missing DB URI.
- To run tests: copy `ion-api/.env.test.example` to `ion-api/.env.test`, set `MONGO_URI_TEST` to a local test database, then run `npm test`.
- Auth and Tasks route tests pass against a live Mongo connection.
- Journal, moods, calendar, and reflection route tests written in `routes.test.js`.

## Completed Cleanup

### Sprint 1 — V0.2.0 Tide Redesign

- Removed `GuestBanner.jsx`, `BottomNav.jsx`.
- Updated ESLint, removed mock data fallback.
- Added `API_DATASETS.md` and backend Joi validation for all main resources.
- Added shared tide-hero, glass-card, tide-panel, tide-card classes in `base.css`.
- Split navigation: `Navbar.jsx`, `TopChrome.jsx`, `SideDrawer.jsx`, `navItems.js`.
- Added Escape-key drawer close, redirect `/habits→/calendar`, `/moods→/reflect`, `/tasks→/calendar`.
- Rebranded all surfaces to "Luren by Elarion".
- Fixed CORS (ports 5173–5175), 401 interceptor (login error display), crypto.randomUUID guest IDs, localStorage sanitizers.
- Added Calendar day view timeline, two-step FAB modal (Event/Action), `endTime` field end-to-end.

### Sprint 2 — Shell Stabilization (2026-05-12)

- Fixed Habits page layout: complete button left of text, small icon buttons right; pill-style freq badge; done-state strikethrough; `position: relative` on habit cards.
- Added Calendar `DayAgendaPanel` below the month grid on day tap — events/actions list with colored left-bar, edit/delete, add and timeline buttons. Removed mobile auto-redirect to full day view.
- Removed `calendar-side-panel` on mobile.
- Added drawer focus management: focus returns to menu button on close; Tab/Shift+Tab trapped inside open drawer; auto-focuses first element on open.
- Deleted `frontend/src/pages/Moods.jsx` (unrouted).
- Removed placeholder Appearance section from Settings.
- Fixed SideDrawer footer: `ELARION V0.2.0` → `Luren V0.2.0`.
- **Backend test infrastructure fixed:**
  - `connectDB` now throws instead of `process.exit(1)`.
  - `server.js` catches the thrown error and exits — production behavior unchanged.
  - `NODE_ENV=test` auto-set in `ion-api/src/tests/setup.js` (Jest `setupFiles`).
  - Test DB URI read from `MONGO_URI_TEST` when `NODE_ENV=test`.
  - `.env.test.example` template provided.
  - Jest timeout raised to 15 s.
  - Removed redundant `require("dotenv").config()` from `auth.test.js`.
- **Glass CSS migration (partial):**
  - `.settings-card`, `.calendar-grid-panel`, `.cal-list-glass`, `.day-timeline-wrap`, `.auth-card` — glass recipe removed from page CSS; corresponding JSX elements now use `tide-panel` class.
- **Auth pages redesigned to match tide shell:**
  - Title changed from bold sans `1.8rem` to serif italic `clamp(2.4rem, 8vw, 3.2rem)` with teal text-shadow.
  - "by Elarion" moved above the title as an uppercase teal kicker (`.auth-kicker`).
  - `.auth-brand-by` class removed; replaced by `.auth-kicker`.
  - Both Login and Register cards use `tide-panel auth-card` — glass handled by shared class.
- **Desktop navigation decision:** Keep the unified top-chrome + drawer across all screen sizes for V1. No dedicated desktop sidebar until post-App Store if needed.

  ### Sprint 3 — Glass Migration Complete + Route Tests (2026-05-12)

- **Glass CSS migration complete:**
  - `items.css` `.habit-card` — glass stripped; habit items now use `glass-card habit-card` in JSX.
  - `items.css` dead toolbar selectors removed (`tasks-page-toolbar`, `tasks-page-list-wrap`, `calendar-page-toolbar`, `calendar-page-list-wrap`).
  - `journal.css` `.journal-sidebar`, `.journal-editor-card`, `.journal-preview-card` — glass stripped; JSX uses `tide-panel`.
  - `journal.css` `.reflect-log-card` — glass stripped; JSX uses `glass-card`.
  - `reflect.css` `.reflect-chart-card`, `.reflect-stat-card`, `.reflect-pattern-card` — glass stripped; JSX uses `glass-card`.
  - `reflect.css` `.log-entry` — glass stripped; JSX uses `glass-card`.
  - `onboarding.css` `.onboarding-card` — glass stripped; JSX uses `tide-panel`.
- **App shell frame consolidation:**
  - Removed entire dead `dashboard*`/`feature-page*` CSS block from `dashboard.css` (lines 1–241).
  - Removed dead `.dashboard-header`, `.habit-actions`, `.dashboard-actions`, `.tasks-page-toolbar`, `.calendar-page-toolbar` from `animations.css`.
- **Backend route tests written** (`ion-api/src/tests/routes.test.js`):
  - Journal: create, list, update, delete, unauthenticated 401, validation rejection.
  - Moods: create, list, update, delete, unauthenticated 401, invalid mood value rejection.
  - Calendar: create, list, update, delete, unauthenticated 401, missing date rejection.
  - Reflections: create/upsert, list, patch by date, unauthenticated 401, missing date rejection.
- **Onboarding reviewed:** default habits (`Morning journal`, `Daily walk`, `Read before bed`) and focus-area habit map confirmed aligned with V0.2.0 direction.

### Sprint 4 — Android / Cross-Device Sizing Pass (2026-05-12)

- **`index.html`:** Added `viewport-fit=cover` to viewport meta (enables `env(safe-area-inset-*)` on Android notch/cutout devices) and `theme-color` meta (`#030b14`) for PWA chrome coloring.
- **`base.css`:** Added `-webkit-text-size-adjust: 100%` + `text-size-adjust: 100%` (prevents Android/iOS from bumping font sizes in landscape); `overscroll-behavior-y: none` on `body` (stops pull-to-refresh in PWA standalone); `touch-action: manipulation` on interactive elements (removes 300ms tap delay on Android without disabling pinch-zoom).
- **`layout.css`:**
  - `.app-mobile-frame` — `min-height: 100dvh` (was `100vh`; `dvh` accounts for Android Chrome's collapsing address bar).
  - `.side-drawer` — padding-bottom now uses `max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))` for gesture navigation bar clearance.
  - New `≤380px` breakpoint — reduces `.app-mobile-frame` padding to 16px and `.app-top-chrome` width to `calc(100% - 32px)` for budget Android phones (Galaxy A-series, Moto G).
- **`auth.css`:** `.auth-shell` `min-height` changed from `100vh` → `100dvh`.
- **`calendar.css`:** New `≤380px` breakpoint — reduces `.calendar-grid` gap to 2px and sets `.cal-day min-height: 44px` so day cells meet the 44dp touch target on 360px screens.
- **`items.css`:** Added explicit `min-height: 44px` to `.tasks-filter-btn, .calendar-filter-btn`; new `≤380px` breakpoint increases `.habit-icon-btn` to 38×38 and reduces hero title clamp to `clamp(2rem, 10vw, 2.8rem)`.
- **`vite.config.js`:** Fixed all icon references — `pwa-192x192.png` → `pwa-192x192.jpg`, `pwa-512x512.png` → `pwa-512x512.jpg`, type changed to `image/jpeg`. Removed non-existent `pwa-512x512-maskable.png` (flagged in TODO comment — needed for Play Store adaptive icons).
- **`PageShell.jsx`:** Removed dead `feature-page` class that had no corresponding CSS.

### Sprint 5 — UI Polish & Mobile Bug Fixes (2026-05-12)

- **`layout.css` — app shell background redesign:**
  - `width: 100%` on `.app-mobile-frame` (was `min(100%, 430px)`) — fills edge-to-edge with no side gaps.
  - Gradient reworked to start `transparent` at the top ~22% so the top-chrome buttons float on the ambient body gradient rather than on a filled panel. Darker background fades in below the nav area for content readability.
  - Removed `box-shadow: inset 0 1px 0` which created a visible top border.
- **Calendar grid overflow fix (`calendar.css` + `Calendar.jsx`):**
  - Added `min-width: 0` and `overflow: hidden` to `.cal-day` — the critical fix that prevents CSS grid columns from growing beyond `1fr` when cell content overflows.
  - Added `max-width: 100%` + `overflow: hidden` to `.cal-event-indicators`.
  - Capped event dot indicator to 3 dots maximum (2 events + 1 task, or 1 event + 2 tasks).
  - Removed the `+N` overflow count badge entirely — prevented layout blowout on all phone sizes when a day had many events.
- **Journal page — past entries log moved from Insights:**
  - `reflect-log-section` (swipe-to-delete entry log) moved from `Reflect.jsx` to `Journal.jsx`.
  - Shows **all** journal entries (no mood filter), sorted newest-first.
  - Entries with a mood score still display the numeric score + state label on the right.
  - `LogEntry` component now lives in `Journal.jsx`; `Reflect.jsx` cleaned of `LogEntry`, `logEntries`, `deleteEntry`, and `getMoodLabel`/`getMoodScoreLabel` imports.




**Remaining for Play Store release:**
- A proper `pwa-512x512-maskable.png` (PNG, purpose: maskable) needs to be created — this is required for Android adaptive icons on Play Store.



## High-Priority Remaining Work

### 1. Real-Device Testing

Verify Calendar, Habits, Journal, and Dashboard on physical iOS/Android device before App Store submission. Focus on:
- Day agenda panel scroll and tap behavior on small screens.
- Habit card layout at various font-size settings.
- FAB panel positioning above system gesture bar.

### 2. Journal Mobile Entry Composer UX

The mobile journal flow shows the entries list first. Consider whether a sticky "New Entry" button above the list or an auto-scroll on tap is needed.

### 3. `sentimentScore` Decision

`sentimentScore` field exists in the `journalEntrySchema` but is not surfaced in the UI. Decide: auto-compute on save (NLP), expose as a manual 1–5 picker, or remove from schema.

### 4. Reflect Page — Richer Empty States

When there are no mood entries yet, the chart area shows a serif italic fallback. Add a brief onboarding nudge pointing the user to the Journal or mood log.

### 5. App Store Submission Preparation

- App icons, splash screens.
- Privacy policy URL.
- Store listing copy.
- Capacitor/PWA build verification.

## Design System Debt

### Hero Class Migration — Status

All main pages use both the shared `.tide-hero` classes and a local page-specific class for compatibility. The local classes carry some duplicated typography rules that can be pruned once visuals are verified.

### Glass Card Migration — Status

| File | Status |
|---|---|
| `settings.css` `.settings-card` | ✅ Migrated — uses `tide-panel` in JSX |
| `calendar.css` `.calendar-grid-panel` | ✅ Migrated |
| `calendar.css` `.cal-list-glass` | ✅ Migrated |
| `calendar.css` `.day-timeline-wrap` | ✅ Migrated |
| `auth.css` `.auth-card` | ✅ Migrated |
| `items.css` `.habit-card` | ✅ Migrated — uses `glass-card` in JSX |
| `items.css` task toolbar selectors | ✅ Removed (dead selectors) |
| `journal.css` sidebar/editor/preview | ✅ Migrated — uses `tide-panel` in JSX |
| `journal.css` `.reflect-log-card` | ✅ Migrated — uses `glass-card` in JSX |
| `reflect.css` chart/stat/pattern cards | ✅ Migrated — uses `glass-card` in JSX |
| `reflect.css` `.log-entry` | ✅ Migrated — uses `glass-card` in JSX |
| `onboarding.css` `.onboarding-card` | ✅ Migrated — uses `tide-panel` in JSX |

## Page-Specific Status

### Today / Dashboard

Status: solid. Real data, tide hero, agenda timeline.

Remaining: real-device test; convert agenda section into a reusable component if needed.

### Month / Calendar

Status: strong. FAB + two-step modal, day agenda panel, day timeline. Mobile side panel removed. Grid overflow bug fixed — adding many events to a single day no longer pushes the layout off-screen.

Remaining: validate on real device.

### Habits

Status: solid. Complete button left, icon buttons right, freq badge pill, glass migration done.

Remaining: decide whether `/habits` stays as a standalone route long-term.

### Reflect Log / Journal

Status: solid. Glass migration done. Past-entries log with swipe-to-delete now lives here. Users can write, browse, and delete all in one page.

Remaining: mobile entry composer UX (sticky new-entry CTA or auto-scroll), `sentimentScore` decision.

### Insights / Reflect

Status: tide chart, real mood data, glass migration done. Entry log removed — it now lives on the Journal page where it belongs.

Remaining: richer empty states (nudge toward Journal/mood log when no data), task alignment correlation decision.

### Settings

Status: clean. Four real sections. Glass migration done.

### Auth / Onboarding

Status: Login, Register, and Onboarding all match the tide shell. Glass migration done.

## Backend And Data Status

### Test Infrastructure

Status: complete.

- `connectDB` throws on failure; `server.js` handles exit.
- Jest `setupFiles` sets `NODE_ENV=test` and loads `.env.test` before any module runs.
- `MONGO_URI_TEST` used when in test environment.
- `.env.test.example` documents the required env vars.

To run tests:
```bash
cp .env.test.example .env.test
# Edit .env.test with a local test DB URI
npm test
```

### Route Tests Coverage

| Resource | Tests |
|---|---|
| Auth | ✅ register, login, validation |
| Tasks | ✅ create, auth guard, validation |
| Journal | ✅ CRUD, auth guard, validation |
| Moods | ✅ CRUD, auth guard, validation |
| Calendar | ✅ CRUD, auth guard, validation |
| Reflections | ✅ upsert, list, patch by date, auth guard, validation |

### API Dataset Contracts

Status: strong. `API_DATASETS.md` is the canonical reference.

## Full Audit Findings — Sprint 4 To-Do

_Mass audit run 2026-05-12. All findings below are the complete actionable list going forward. Check boxes as completed._

### CSS / Styling

- [ ] **Navbar glass duplication** — `layout.css` `.navbar` defines `background`, `backdrop-filter`, `box-shadow`, `border` inline instead of using `glass-card` or `tide-panel`. Strip the glass recipe from `.navbar` and add the shared class in `Navbar.jsx` (or `TopChrome.jsx`).
- [ ] **Hero text-shadow abstraction (optional)** — The teal text-shadow `0 0 40px rgba(78,205,196,0.15), 0 0 80px rgba(78,205,196,0.06)` is repeated across `dashboard.css` (`.home-hero-date`), `calendar.css` (`.cal-hero-title`), `reflect.css` (`.reflect-hero-title`), and `items.css` (`.tasks-hero-title`). These are already covered by `.tide-hero-title` in `base.css` — verify each page-level rule is actually needed or remove it as redundant.

### UX / Navigation

- [ ] **Tasks route intentionality** — `/tasks` in `App.jsx` redirects to `/calendar`. The `Tasks.jsx` page is fully implemented. Decide: keep redirect (unified view), restore `/tasks` as its own route, or remove `Tasks.jsx` entirely to avoid confusion.

### Features / Content

- [ ] **`sentimentScore` decision** — Field exists in `journalEntrySchema` and `JournalEntry` model but is never set in the UI. Options: (a) auto-compute on save with a simple rule, (b) expose as a 1–5 picker in the editor, (c) remove from schema and model.
- [x] **Journal — past entry delete access** — `reflect-log-section` moved to Journal page; users can now swipe-to-delete any past entry directly from the journal view.
- [ ] **Mobile journal entry composer UX** — On narrow screens the editor is below the sidebar. Consider a sticky "New Entry" CTA above the entry list or auto-scroll to editor on tap (the `focusNewEntry` + FAB already handles this partially).
- [ ] **Reflect page empty state** — When no mood entries exist the chart shows a serif italic fallback. Add a short onboarding nudge pointing users to write a journal entry or log a mood.

### Testing

- [ ] **Real-device testing** — Verify on physical iOS/Android:
  - Calendar day agenda panel scroll + tap
  - Habit card layout at large text size
  - FAB panel positioning above system gesture bar
  - Drawer focus trap on iOS VoiceOver

### Android / Cross-Device Sizing

- [x] `viewport-fit=cover` + `theme-color` in `index.html`.
- [x] `text-size-adjust`, `overscroll-behavior-y`, `touch-action: manipulation` in `base.css`.
- [x] `100dvh`, side-drawer safe-area bottom, `≤380px` padding breakpoint in `layout.css`.
- [x] `auth.css` `min-height: 100dvh`.
- [x] `calendar.css` calendar day cell touch targets at 360px.
- [x] `items.css` filter button `min-height: 44px`, habit icon button size, hero title clamp at 380px.
- [x] `vite.config.js` icon filenames corrected to `.jpg` with `image/jpeg` type.
- [ ] **Create `pwa-512x512-maskable.png`** — required for Play Store adaptive icons. Must be a 512×512 PNG with safe-zone content (logo centered in middle 80% of canvas). Add to `frontend/public/` and re-add maskable icon entry to `vite.config.js`.

### App Store Preparation

- [ ] Maskable PNG icon created (see Android section above).
- [ ] Privacy policy URL decided and linked in Settings.
- [ ] Store listing copy written (title, subtitle, description, keywords).
- [ ] Capacitor / PWA build verified end-to-end.
- [ ] TestFlight / internal track upload tested.

---

## Immediate Punch List

Priority order for next session:

1. Navbar glass duplication fix (`layout.css` + `Navbar.jsx` / `TopChrome.jsx`).
2. Hero text-shadow audit — remove page-level redundancies that duplicate `base.css`.
3. Tasks route decision — keep redirect or restore `/tasks` as its own route.
4. `sentimentScore` decision and implementation.
5. Reflect empty state nudge (when no mood entries exist).
6. Mobile journal entry composer UX — sticky "New Entry" CTA or auto-scroll to editor on tap.
7. Real-device testing pass.
8. App Store preparation (maskable PNG icon, privacy policy, store listing).

Notes:

Figure out how notifications.

too easy to delete folders for journal, make sure a pop up goes to ask if user is sure, and add a button if user wants a specific note to be added to a folder. in the all folder, the notes should have the name of the folder it is in except for if it was made in the 'all folder', and in chronological order. add swipe motion when swiping note to the right, allows user to edit note rather than clicking on it and what it is right now. change title when editing note font. make sure the title when editing is obvious to the user that the title is editable.

thought to consider, pressing a button on the home page that shows the today, tomorrow, one week. 
home screen, variant A today (hero) today + tomorrow tab will only show the time on the ribbon. then on the week option, it shows the days instead, and has bubbles on the days that shows a dropdown folder of their events/actions. to make it easier for user to see the information rather than all at once.

also for the agenda-type-dot i want it to be specialized and have a slight glowing effect, and i want it to be different colors to what the type it is


when adding an action, i want to have a priority of low medium and high. and i dont want to use red for it. maybe a different color.

have to figure out how class="tide-ribbon-wrap" correlates to how busy the person is and how it scales up as more and more actions/events are added, or should it be an emotion center? i like the idea of it being a way to show how busy the person is.