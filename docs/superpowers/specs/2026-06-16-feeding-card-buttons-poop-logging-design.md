# Feeding Card Buttons + Poop Logging — Design

**Date:** 2026-06-16
**Status:** Approved (pending spec review)

## Goal

Add two action buttons to the Feeding panel of the dashboard's "Today at a Glance"
card, and introduce lightweight poop ("diaper") logging that reuses the existing
feedings collection without polluting feeding statistics.

1. **🍼 Log Feed** — navigates to the new-feeding page (`/log`).
2. **💩 Poopy** — one-tap instant log of a poop event at the current time.

## Context

- The Feeding panel currently has only a `View feeding →` link to `/history`
  ([TodayGlance.tsx:111-131](../../../src/components/dashboard/TodayGlance.tsx#L111-L131)).
- The Sleep panel already pairs an action button (`Start Sleep`) with a
  `View sleep →` link — the new Feeding buttons mirror that pattern.
- There is no diaper/poop data model anywhere in the app today.
- Feeding stats, charts, counts, and "last fed" are all derived from the
  `feedings` array returned by [useFeedings.ts](../../../src/hooks/useFeedings.ts).

## Decisions

| Question | Decision |
|----------|----------|
| First button action | Navigate to `/log` (log a new feeding). |
| Poop logging UX | One-tap instant log at current time + toast. No form. |
| Poop storage | Reuse the `feedings` collection (no new collection/rules/indexes). |
| Poop vs. feed stats | **Separate** — poops never count toward feed count, total amount, "last fed", or charts. |
| Poop visibility | Shown in History list **and** as markers on the daily Timeline. |

## Data Model

A poop is stored as a document in the existing
`users/{uid}/feedings` collection, distinguished by a sentinel `type`:

```ts
{
  babyId,
  type: 'poop',
  startTime: Timestamp.fromDate(new Date()),
  notes: 'Poopy time 💩',
  // no amount, no unit, no items, no durationSeconds
}
```

- Add to [constants.ts](../../../src/utils/constants.ts):
  - `export const POOP_TYPE = 'poop'`
  - `export const POOP_NOTE = 'Poopy time 💩'`
  - `export function isPoop(f: { type?: string }): boolean { return f.type === POOP_TYPE }`
- Centralizing the marker in `isPoop()` avoids fragile note-string matching.
- `POOP_TYPE` is **not** added to `FEEDING_TYPES` / `FEEDING_TYPE_MAP`, so it never
  appears in the feeding-type filter chips or chart legends.

## Component / Code Changes

### 1. `constants.ts`
Add `POOP_TYPE`, `POOP_NOTE`, and `isPoop()` as above.

### 2. `firebase/firestore.ts`
No new function required — reuse `addFeeding(userId, data)`. (A thin
`addPoop` wrapper is optional but not necessary; `addFeeding` with the poop
shape is sufficient.)

### 3. `hooks/useFeedings.ts` (the chokepoint)
Partition the subscription payload so feeding stats stay accurate automatically:

- In the `subscribeToFeedings` callback, split incoming docs:
  - `feedings` state ← docs where `!isPoop(f)` (real feeds only).
  - new `poops` state ← docs where `isPoop(f)`.
- Derive `todayPoops` (poops with `isToday(startTime)`), analogous to `todayFeedings`.
- Add `poops` and `todayPoops` to the hook's return value.
- **No other change** — every existing stat/chart/count reads from `feedings`
  and therefore excludes poops with zero further edits.

### 4. `components/dashboard/TodayGlance.tsx`
In the Feeding panel:

- Add a button row above the existing `View feeding →` link, mirroring the
  Sleep panel's button styling:
  - **🍼 Log Feed** — `<Link to="/log">` styled as a primary peach button.
  - **💩 Poopy** — `<button onClick={logPoop}>` styled as a secondary button.
- Add a `logPoop` handler (parallel to the existing `startSleep`):
  - Guard on `baby?.id`, `user`, and a `busy` flag.
  - `await addFeeding(user.uid, { babyId, type: POOP_TYPE, startTime: now, notes: POOP_NOTE })`.
  - Success toast: `Logged 💩`. Error toast: `Could not save — please try again`.
- The `feedingCount` / `totalAmountToday` / `lastFedAgo` displays are unchanged
  and already exclude poops (they come from the partitioned `feedings`).

### 5. `utils/history.ts`
- Add a `'poop'` event kind:
  `{ kind: 'poop'; time: Date; poop: Feeding }`.
- `buildHistoryDays(feedings, sleeps, poops, filters)` — accept poops as a new
  param. Include poop events when `toggle !== 'sleeps'` (poops are a feeding-side
  event). Apply the existing notes `search` filter; ignore `typeFilter` for poops
  (they have no feeding type). Poops do **not** affect `feedingCount` /
  `totalAmount` in the day header.

### 6. `pages/History.tsx`
- Pull `poops` from `useFeedings()` and pass to `buildHistoryDays`.
- Render the `'poop'` event kind as a slim row (a small `PoopCard` or inline
  row): 💩 icon + formatted time + a delete affordance (reuse `deleteFeeding`).

### 7. `components/dashboard/DailyTimeline.tsx`
- Pull `todayPoops` from `useFeedings()`.
- Render each as a small 💩 marker positioned by `minutesFromMidnight`, visually
  distinct from the peach feeding dots (e.g. a small emoji/brown dot, z-index
  above sleep bands).
- Add a legend entry for 💩 Poop.
- Update the empty-state check so a day with only poops is not considered empty.

## Error Handling

- `logPoop` mirrors `startSleep`: disabled while `busy`, try/catch with an error
  toast, `busy` reset in `finally`.
- Firestore subscription errors continue to surface via the existing `error`
  path in `useFeedings`.

## Out of Scope (YAGNI)

- No poop notes/editing form (one-tap only).
- No poop counts on charts or the Export page.
- No separate diaper categories (wet vs. dirty).
- No dedicated `diapers` collection.

## Testing / Verification

Per project convention (no automated tests): `npm run typecheck` (or `tsc`),
then run the app and verify:

1. 🍼 button navigates to `/log`.
2. 💩 button logs a poop, toast appears, feed count/amount/"last fed" do **not** change.
3. Poop appears in History as a distinct row and on the Timeline as a marker.
4. Feeding charts and the type filter are unaffected by poops.
