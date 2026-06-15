# Unified History Tab — Design

**Date:** 2026-06-15
**Status:** Approved

## Goal

The History tab currently lists only feedings, grouped by day. Make it a unified
timeline of **both feedings and sleeps**, so a user can see what happened on each
day and when. Events are grouped by day (newest day first) and ordered newest →
oldest within each day.

## Approach

The merge + grouping + per-day stats logic is extracted into a **pure helper
module** (`src/utils/history.ts`). The filter UI and rendering stay in
`src/pages/History.tsx`. Both `FeedingCard` and `SleepCard` already exist and
render their own time, so rendering is just selecting the right card per event.

Rejected alternative: a dedicated `useHistory` hook. Unnecessary — `useFeedings`
and `useSleeps` already exist; only a pure function is needed to combine their
outputs, which is also easier to unit-test.

## Data structures

```ts
type HistoryEvent =
  | { kind: 'feeding'; time: Date; feeding: Feeding }
  | { kind: 'sleep'; time: Date; sleep: Sleep }

interface HistoryDay {
  date: Date              // startOfDay
  events: HistoryEvent[]  // newest → oldest
  feedingCount: number
  totalAmount: number     // summed across feeding.items[].amount (fallback feeding.amount)
  sleepSeconds: number    // summed sleep duration; ongoing sleep counts up to now
  napCount: number
}
```

`time` is the event's `startTime` converted to a JS Date via the existing
`toJsDate` formatter. Events missing a `startTime` are skipped.

## Helper API

```ts
type EventToggle = 'both' | 'feedings' | 'sleeps'

interface HistoryFilters {
  toggle: EventToggle
  typeFilter: string[]   // feeding type ids; applies to feedings only
  search: string         // matches notes on both feedings and sleeps
}

function buildHistoryDays(
  feedings: Feeding[],
  sleeps: Sleep[],
  filters: HistoryFilters,
): HistoryDay[]
```

Behavior:
- Apply filters first, then group.
- `search` (trimmed, case-insensitive) matches `notes` on feedings and sleeps.
- `typeFilter` narrows feedings only (a feeding matches if its `type` or any
  `items[].type` is selected); never excludes sleeps.
- `toggle`: `feedings` excludes all sleeps; `sleeps` excludes all feedings;
  `both` includes everything.
- Per-day stats are computed from the **filtered/visible** events only.
- Days sorted newest → oldest; events within a day sorted by `time` descending.

Sleep duration reuses the same rule as the rest of the app: `endTime - startTime`,
and an ongoing sleep (no `endTime`) counts up to `now`.

## Page (History.tsx)

- Calls `useFeedings()` and `useSleeps()`. `loading` = either still loading.
- Filter bar:
  - Notes search input (existing).
  - **New** event toggle: `Both` / `Feedings` / `Sleeps` (segmented control,
    default `Both`).
  - Feeding-type chips (existing) — **hidden when toggle is `Sleeps`**.
- Day header: `<dayLabel> · N feedings · <amount> · <Hh Mm> sleep · K naps`.
  Each stat segment is omitted when its count is zero (a day with no sleep shows
  no sleep/nap segment; a day with no feedings shows no feeding segment).
- Each event renders `FeedingCard` (kind `feeding`) or `SleepCard` (kind `sleep`).
- Ongoing sleeps render via `SleepCard`'s existing "Sleeping" state and sort by
  start time like any other event.

## Empty state

Generalized from feedings-only copy:
- Title: `No activity found`
- Message (nothing logged at all): `You haven't logged anything yet.`
- Message (filters hide everything): `Try adjusting the filters.`
- Action (nothing logged at all): link to log a feeding.

## Out of scope

- Editing/deleting from History (already handled inside the cards).
- Sleep does not have a "type", so type chips never apply to sleeps.
- No CSV/export changes.
- No change to sleeps crossing midnight: a sleep is attributed to the day it
  started (consistent with existing sleep aggregation).
