# Sleep Tracker — Design

**Date:** 2026-06-14
**App:** Tiny Bites (baby feeding tracker)
**Goal:** Add a simple, pleasant sleep tracker that makes it easy to record when the baby fell asleep and woke up, alongside the existing feeding tracker. Keep the same style and UX/UI.

## Decisions (from brainstorming)

- **Interaction:** Live start/stop timer **plus** manual entry/edit.
- **Placement:** A sleep widget on the Dashboard (below the feeding section) **plus** a dedicated `/sleep` page.
- **Extras included:** sleep stats, sleep history (edit/delete), sleep chart.
- **Out of scope (YAGNI):** per-sleep notes, CSV export of sleep, sleep timeline on dashboard.

## Data Model

New Firestore collection `users/{uid}/sleeps`, mirroring `feedings`:

```
{
  babyId:    string,
  startTime: Timestamp,        // baby fell asleep
  endTime:   Timestamp | null, // baby woke up; null === currently asleep (active session)
  createdAt: serverTimestamp,
  updatedAt: serverTimestamp,
}
```

- The **active session** is the (at most one) doc with `endTime === null`.
- Storing the active session in Firestore — not React/local state — means the live "asleep for…" timer survives page reloads and stays in sync across devices, consistent with the app's existing real-time `onSnapshot` model.
- **Duration** of any sleep = `(endTime ?? now) − startTime`.

## Firestore Plumbing

`src/firebase/firestore.js` — add a `// ── Sleeps ──` section mirroring feedings:
- `addSleep(userId, data)`
- `updateSleep(userId, sleepId, data)`
- `deleteSleep(userId, sleepId)`
- `getSleep(userId, sleepId)`
- `subscribeToSleeps(userId, babyId, callback)` — `where('babyId','==',babyId)`, `orderBy('startTime','desc')`, `limit(300)`

`firestore.rules` — add inside `users/{userId}`:
```
match /sleeps/{sleepId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

`firestore.indexes.json` — add composite index:
```
{ "collectionGroup": "sleeps", "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "babyId", "order": "ASCENDING" },
    { "fieldPath": "startTime", "order": "DESCENDING" }
  ] }
```

## Hook: `src/hooks/useSleeps.js`

Mirrors `useFeedings`. Subscribes via `subscribeToSleeps`. Returns:
- `sleeps` — all (desc by startTime)
- `activeSleep` — the doc with `endTime == null`, or null
- `todaySleeps` — sleeps whose `startTime` isToday
- `lastSleep` — most recent completed sleep
- `totalSleepToday` — sum of durations for today's sleeps (ongoing counted up to now), in seconds
- `napsToday` — count of today's sleeps
- `weeklyByDay` / `monthlyByDay` — `[{ label, hours, date }]` hours slept per day for the chart

**Midnight simplification (v1):** a sleep's whole duration is attributed to the day its `startTime` falls on. A night sleep that crosses midnight counts toward the evening it began. This keeps the math simple and is accurate enough for at-a-glance trends; documented in a code comment.

## Helpers: `src/utils/formatters.js`

Add `formatDurationHM(seconds)` → `"9h 15m"`, `"45m"`, `"—"` for falsy. (Existing `formatDuration` is minutes/seconds-oriented for feedings; sleeps are hours/minutes.)

Add hook `src/hooks/useElapsed.js` → given a start timestamp, returns a live `"1:23:45"` string ticking every second (cleanup on unmount), for the active-sleep display. Returns empty string when no timestamp.

## Components

### `src/components/sleep/SleepTracker.jsx` (Dashboard widget)
A `card` hero, lavender gradient (`from-lavender-50`), placed on the Dashboard **below the feeding content**.
- **Awake state:** label "Last slept · woke {X ago}" (via `useTimeSince` on `lastSleep.endTime`), big lavender **"Start Sleep 🌙"** button → `addSleep({ babyId, startTime: now, endTime: null })`.
- **Asleep state:** 😴 "Sleeping" with live **`useElapsed(activeSleep.startTime)`** timer, amber/peach **"Wake Up ☀️"** button → `updateSleep(activeSleep.id, { endTime: now })` + success toast.
- Footer links: "Log a past sleep" → `/sleep/log`, and "View all sleep →" → `/sleep`.
- Loading → small spinner; disable buttons while the write is in flight.

### `src/pages/Sleep.jsx` (`/sleep`)
- A compact stats row (reusing the `StatCard` visual pattern): **Sleep Today** (`formatDurationHM(totalSleepToday)`), **Naps Today** (`napsToday`), **Status** (asleep live timer / "Awake").
- `<SleepChart />`.
- Full history grouped by day (reuse the `groupByDay` / `dayLabel` pattern from `History.jsx`), rendering `<SleepCard />` per sleep.
- `EmptyState` (🌙) with a "Log first sleep" action when there are no sleeps.
- A header "+ Log sleep" link → `/sleep/log`.

### `src/components/sleep/SleepChart.jsx`
Mirrors `FeedingChart` structure (Card, view dots, `ResponsiveContainer` + `BarChart`), lavender bars (`#a78bfa`). Two views: **7-Day** and **30-Day** hours slept. Custom tooltip shows `Xh Ym` and number of sleeps. Optional average `ReferenceLine` on hover (as feeding chart does).

### `src/components/sleep/SleepCard.jsx`
Mirrors `FeedingCard`. Left icon tile (🌙 on lavender `#a78bfa33`). Body: `{startTime} → {endTime or "ongoing"}` and a duration badge `⏰ 9h 15m`. Right: date (when `showDate`), edit link → `/sleep/log/{id}`, delete button with confirm `Modal`.

### `src/pages/LogSleep.jsx` (`/sleep/log`, `/sleep/log/:sleepId`)
Mirrors `LogFeeding` (react-hook-form, `toLocalDatetimeString`, Cancel/Save buttons, toasts).
- Fields: **Fell asleep** (`datetime-local`, required), **Woke up** (`datetime-local`, optional — empty = ongoing sleep, `endTime: null`).
- Validation: if wake provided, must be after start, else toast error.
- Edit mode loads via `getSleep`; create mode defaults start = now.

## Wiring

- **`App.jsx`** — add protected routes: `/sleep` → `Sleep`, `/sleep/log` → `LogSleep`, `/sleep/log/:sleepId` → `LogSleep`.
- **`Dashboard.jsx`** — render `<SleepTracker />` below the "Today's Feedings" section.
- **`TopBar.jsx`** — add `PAGE_TITLES`: `'/sleep': 'Sleep'`, `'/sleep/log': 'Log Sleep'`.
- **`SideNav.jsx`** (desktop) — add a **"Sleep"** nav item (moon icon) between "History" and "Baby Profile".
- **`BottomNav.jsx`** (mobile) — **unchanged** (stays 4 items per the placement decision); `/sleep` is reachable on mobile via the Dashboard widget's "View all sleep →" link.

## Styling

- Reuse existing utility classes: `card`, `btn-primary`, `btn-ghost`, `btn-icon`, `label`, `input-field`, `animate-fade-in`, `animate-slide-up`.
- Sleep accent = **lavender** (`lavender-*`, `#a78bfa`) with 🌙/😴/☀️ icons, to read as distinct from the peach feeding flows while staying in palette.
- Reuse `Modal`, `EmptyState`, `Spinner`, `Card`, `useTimeSince`, `useToast`.

## Testing / Verification

No test framework is present in the repo, so verification is manual against `npm run dev`:
1. Start Sleep → widget shows live ticking timer; a `sleeps` doc with `endTime: null` appears.
2. Wake Up → timer stops, duration shows, doc gets `endTime`.
3. Reload mid-sleep → still shows "asleep for…" (state from Firestore).
4. Manual log a past sleep with start+wake → appears in history with correct duration.
5. Edit and delete a sleep from `/sleep`.
6. Chart shows hours per day; stats (total today, naps) update.
7. `npm run build` passes.

## File Summary

**New:**
- `src/hooks/useSleeps.js`
- `src/hooks/useElapsed.js`
- `src/components/sleep/SleepTracker.jsx`
- `src/components/sleep/SleepChart.jsx`
- `src/components/sleep/SleepCard.jsx`
- `src/pages/Sleep.jsx`
- `src/pages/LogSleep.jsx`

**Edited:**
- `src/firebase/firestore.js` (sleeps CRUD + subscribe)
- `src/utils/formatters.js` (`formatDurationHM`)
- `src/App.jsx` (routes)
- `src/pages/Dashboard.jsx` (widget)
- `src/components/layout/TopBar.jsx` (titles)
- `src/components/layout/SideNav.jsx` (nav item)
- `firestore.rules` (sleeps rule)
- `firestore.indexes.json` (sleeps index)
