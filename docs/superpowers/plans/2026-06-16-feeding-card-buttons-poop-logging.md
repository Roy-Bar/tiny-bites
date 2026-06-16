# Feeding Card Buttons + Poop Logging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 🍼 Log Feed and 💩 Poopy buttons to the dashboard Feeding panel, and log poops as `type:'poop'` feeding docs that are excluded from feed stats but shown in History and the Timeline.

**Architecture:** Poops reuse the existing `feedings` Firestore collection, marked by a sentinel `type: 'poop'`. `useFeedings` partitions docs into real feeds vs. poops at a single chokepoint, so every existing stat/chart/count automatically excludes poops. Poops surface separately in History and on the Daily Timeline.

**Tech Stack:** React + TypeScript (strict), Vite, Firebase Firestore, Tailwind, react-router-dom, date-fns.

**Testing note:** This project has no automated test suite (per project convention). Each task verifies with `npm run typecheck` and, where relevant, manual checks in the running app (`npm run dev`).

---

### Task 1: Poop marker constants

**Files:**
- Modify: `src/utils/constants.ts`

- [ ] **Step 1: Add the poop constants and helper**

Append to `src/utils/constants.ts` (after the existing exports):

```ts
// Poops reuse the feedings collection, marked by this sentinel type. They are
// intentionally NOT part of FEEDING_TYPES, so they never appear in feeding-type
// filters, charts, or stats.
export const POOP_TYPE = 'poop'
export const POOP_NOTE = 'Poopy time 💩'

export function isPoop(f: { type?: string | null }): boolean {
  return f.type === POOP_TYPE
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/utils/constants.ts
git commit -m "feat: add poop marker constants and isPoop helper"
```

---

### Task 2: Partition poops out of feeding stats in useFeedings

**Files:**
- Modify: `src/hooks/useFeedings.ts`

- [ ] **Step 1: Import the helper**

In `src/hooks/useFeedings.ts`, add `isPoop` to the constants import. There is no
existing import from `../utils/constants`, so add this line near the other imports:

```ts
import { isPoop } from '../utils/constants'
```

- [ ] **Step 2: Add a poops state and partition the subscription payload**

Add a `poops` state next to the existing `feedings` state (around line 38):

```ts
  const [feedings, setFeedings] = useState<Feeding[]>([])
  const [poops, setPoops] = useState<Feeding[]>([])
```

In the `subscribeToFeedings` success callback (around lines 53-57), replace
`setFeedings(data)` so real feeds and poops are split:

```ts
      (data) => {
        setFeedings(data.filter((f) => !isPoop(f)))
        setPoops(data.filter((f) => isPoop(f)))
        setError(null)
        setLoading(false)
      },
```

Also set `setPoops([])` alongside the existing `setFeedings([])` in the
no-user/no-baby early-return branch (around line 44).

- [ ] **Step 3: Derive todayPoops and return both**

Add after the `todayFeedings` memo (around line 70):

```ts
  const todayPoops = useMemo(
    () => poops.filter((p) => p.startTime && isToday(p.startTime.toDate())),
    [poops]
  )
```

Add `poops` and `todayPoops` to the returned object (around lines 166-178):

```ts
    feedings,
    poops,
    todayFeedings,
    todayPoops,
    lastFeeding,
```

(`isToday` is already imported from `date-fns` in this file.)

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useFeedings.ts
git commit -m "feat: partition poops out of feeding stats in useFeedings"
```

---

### Task 3: Add the two buttons + logPoop handler to the Feeding panel

**Files:**
- Modify: `src/components/dashboard/TodayGlance.tsx`

- [ ] **Step 1: Add imports**

In `src/components/dashboard/TodayGlance.tsx`, add `addFeeding` to the existing
firestore import (currently `import { addSleep, updateSleep } from '../../firebase/firestore'`):

```ts
import { addSleep, updateSleep, addFeeding } from '../../firebase/firestore'
```

Add the poop constants to imports:

```ts
import { POOP_TYPE, POOP_NOTE } from '../../utils/constants'
```

- [ ] **Step 2: Add the logPoop handler**

Add after the existing `wakeUp` function (around line 71), mirroring `startSleep`:

```ts
  async function logPoop() {
    if (!baby?.id || !user || busy) return
    setBusy(true)
    try {
      await addFeeding(user.uid, {
        babyId: baby.id,
        type: POOP_TYPE,
        startTime: Timestamp.fromDate(new Date()),
        notes: POOP_NOTE,
      })
      toast?.('Logged 💩')
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }
```

- [ ] **Step 3: Add the button row to the Feeding panel**

In the Feeding panel (`{/* Feeding */}`, around lines 111-131), insert a button
row between the `lastFeeding` paragraph (ends ~line 127) and the closing
`View feeding →` `<Link>` (line 128). Replace this block:

```tsx
          <p className="text-xs text-gray-400 mt-0.5">
            {lastFeeding ? `Last fed ${lastFedAgo}` : 'Not fed yet'}
          </p>
          <Link to="/history" className="text-xs font-bold text-peach-500 hover:underline mt-auto pt-3">
            View feeding →
          </Link>
```

with:

```tsx
          <p className="text-xs text-gray-400 mt-0.5">
            {lastFeeding ? `Last fed ${lastFedAgo}` : 'Not fed yet'}
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              to="/log"
              className="btn-primary text-sm !py-2 flex-1"
            >
              🍼 Log Feed
            </Link>
            <button
              onClick={logPoop}
              disabled={busy}
              aria-label="Log poopy time"
              className="text-sm py-2 px-3 rounded-xl bg-peach-100 text-peach-600 font-bold hover:bg-peach-200 transition-colors disabled:opacity-50"
            >
              💩
            </button>
          </div>
          <Link to="/history" className="text-xs font-bold text-peach-500 hover:underline mt-auto pt-3">
            View feeding →
          </Link>
```

Note: `btn-primary` is the peach filled button defined in `src/styles/index.css:27`
(the Sleep panel's equivalent is `btn-lavender`). It defaults to `py-3`; the
`!py-2` override matches the more compact Sleep button. `flex-1` lets it share the
row with the 💩 button.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. On the dashboard:
- 🍼 Log Feed navigates to `/log`.
- 💩 logs a poop, shows the `Logged 💩` toast, and the feed count / total amount /
  "Last fed" do **NOT** change.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/TodayGlance.tsx
git commit -m "feat: add Log Feed and Poopy buttons to dashboard feeding panel"
```

---

### Task 4: Show poops in History

**Files:**
- Modify: `src/utils/history.ts`
- Modify: `src/pages/History.tsx`

- [ ] **Step 1: Add a poop event kind in history.ts**

In `src/utils/history.ts`, extend `HistoryEvent`:

```ts
export type HistoryEvent =
  | { kind: 'feeding'; time: Date; feeding: Feeding }
  | { kind: 'sleep'; time: Date; sleep: Sleep }
  | { kind: 'poop'; time: Date; poop: Feeding }
```

- [ ] **Step 2: Accept poops in buildHistoryDays and emit poop events**

Change the signature to add `poops` as a third parameter (filters moves to fourth):

```ts
export function buildHistoryDays(
  feedings: Feeding[],
  sleeps: Sleep[],
  poops: Feeding[],
  filters: HistoryFilters,
): HistoryDay[] {
```

Inside, after the feedings loop (the `if (filters.toggle !== 'sleeps')` block),
add a poops loop. Poops are a feeding-side event, so include them unless the
toggle is `sleeps`. Apply the notes search filter; ignore `typeFilter` for poops:

```ts
  if (filters.toggle !== 'sleeps') {
    for (const p of poops) {
      if (!p.startTime) continue
      if (!matchesSearch(p.notes, q)) continue
      events.push({ kind: 'poop', time: toJsDate(p.startTime), poop: p })
    }
  }
```

**Required fix — guard the day-totals accumulation.** The current code uses a
two-way branch where the `else` increments nap/sleep totals:

```ts
    if (ev.kind === 'feeding') {
      day.feedingCount += 1
      day.totalAmount += feedingAmount(ev.feeding)
    } else {
      day.napCount += 1
      day.sleepSeconds += sleepSeconds(ev.sleep)
    }
```

A new `'poop'` event would fall into that `else` and be miscounted as a nap (and
`sleepSeconds(ev.sleep)` would be `undefined`). Change the `else` to an explicit
`else if (ev.kind === 'sleep')` so poop events are added to `day.events` but
contribute to no totals:

```ts
    if (ev.kind === 'feeding') {
      day.feedingCount += 1
      day.totalAmount += feedingAmount(ev.feeding)
    } else if (ev.kind === 'sleep') {
      day.napCount += 1
      day.sleepSeconds += sleepSeconds(ev.sleep)
    }
```

- [ ] **Step 3: Wire poops into History.tsx**

In `src/pages/History.tsx`:

Pull `poops` from the hook:

```ts
  const { feedings, poops, loading: feedingsLoading } = useFeedings()
```

Pass it into `buildHistoryDays` (note new param order) and include `poops` in the
memo deps:

```ts
  const days = useMemo(
    () => buildHistoryDays(feedings, sleeps, poops, { toggle, typeFilter, search }),
    [feedings, sleeps, poops, toggle, typeFilter, search]
  )
```

Render the poop event kind in the events map (around lines 161-167):

```tsx
                {day.events.map((ev) =>
                  ev.kind === 'feeding' ? (
                    <FeedingCard key={`f-${ev.feeding.id}`} feeding={ev.feeding} />
                  ) : ev.kind === 'sleep' ? (
                    <SleepCard key={`s-${ev.sleep.id}`} sleep={ev.sleep} />
                  ) : (
                    <PoopRow key={`p-${ev.poop.id}`} poop={ev.poop} />
                  )
                )}
```

- [ ] **Step 4: Create the PoopRow component**

Create `src/components/feeding/PoopRow.tsx`. Mirror the visual weight of a small
card row and reuse `deleteFeeding` + the toast for removal:

```tsx
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { deleteFeeding } from '../../firebase/firestore'
import { formatTime } from '../../utils/formatters'
import { useToast } from '../ui/Toast'
import type { Feeding } from '../../types'

export default function PoopRow({ poop }: { poop: Feeding }) {
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!user || busy) return
    setBusy(true)
    try {
      await deleteFeeding(user.uid, poop.id)
      toast?.('Deleted')
    } catch {
      toast?.('Could not delete — please try again', 'error')
      setBusy(false)
    }
  }

  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-peach-100 flex items-center justify-center text-base" aria-hidden="true">💩</span>
      <span className="text-sm font-bold text-gray-700">Poopy time</span>
      <span className="text-xs text-gray-400 ml-auto">{formatTime(poop.startTime)}</span>
      <button
        onClick={remove}
        disabled={busy}
        aria-label="Delete poop entry"
        className="text-xs font-bold text-gray-300 hover:text-blush-500 transition-colors disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  )
}
```

Add the import to `src/pages/History.tsx`:

```ts
import PoopRow from '../components/feeding/PoopRow'
```

Note: verify `formatTime` is exported from `src/utils/formatters` (it is used in
`DailyTimeline.tsx`). Verify the `card` class and `blush-500` color exist (both
are used elsewhere — `card` throughout, `blush` in `TodayGlance.tsx`).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. In History:
- A logged poop appears as a 💩 "Poopy time" row at the correct time.
- The day header feed count / amount are unchanged by poops.
- Deleting the poop row removes it.
- The "Feedings" / "Sleeps" toggle: poops show under "Feedings" and "All", hidden
  under "Sleeps".

- [ ] **Step 7: Commit**

```bash
git add src/utils/history.ts src/pages/History.tsx src/components/feeding/PoopRow.tsx
git commit -m "feat: show poop entries in History"
```

---

### Task 5: Show poops on the Daily Timeline

**Files:**
- Modify: `src/components/dashboard/DailyTimeline.tsx`

- [ ] **Step 1: Pull todayPoops**

In `src/components/dashboard/DailyTimeline.tsx`, update the hook call (line 56):

```ts
  const { todayFeedings, todayPoops } = useFeedings()
```

- [ ] **Step 2: Update the empty-state check**

A day with only poops should not read as empty (around line 64):

```ts
  const isEmpty = todayFeedings.length === 0 && bands.length === 0 && todayPoops.length === 0
```

- [ ] **Step 3: Render poop markers**

After the `todayFeedings.map(...)` block that renders feeding dots (ends ~line 130),
add poop markers. Reuse the existing `minutesFromMidnight` helper:

```tsx
          {todayPoops.map((p) => {
            const pct = (minutesFromMidnight(p.startTime) / DAY_MINUTES) * 100
            return (
              <span
                key={`poop-${p.id}`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-sm z-20 select-none"
                style={{ left: `${pct}%` }}
                role="img"
                aria-label={`Poopy time at ${formatTime(p.startTime)}`}
              >
                💩
              </span>
            )
          })}
```

(`formatTime` and `minutesFromMidnight` are already available in this file.)

- [ ] **Step 4: Add a legend entry**

In the legend block (around lines 187-194), add after the Sleep legend span:

```tsx
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <span aria-hidden="true">💩</span> Poop
        </span>
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. On the dashboard timeline:
- A poop logged today shows a 💩 marker at the right position.
- The legend shows 💩 Poop.
- A day with only a poop (no feeds/sleeps) is not shown as "Nothing logged".

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/DailyTimeline.tsx
git commit -m "feat: show poop markers on the daily timeline"
```

---

## Self-Review

**Spec coverage:**
- Two buttons (🍼 → `/log`, 💩 one-tap) — Task 3. ✅
- Poop stored as `type:'poop'` feeding doc — Tasks 1 + 3. ✅
- Marker centralized via `isPoop` (no note-string matching) — Task 1. ✅
- Poops excluded from all feed stats/charts via single chokepoint — Task 2. ✅
- Poops shown in History — Task 4. ✅
- Poops shown on Timeline + legend — Task 5. ✅
- Error handling mirrors `startSleep` (busy guard, try/catch, toast) — Task 3. ✅
- Out-of-scope items (forms, charts, diaper categories, separate collection) — not implemented. ✅

**Type consistency:** `POOP_TYPE`/`POOP_NOTE`/`isPoop` (Task 1) used consistently in Tasks 2-3. `poops`/`todayPoops` (Task 2) consumed in Tasks 4-5. `HistoryEvent` `'poop'` kind with `poop: Feeding` (Task 4) matches `PoopRow`'s `{ poop: Feeding }` prop and the History render switch.

**Verification approach:** typecheck + manual (no test suite per project convention).
