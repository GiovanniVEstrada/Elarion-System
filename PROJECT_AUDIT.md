# Elarion Project Audit

Date: 2026-05-06

## Executive Summary

Elarion is currently functional enough to build on the frontend, but the project is carrying several layers of unfinished redesign work, older layout rules, and verification debt. The biggest practical issue is not one specific component: it is that the UI has multiple competing layout systems active at once.

The current highest-value work is to stabilize the frontend shell and CSS architecture before continuing page-by-page visual polish. The backend appears structurally reasonable, but its tests depend on a real Mongo connection and currently time out in this environment.

## Current Verification Status

### Frontend

- `npm.cmd run build` in `frontend` passes.
- `npm.cmd run lint` in `frontend` fails with 37 errors and 3 warnings.
- Dev server has been running on `http://127.0.0.1:5173`.

### Backend

- `npm.cmd test -- --runInBand` in `ion-api` fails.
- Failure reason: test setup times out while `beforeAll` waits for `connectDB()`.
- The backend test suite currently expects `process.env.MONGO_URI` to be reachable and does not use an isolated test database or mocked Mongo connection.

## High-Priority Conflicts

### 1. CSS Cascade Conflicts Are The Main UI Risk

The frontend has overlapping layout rules across:

- `frontend/src/styles/layout.css`
- `frontend/src/styles/dashboard.css`
- `frontend/src/styles/items.css`
- `frontend/src/styles/journal.css`
- `frontend/src/styles/calendar.css`
- `frontend/src/styles/settings.css`
- `frontend/src/styles/animations.css`

The most important conflict: `animations.css` still contains old mobile rules for `.dashboard` and `.feature-page`:

```css
@media (max-width: 768px) {
  .dashboard,
  .feature-page {
    padding: 16px 14px 28px;
  }
}
```

Because `animations.css` is imported before the newer page files, later CSS often overrides it, but this is fragile. Any import-order change can break the new mockup spacing again.

Recommended work:

1. Move all app-shell/page-frame rules into one file, probably `layout.css`.
2. Remove page-frame padding from `animations.css`.
3. Keep page CSS focused on page-specific components, not global shell layout.

### 2. Old Bottom Navigation Still Exists In The Runtime Tree

`BottomNav.jsx` is still imported and mounted in `App.jsx`, but hidden with:

```css
.bottom-nav {
  display: none !important;
}
```

This works visually, but it is a design-system smell. The old nav is still part of the component tree and can confuse future work.

Recommended work:

- Remove `BottomNav` from `App.jsx`.
- Keep `BottomNav.jsx` only if you want it as archived code, or delete it once the drawer nav is stable.

### 3. Navigation Shell Is New But Not Yet Fully Integrated

The new top chrome and side drawer live in `Navbar.jsx`, but they are now doing more than the old desktop navbar did:

- page label
- menu trigger
- profile badge
- drawer overlay
- drawer links
- guest/login fallback

This is acceptable short-term, but it will get bulky fast.

Recommended work:

- Split into:
  - `TopChrome.jsx`
  - `SideDrawer.jsx`
  - `navItems.js`
- Give the route label map one source of truth.
- Add Escape-key close and focus management for accessibility.

### 4. Mockup Direction Is Applied Unevenly Across Pages

The redesign is strongest on:

- Dashboard
- Calendar
- Tasks
- Journal
- Settings

But weaker or older on:

- Reflect
- Moods
- Habits
- Auth pages
- Onboarding
- NotFound

There are two visual languages live at once:

- New mockup-style mobile tide shell.
- Older glass dashboard/PWA shell.

Recommended work:

1. Finish navigation and mobile frame first.
2. Redesign Reflect next, since the mockup includes “Insights”.
3. Fold old Habits/Moods pages into the Actions/Insights model or visually align them.
4. Only then polish auth/onboarding.

### 5. Guest Banner Was Removed From App Shell But The Code Remains

The guest banner is no longer mounted in `App.jsx`, but these files still exist:

- `frontend/src/components/layout/GuestBanner.jsx`
- `.guest-banner` styles in `frontend/src/styles/auth.css`

That is fine if you may reuse it later, but it is currently dead UI.

Recommended work:

- Either delete `GuestBanner.jsx` and its CSS, or keep a short comment explaining it is intentionally unused.

## Frontend Code Quality Issues

### 1. ESLint Does Not Understand The Current `motion` Import Pattern

Lint reports many errors like:

```text
'motion' is defined but never used
```

Even in files that use `<motion.div>`. This suggests the ESLint setup is not correctly handling JSX namespace usage with this import style.

Affected examples:

- `App.jsx`
- `Navbar.jsx`
- `PageShell.jsx`
- `Dashboard.jsx`
- `Calendar.jsx`
- `Journal.jsx`
- `Tasks.jsx`
- `Settings.jsx`
- many existing components

Recommended work:

- Decide whether to keep `motion/react`.
- Adjust ESLint so JSX namespace usage is recognized, or change imports/usages to a lint-compatible pattern.
- Do this once project-wide instead of silencing one file at a time.

### 2. React Fast Refresh Warnings In Context Files

Lint reports `react-refresh/only-export-components` for context files like:

- `AuthContext.jsx`
- `TasksContext.jsx`
- `JournalContext.jsx`
- `CalendarContext.jsx`
- `HabitsContext.jsx`
- `MoodsContext.jsx`
- `ReflectionsContext.jsx`

Reason: these files export both provider components and hooks/utilities.

Recommended work:

- Either relax this rule for context files, or split each context into:
  - provider component file
  - hook file
  - context object file

For this project, relaxing the rule for `src/context/**/*.jsx` may be the pragmatic choice.

### 3. Real Unused Variables Exist

Examples from lint:

- `activeCount` in `Tasks.jsx`
- unused `err` bindings in `useTasks.js` and `useMoods.js`

Recommended work:

- Clean these after the layout work settles.
- These are low-risk, quick wins.

### 4. Some Mojibake Still Exists

Several files previously showed corrupted characters such as `â€”`, `âœ“`, `Ã—`, etc. Some have been cleaned during redesign, but not all.

Likely affected areas:

- comments in hooks
- old nav labels
- older pages and CSS comments

Recommended work:

- Run a focused search for common mojibake sequences:
  - `â`
  - `Ã`
  - `ð`
- Replace only visible UI text first.
- Leave comments for a later cleanup pass if they are not harming output.

## Design System Conflicts

### 1. Page Header Rules Are Repeated Per Page

Each redesigned page has its own hero classes:

- `.tasks-hero`
- `.cal-hero`
- `.journal-hero`
- `.settings-hero`

They mostly duplicate the same typography rules.

Recommended work:

- Create shared classes:
  - `.tide-hero`
  - `.tide-hero-kicker`
  - `.tide-hero-title`
- Keep page-specific classes only for page-specific exceptions.

### 2. Glass Card Styling Is Duplicated

The same glass recipe is repeated across many files:

```css
background: var(--glass-bg);
backdrop-filter: var(--glass-backdrop);
box-shadow: var(--glass-shadow);
border: 1px solid var(--border);
```

Recommended work:

- Add reusable classes:
  - `.glass-card`
  - `.tide-card`
  - `.tide-panel`
- Or define CSS custom property bundles for card variants.

### 3. Mobile Frame Is Implemented By Global Overrides

The current mobile frame is applied by targeting:

```css
.dashboard,
.feature-page,
.home-page
```

This works but is brittle. Pages that do not use these classes or override them later can break.

Recommended work:

- Introduce a real shell class, for example `.app-mobile-frame`, around routed pages.
- Or update `PageShell` and Dashboard to share one consistent wrapper.

### 4. Navigation Mockup Needs Desktop Strategy

The mockup is mobile-first. The current top chrome is also active on desktop, but the desktop experience has not been intentionally designed.

Recommended work:

- Decide whether desktop should:
  - use the same top chrome and drawer, or
  - use a wider desktop sidebar/top nav variant.
- Avoid maintaining both old desktop navbar and new mobile drawer.

## Page-Specific Audit

### Dashboard / Today

Status: strong direction, but still contains mock data fallback.

Risks:

- Mock data is intentionally left in `Dashboard.jsx`.
- Header/nav spacing has been patched several times because page padding is spread across files.

Recommended work:

- Remove mock fallback once real data is consistently available.
- Convert the agenda layout into a reusable tide timeline component.

### Calendar / Month

Status: visually close to the “month of tides” mockup.

Risks:

- Calendar has its own grid/card styling separate from the newer global tide-card treatment.
- The side form/list panel is useful on desktop but can feel heavy on mobile.

Recommended work:

- Make mobile order explicit:
  - hero
  - month grid
  - selected day tide card
  - add/edit event form
- Consider moving add-event into a FAB panel for consistency.

### Tasks / Actions

Status: redesigned, but visually still mixing old task controls and new tide cards.

Risks:

- Tabs, filters, task tiers, and FAB all have separate spacing systems.
- Habit state is inside Tasks now, while a separate Habits page still exists.

Recommended work:

- Decide whether `/habits` remains a standalone route.
- If Actions owns habits, remove or redirect the older Habits page.
- Turn task/habit rows into one shared “floating action card” component.

### Journal / Reflect Log

Status: close to mockup list direction.

Risks:

- Desktop editor/preview and mobile log list are being handled with CSS-only reordering/hiding.
- The FAB focuses the editor, but the editor is lower on mobile and may need clearer open/close behavior.

Recommended work:

- On mobile, make new/edit entry a drawer or full-screen composer.
- Keep desktop split editor/preview.
- Use real mood/status labels instead of raw numeric mood bubbles if desired.

### Reflect / Insights

Status: not yet brought into the mockup system.

Risks:

- Lint flags `setLoading(false)` directly inside an effect for guest state.
- Page likely still has the older dashboard analytics style.

Recommended work:

- Redesign this next using the “Your tide chart” mockup.
- Fix the effect logic while touching the page.

### Settings

Status: partially aligned with mockup.

Risks:

- Real settings behavior is mostly account/data focused; mockup implies preferences like theme, check-in time, prediction toggles, haptics.
- Current appearance card is informational, not functional.

Recommended work:

- Decide which preferences are real product features.
- Either implement them or remove/rename the placeholder appearance section.
- Keep danger zone visually muted and lower priority.

### Auth / Onboarding

Status: older visual language.

Risks:

- Guest mode behavior and auth routes are still important but visually separate from the new shell.
- Guest banner was removed; guest affordances should be reconsidered.

Recommended work:

- Redesign login/register to match the tide shell.
- Decide where guest users see upgrade prompts now that the banner is gone.

## Backend Audit

### 1. Tests Depend On A Real Mongo URI

`ion-api/src/tests/auth.test.js` calls `connectDB()` directly, which uses `process.env.MONGO_URI`.

Current result:

- Jest times out in `beforeAll`.
- All tests fail because database setup never completes.

Recommended work:

- Add a dedicated `MONGO_URI_TEST`.
- Increase setup timeout only after confirming the DB is reachable.
- Better: use an isolated test database and clean it before/after tests.
- Best: use `mongodb-memory-server` if adding a test dependency is acceptable later.

### 2. `connectDB` Calls `process.exit(1)`

`ion-api/src/config/db.js` exits the process on connection failure. That is common in app startup, but awkward in tests.

Recommended work:

- Make `connectDB` throw instead of exiting.
- Let `server.js` decide to exit during real startup.
- Tests can then fail cleanly with a useful error.

### 3. API/Frontend Contract Needs A Pass

The frontend has guest/local-storage behavior for some modules and API-backed behavior for others.

Recommended work:

- Document which features support guest mode.
- Ensure empty states and nav labels are consistent for guest vs authenticated users.
- Confirm export data includes all models the UI names.

## Recommended Work Order

1. Stabilize the app shell:
   - remove `BottomNav` from `App.jsx`
   - consolidate mobile frame/page padding
   - remove conflicting old rules from `animations.css`

2. Clean CSS architecture:
   - introduce shared hero/card/tide classes
   - reduce per-page duplicated glass styles
   - make mobile ordering explicit per page

3. Finish the mockup pages:
   - Reflect / Insights
   - Actions cleanup
   - Calendar mobile add/edit flow
   - Settings real preferences or remove placeholders

4. Fix frontend lint:
   - solve `motion` import lint issue globally
   - handle Fast Refresh context rule
   - remove real unused variables

5. Fix backend tests:
   - test database setup
   - avoid `process.exit` in `connectDB`
   - make tests deterministic without relying on a production-like DB

6. Product consistency pass:
   - guest mode behavior
   - route names: Today, Month, Actions, Reflect Log, Insights, Settings
   - desktop strategy for the new nav

## Immediate Punch List

- Remove `BottomNav` from `App.jsx`.
- Delete or disable old mobile padding in `animations.css`.
- Create shared `.tide-hero` and `.tide-card` styles.
- Refactor `Navbar.jsx` into top chrome and drawer components.
- Redesign Reflect page to match the tide chart mockup.
- Decide what to do with standalone Habits and Moods routes.
- Fix frontend lint config or motion import pattern.
- Add a reliable backend test database setup.

## Notes On Current Worktree

There are many modified frontend files from the redesign pass. Before starting a large cleanup, consider committing the current visual milestone so the next pass can be reviewed separately.
