# Dashboard Overview + Sleep-on-Timeline — Design

**Date:** 2026-06-15
**Status:** Approved

## Goal

Make the home dashboard a single summarized overview (detail lives in the
Feeding/Sleep pages), and show sleep periods alongside feedings on "Today's
Timeline" so it's clear when the baby slept vs fed. Palette: orange = feeding,
purple (lavender) = sleep.

## Part 1 — Sleep periods on Today's Timeline

File: `src/components/dashboard/DailyTimeline.tsx` (pull in `useSleeps`).

- Draw a lavender **sleep band** per sleep that overlaps today's window
  `[startOfDay(now), startOfDay(now)+24h)`: `bandStart = max(sleepStart, todayStart)`,
  `bandEnd = min(sleepEnd ?? now, todayEnd)`; skip if `bandEnd <= bandStart`.
  Left % = `(bandStart - todayStart)/1440min * 100`; width % similarly.
- Bands render BEHIND the current-time marker and the feeding dots (DOM order /
  low z-index). Feeding dots are a single orange (`#f96b3a`) with a white border
  (no per-type colors / mixed-feeding gradient on this bar — keeps feeding=orange
  vs sleep=purple unambiguous). The tooltip still names the feeding type.
- Legend row under the bar: `● Feeding` (peach) and a `▬ Sleep` swatch (lavender).
- Sleep band hover/focus tooltip: `Sleeping <start>–<end|now> · <Hh Mm>` using
  `formatTime` + `formatDurationHM`. Feeding tooltip unchanged.
- Show the bar when there are feedings OR overlapping sleeps today. Empty copy:
  "Nothing logged today yet."
- Ongoing sleep band ends at "now".

## Part 2 — Unified "Today at a Glance" card

New file: `src/components/dashboard/TodayGlance.tsx`. Replaces three sections in
`Dashboard.tsx`: `StatsBar`, the "Today's Feedings" `FeedingCard` list, and
`SleepTracker`.

Layout — one card, two columns:
- **Feeding** (peach accent): today's feeding count + total amount; last-fed time
  + relative "Xh ago"; `View feeding →` link to `/history`.
- **Sleep** (lavender accent): total sleep today + nap count; live status
  (asleep `H:MM` via `useElapsedHM(activeSleep.startTime)`, else awake `H:MM` via
  `useElapsedHM(lastSleep.endTime)`, else "No sleep yet"); a **Start Sleep / Wake
  Up** button reusing SleepTracker's add/update logic; `View sleep →` link to `/sleep`.
- Footer: baby age (`formatBabyAge`).

Data: `useFeedings` (`todayFeedings`, `totalAmountToday`, `lastFeeding`),
`useSleeps` (`totalSleepToday`, `napsToday`, `activeSleep`, `lastSleep`),
`useElapsedHM`, `useTimeSince`, `useBaby`. Start/Wake uses `addSleep`/`updateSleep`
from `firebase/firestore` with `Timestamp.fromDate(new Date())`, `useToast`,
and a local `busy` flag — mirroring `SleepTracker`.

## Resulting dashboard order

1. Welcome banner (keep)
2. Today at a Glance (new — warm tinted peach/lavender panels, icon chips,
   friendly copy, status pill, baby age in the header)
3. Today's Timeline (now with sleep bands; orange feeding dots)
4. FeedingChart (keep)
5. SleepChart (existing component, defaults to 7-Day Sleep view)

## Cleanup

- Delete `src/components/dashboard/StatsBar.tsx` (no longer imported anywhere).
- Keep `SleepTracker.tsx` (still used by `src/pages/Sleep.tsx`).
- `FeedingCard`, `FeedingChart` unchanged.

## Out of scope

- No change to the Feeding/Sleep detail pages (besides the awake-for status added
  separately on the Sleep page).
- No new charts; FeedingChart stays as-is.
- Sleep attribution for bands is by overlap with today, independent of the
  "attributed to start day" rule used elsewhere — this is a visual today-only view.
