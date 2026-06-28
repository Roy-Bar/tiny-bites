# Poop Time Picker + History Edit — Design

**Date:** 2026-06-28
**Status:** Draft (pending spec review)

## Goal

Make poop ("Poopy time") logging time-aware:

1. Tapping 💩 on the dashboard opens a **time picker** (defaulting to now) so the
   time can be confirmed or adjusted before saving — instead of an instant log.
2. A logged poop's time can be **edited from the History tab**.
3. Poops can be **filtered in History** via a dedicated "Poops" view in the
   "Show" toggle.
4. Remove the "+ Poopy time 💩" shortcut button from the Log Feeding notes field,
   and stop storing the `Poopy time 💩` note on poop documents.

This builds on the existing poop model from
[2026-06-16-feeding-card-buttons-poop-logging-design.md](2026-06-16-feeding-card-buttons-poop-logging-design.md):
poops are documents in `users/{uid}/feedings` with `type: 'poop'`, partitioned
out of feeding stats by `isPoop()` in [useFeedings.ts](../../../src/hooks/useFeedings.ts).

## Decisions

| Question | Decision |
|----------|----------|
| Dashboard 💩 action | Opens a modal time picker, pre-filled to the current time. Save logs the poop; one extra tap vs. today. |
| History editing | Add an edit-time affordance to each poop row, reusing the same modal. |
| Stored note | New poops save **with no note** (`notes` omitted). The `POOP_NOTE` constant is removed. Existing poops keep whatever note they have. |
| Picker UI | A new shared `PoopTimeModal` component (single `datetime-local` input + Save/Cancel). The existing `Modal` is confirm-only with no custom body, so it is not reused here. |
| Display labels | The hardcoded "Poopy time" labels in `PoopRow` and `DailyTimeline` are UI text and are unchanged. |
| History filter | Add a 4th "Poops" 💩 option to the "Show" toggle. `both`=all, `feedings`=real feeds only (poops excluded), `poops`=poops only, `sleeps`=sleeps only. This changes today's behavior where "Feedings" also showed poops. |

## Component / Code Changes

### 1. `components/feeding/PoopTimeModal.tsx` (new)

A small dialog mirroring the look of the existing
[Modal.tsx](../../../src/components/ui/Modal.tsx) (same overlay, `card` body,
Escape-to-close, click-backdrop-to-close), but with a body containing one
`datetime-local` input.

Props:

```ts
interface PoopTimeModalProps {
  isOpen: boolean
  title: string                 // "Log poopy time 💩" | "Edit time"
  initialTime: Date             // dashboard: now; edit: poop.startTime
  confirmLabel?: string         // default "Save"
  saving?: boolean              // disables Save + shows spinner
  onClose: () => void
  onSave: (time: Date) => void  // parent persists; modal stays open until parent closes
}
```

- Internal state holds the `datetime-local` string, seeded from `initialTime` via
  `toLocalDatetimeString` ([formatters.ts](../../../src/utils/formatters.ts)).
  Re-seed whenever `isOpen`/`initialTime` changes (so reopening for a different
  row shows the right time).
- Save parses the string with `new Date(...)` and calls `onSave(date)`. The
  parent owns the async write and `saving` flag; the parent calls `onClose` on
  success. (This matches how `TodayGlance` and the cards already own their
  Firestore writes and toasts.)

### 2. `components/dashboard/TodayGlance.tsx`

- Replace the instant `logPoop` with modal-driven flow:
  - Add `poopOpen` state. The 💩 button sets `poopOpen = true` (no longer writes
    directly).
  - Render `<PoopTimeModal isOpen={poopOpen} title="Log poopy time 💩"
    initialTime={new Date()} saving={busy} onClose={...} onSave={savePoop} />`.
  - `savePoop(time)` guards on `baby?.id`/`user`/`busy`, then
    `addFeeding(user.uid, { babyId, type: POOP_TYPE, startTime: Timestamp.fromDate(time) })`
    — **no `notes` field**. Toast `Logged 💩` on success, error toast on failure,
    `busy` reset in `finally`, and `onClose` on success.
- Remove the `POOP_NOTE` import; keep `POOP_TYPE`.

### 3. `components/feeding/PoopRow.tsx`

- Add an **edit** button (pencil icon, matching `SleepCard`'s edit button styling)
  before the existing ✕ delete button.
- Add `editOpen` + `saving` state. Edit opens
  `<PoopTimeModal isOpen={editOpen} title="Edit time" initialTime={toDate(poop.startTime)} ... />`.
- `onSave(time)` calls `updateFeeding(user.uid, poop.id, { startTime: Timestamp.fromDate(time) })`,
  toast `Updated`, close on success, error toast on failure. (`updateFeeding`
  already exists in [firestore.ts](../../../src/firebase/firestore.ts#L66).)

### 4. `pages/LogFeeding.tsx`

- Remove the "+ Poopy time 💩" button block (the `flex items-center justify-between`
  wrapper at lines ~244-258 with its `Controller`), leaving a plain `Notes
  (optional)` label above the existing notes `<textarea>`.

### 5. `utils/constants.ts`

- Remove the now-unused `export const POOP_NOTE`. Keep `POOP_TYPE` and `isPoop()`.

### 6. `utils/history.ts`

- Extend `EventToggle` to `'both' | 'feedings' | 'sleeps' | 'poops'`.
- Update the three inclusion guards in `buildHistoryDays` so each kind shows only
  in its own view plus "both":
  - feedings: `toggle === 'both' || toggle === 'feedings'`
  - sleeps: `toggle === 'both' || toggle === 'sleeps'`
  - poops: `toggle === 'both' || toggle === 'poops'`
  (Previously feedings and poops both ran on `toggle !== 'sleeps'`, and sleeps on
  `toggle !== 'feedings'`; the new guards give clean per-kind separation.)

### 7. `pages/History.tsx`

- Add `{ id: 'poops', label: 'Poops' }` to the `TOGGLES` array (after Sleeps).
- The "Filter by type" chips apply only to real feedings, so show them when
  `toggle === 'both' || toggle === 'feedings'` (currently `toggle !== 'sleeps'`,
  which would wrongly show them in the Poops view).

## Data Flow

- Dashboard: 💩 → modal (now) → Save → `addFeeding({type:'poop', startTime})` →
  `subscribeToFeedings` → `useFeedings` partitions it into `poops`/`todayPoops`
  (unchanged) → appears on Timeline + History.
- History edit: pencil → modal (existing time) → Save →
  `updateFeeding({startTime})` → live subscription re-renders the row in its new
  chronological position.

## Error Handling

- Both `savePoop` and the row's edit save mirror existing patterns: disabled
  while `saving`, try/catch with an error toast, flag reset in `finally`, modal
  closed only on success.

## Out of Scope (YAGNI)

- No poop notes field or wet/dirty categories (still one-tap-plus-time).
- No bulk editing; no changes to charts, Export, or the type filter.
- No migration of existing poop docs' notes.

## Testing / Verification

Per project convention (no automated tests): `npm run typecheck`, then run the
app and verify:

1. Dashboard 💩 opens the picker defaulted to now; Save logs a poop at the chosen
   time; Cancel/Escape/backdrop dismiss without logging.
2. The poop appears on the Timeline and in History at the chosen time.
3. History poop row's edit button changes the time; the row re-sorts live.
4. Feed count / total amount / "last fed" remain unaffected by poops.
5. Log Feeding no longer shows the "+ Poopy time 💩" button; new poops store no note.
6. History "Show" toggle has a "Poops" option: it lists only poops; "Feedings"
   no longer lists poops; "All" lists everything; type chips hidden in the Poops view.
