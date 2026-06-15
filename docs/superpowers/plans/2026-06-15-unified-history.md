# Unified History Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the History tab into a unified per-day timeline of both feedings and sleeps, newest day first and newest-event-first within each day, with notes search, an event-type toggle, feeding-type chips, and per-day feeding + sleep summaries.

**Architecture:** A new pure helper `src/utils/history.ts` merges `Feeding[]` + `Sleep[]` into filtered, day-grouped `HistoryDay[]` with per-day stats. `src/pages/History.tsx` owns the filter UI and rendering, calling `useFeedings()` + `useSleeps()` and delegating all data shaping to the helper. Existing `FeedingCard` / `SleepCard` render individual events.

**Tech Stack:** React + TypeScript (strict), date-fns, Vitest (newly added for the pure helper).

---

## File Structure

- Create: `src/utils/history.ts` — pure merge/filter/group/stats helper.
- Create: `src/utils/history.test.ts` — unit tests for the helper.
- Create: `vitest.config.ts` — Vitest config (node environment).
- Modify: `package.json` — add `vitest` devDependency + `test` script.
- Modify: `src/pages/History.tsx` — consume helper, add event toggle, render both card types, new day header, generalized empty state.

The helper holds all logic that has edge cases worth testing; the page holds only React wiring and presentation.

---

## Task 1: Add Vitest and a failing helper test

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/utils/history.test.ts`
- Create: `src/utils/history.ts` (stub only, so the import resolves)

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add the test script**

In `package.json`, add to the `"scripts"` block (after the `"typecheck"` line):
```json
    "test": "vitest run",
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Create the helper stub `src/utils/history.ts`**

```ts
import type { Feeding, Sleep } from '../types'

export type EventToggle = 'both' | 'feedings' | 'sleeps'

export type HistoryEvent =
  | { kind: 'feeding'; time: Date; feeding: Feeding }
  | { kind: 'sleep'; time: Date; sleep: Sleep }

export interface HistoryDay {
  date: Date
  events: HistoryEvent[]
  feedingCount: number
  totalAmount: number
  sleepSeconds: number
  napCount: number
}

export interface HistoryFilters {
  toggle: EventToggle
  typeFilter: string[]
  search: string
}

export function buildHistoryDays(
  _feedings: Feeding[],
  _sleeps: Sleep[],
  _filters: HistoryFilters,
): HistoryDay[] {
  return []
}
```

- [ ] **Step 5: Write the first failing test in `src/utils/history.test.ts`**

These tests build `Feeding`/`Sleep` objects with `startTime` as a JS `Date`. That is valid because `toJsDate` (used by the helper) accepts `Date`, and the test casts via `as unknown as` to satisfy the `Timestamp` field type.

```ts
import { describe, it, expect } from 'vitest'
import { buildHistoryDays } from './history'
import type { Feeding, Sleep } from '../types'

function feeding(id: string, iso: string, extra: Partial<Feeding> = {}): Feeding {
  return {
    id,
    babyId: 'b1',
    type: 'formula',
    amount: 4,
    unit: 'oz',
    startTime: new Date(iso) as unknown as Feeding['startTime'],
    ...extra,
  }
}

function sleep(id: string, startIso: string, endIso: string | null, extra: Partial<Sleep> = {}): Sleep {
  return {
    id,
    babyId: 'b1',
    startTime: new Date(startIso) as unknown as Sleep['startTime'],
    endTime: endIso ? (new Date(endIso) as unknown as Sleep['endTime']) : null,
    ...extra,
  }
}

const NO_FILTERS = { toggle: 'both' as const, typeFilter: [], search: '' }

describe('buildHistoryDays — grouping and ordering', () => {
  it('merges feedings and sleeps into one day, newest event first', () => {
    const feedings = [feeding('f1', '2026-06-15T08:00:00')]
    const sleeps = [sleep('s1', '2026-06-15T12:00:00', '2026-06-15T13:00:00')]

    const days = buildHistoryDays(feedings, sleeps, NO_FILTERS)

    expect(days).toHaveLength(1)
    expect(days[0].events.map((e) => e.kind)).toEqual(['sleep', 'feeding'])
  })

  it('sorts days newest first', () => {
    const feedings = [
      feeding('f1', '2026-06-14T08:00:00'),
      feeding('f2', '2026-06-15T08:00:00'),
    ]
    const days = buildHistoryDays(feedings, [], NO_FILTERS)
    expect(days).toHaveLength(2)
    expect(days[0].events[0].kind === 'feeding' && days[0].events[0].feeding.id).toBe('f2')
  })

  it('skips events without a startTime', () => {
    const feedings = [feeding('f1', '2026-06-15T08:00:00'), { ...feeding('f2', '2026-06-15T09:00:00'), startTime: undefined }]
    const days = buildHistoryDays(feedings, [], NO_FILTERS)
    expect(days[0].events).toHaveLength(1)
  })
})
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — the stub returns `[]`, so `toHaveLength(1)` and the ordering assertions fail.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/utils/history.ts src/utils/history.test.ts
git commit -m "test: add vitest and failing tests for history helper"
```

---

## Task 2: Implement grouping and ordering

**Files:**
- Modify: `src/utils/history.ts`

- [ ] **Step 1: Implement merge/group/sort in `buildHistoryDays`**

Replace the entire contents of `src/utils/history.ts` with:
```ts
import { format, startOfDay } from 'date-fns'
import { toJsDate } from './formatters'
import type { Feeding, Sleep } from '../types'

export type EventToggle = 'both' | 'feedings' | 'sleeps'

export type HistoryEvent =
  | { kind: 'feeding'; time: Date; feeding: Feeding }
  | { kind: 'sleep'; time: Date; sleep: Sleep }

export interface HistoryDay {
  date: Date
  events: HistoryEvent[]
  feedingCount: number
  totalAmount: number
  sleepSeconds: number
  napCount: number
}

export interface HistoryFilters {
  toggle: EventToggle
  typeFilter: string[]
  search: string
}

function feedingAmount(f: Feeding): number {
  if (f.items && f.items.length > 0) {
    return f.items.reduce((s, item) => s + (item.amount || 0), 0)
  }
  return f.amount || 0
}

function sleepSeconds(s: Sleep): number {
  if (!s.startTime) return 0
  const start = toJsDate(s.startTime)
  const end = s.endTime ? toJsDate(s.endTime) : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

export function buildHistoryDays(
  feedings: Feeding[],
  sleeps: Sleep[],
  filters: HistoryFilters,
): HistoryDay[] {
  const events: HistoryEvent[] = []

  for (const f of feedings) {
    if (!f.startTime) continue
    events.push({ kind: 'feeding', time: toJsDate(f.startTime), feeding: f })
  }
  for (const s of sleeps) {
    if (!s.startTime) continue
    events.push({ kind: 'sleep', time: toJsDate(s.startTime), sleep: s })
  }

  const groups: Record<string, HistoryDay> = {}
  for (const ev of events) {
    const key = format(ev.time, 'yyyy-MM-dd')
    if (!groups[key]) {
      groups[key] = {
        date: startOfDay(ev.time),
        events: [],
        feedingCount: 0,
        totalAmount: 0,
        sleepSeconds: 0,
        napCount: 0,
      }
    }
    const day = groups[key]
    day.events.push(ev)
    if (ev.kind === 'feeding') {
      day.feedingCount += 1
      day.totalAmount += feedingAmount(ev.feeding)
    } else {
      day.napCount += 1
      day.sleepSeconds += sleepSeconds(ev.sleep)
    }
  }

  const days = Object.values(groups)
  for (const day of days) {
    day.events.sort((a, b) => b.time.getTime() - a.time.getTime())
    day.totalAmount = Math.round(day.totalAmount * 10) / 10
  }
  days.sort((a, b) => b.date.getTime() - a.date.getTime())
  return days
}
```

Note: `filters` is accepted but not yet applied — Task 3 wires it in. Stats are computed here so Task 4 only adds tests.

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS for all three grouping/ordering tests.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/history.ts
git commit -m "feat: merge and group feedings + sleeps by day"
```

---

## Task 3: Apply filters (toggle, type chips, search)

**Files:**
- Modify: `src/utils/history.test.ts`
- Modify: `src/utils/history.ts`

- [ ] **Step 1: Add failing filter tests**

Append to `src/utils/history.test.ts`:
```ts
describe('buildHistoryDays — filters', () => {
  const feedings = [
    feeding('f1', '2026-06-15T08:00:00', { type: 'formula', notes: 'big gulp' }),
    feeding('f2', '2026-06-15T09:00:00', { type: 'breast_left', notes: null }),
  ]
  const sleeps = [sleep('s1', '2026-06-15T12:00:00', '2026-06-15T13:00:00', { notes: 'restless' })]

  it('toggle "feedings" excludes sleeps', () => {
    const days = buildHistoryDays(feedings, sleeps, { toggle: 'feedings', typeFilter: [], search: '' })
    expect(days[0].events.every((e) => e.kind === 'feeding')).toBe(true)
  })

  it('toggle "sleeps" excludes feedings', () => {
    const days = buildHistoryDays(feedings, sleeps, { toggle: 'sleeps', typeFilter: [], search: '' })
    expect(days[0].events.every((e) => e.kind === 'sleep')).toBe(true)
  })

  it('typeFilter narrows feedings but never removes sleeps', () => {
    const days = buildHistoryDays(feedings, sleeps, { toggle: 'both', typeFilter: ['formula'], search: '' })
    const kinds = days[0].events.map((e) => e.kind)
    expect(kinds).toContain('sleep')
    expect(days[0].events.filter((e) => e.kind === 'feeding')).toHaveLength(1)
  })

  it('typeFilter matches feedings via items[].type', () => {
    const multi = feeding('f3', '2026-06-15T10:00:00', { type: 'formula', items: [{ type: 'pumped_bottle', amount: 3 }] })
    const days = buildHistoryDays([multi], [], { toggle: 'both', typeFilter: ['pumped_bottle'], search: '' })
    expect(days[0].events).toHaveLength(1)
  })

  it('search matches notes on both feedings and sleeps (case-insensitive)', () => {
    const gulp = buildHistoryDays(feedings, sleeps, { toggle: 'both', typeFilter: [], search: 'GULP' })
    expect(gulp[0].events).toHaveLength(1)
    const restless = buildHistoryDays(feedings, sleeps, { toggle: 'both', typeFilter: [], search: 'rest' })
    expect(restless[0].events.every((e) => e.kind === 'sleep')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — filters are not yet applied, so excluded events still appear.

- [ ] **Step 3: Add filtering before grouping**

In `src/utils/history.ts`, add these two helpers above `buildHistoryDays`:
```ts
function feedingMatchesType(f: Feeding, typeFilter: string[]): boolean {
  if (typeFilter.length === 0) return true
  if (typeFilter.includes(f.type as string)) return true
  return !!f.items?.some((item) => typeFilter.includes(item.type as string))
}

function matchesSearch(notes: string | null | undefined, q: string): boolean {
  if (!q) return true
  return !!notes && notes.toLowerCase().includes(q)
}
```

Then, inside `buildHistoryDays`, replace the two `for` loops that push events with:
```ts
  const q = filters.search.trim().toLowerCase()

  if (filters.toggle !== 'sleeps') {
    for (const f of feedings) {
      if (!f.startTime) continue
      if (!feedingMatchesType(f, filters.typeFilter)) continue
      if (!matchesSearch(f.notes, q)) continue
      events.push({ kind: 'feeding', time: toJsDate(f.startTime), feeding: f })
    }
  }
  if (filters.toggle !== 'feedings') {
    for (const s of sleeps) {
      if (!s.startTime) continue
      if (!matchesSearch(s.notes, q)) continue
      events.push({ kind: 'sleep', time: toJsDate(s.startTime), sleep: s })
    }
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS for all grouping and filter tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/history.ts src/utils/history.test.ts
git commit -m "feat: filter history by event type, feeding type, and notes"
```

---

## Task 4: Lock in per-day stats with tests

**Files:**
- Modify: `src/utils/history.test.ts`

Stats are already computed in Task 2; this task adds the tests that pin the behavior (count, summed amount, sleep seconds, nap count, and that stats reflect filtered events only).

- [ ] **Step 1: Add stats tests**

Append to `src/utils/history.test.ts`:
```ts
describe('buildHistoryDays — per-day stats', () => {
  it('computes feeding count and summed amount', () => {
    const feedings = [
      feeding('f1', '2026-06-15T08:00:00', { amount: 4 }),
      feeding('f2', '2026-06-15T09:00:00', { amount: 2.5 }),
    ]
    const days = buildHistoryDays(feedings, [], NO_FILTERS)
    expect(days[0].feedingCount).toBe(2)
    expect(days[0].totalAmount).toBe(6.5)
  })

  it('sums amount across items when present', () => {
    const f = feeding('f1', '2026-06-15T08:00:00', { amount: 99, items: [{ type: 'formula', amount: 3 }, { type: 'pumped_bottle', amount: 2 }] })
    const days = buildHistoryDays([f], [], NO_FILTERS)
    expect(days[0].totalAmount).toBe(5)
  })

  it('computes nap count and total sleep seconds', () => {
    const sleeps = [
      sleep('s1', '2026-06-15T01:00:00', '2026-06-15T02:00:00'),
      sleep('s2', '2026-06-15T12:00:00', '2026-06-15T12:30:00'),
    ]
    const days = buildHistoryDays([], sleeps, NO_FILTERS)
    expect(days[0].napCount).toBe(2)
    expect(days[0].sleepSeconds).toBe(5400)
  })

  it('reflects only filtered events in stats', () => {
    const feedings = [feeding('f1', '2026-06-15T08:00:00', { amount: 4 })]
    const sleeps = [sleep('s1', '2026-06-15T12:00:00', '2026-06-15T13:00:00')]
    const days = buildHistoryDays(feedings, sleeps, { toggle: 'feedings', typeFilter: [], search: '' })
    expect(days[0].napCount).toBe(0)
    expect(days[0].sleepSeconds).toBe(0)
    expect(days[0].feedingCount).toBe(1)
  })
})
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — stats logic already exists from Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/utils/history.test.ts
git commit -m "test: pin per-day history stats behavior"
```

---

## Task 5: Wire the helper into the History page

**Files:**
- Modify: `src/pages/History.tsx`

- [ ] **Step 1: Replace the contents of `src/pages/History.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useFeedings } from '../hooks/useFeedings'
import { useSleeps } from '../hooks/useSleeps'
import FeedingCard from '../components/feeding/FeedingCard'
import SleepCard from '../components/sleep/SleepCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { FEEDING_TYPES } from '../utils/constants'
import { format, isToday, isYesterday } from 'date-fns'
import { Link } from 'react-router-dom'
import { useBaby } from '../context/BabyContext'
import { formatAmount, formatDurationHM } from '../utils/formatters'
import { buildHistoryDays, type EventToggle } from '../utils/history'

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

const TOGGLES: { id: EventToggle; label: string }[] = [
  { id: 'both', label: 'All' },
  { id: 'feedings', label: 'Feedings' },
  { id: 'sleeps', label: 'Sleeps' },
]

export default function History() {
  const { feedings, loading: feedingsLoading } = useFeedings()
  const { sleeps, loading: sleepsLoading } = useSleeps()
  const { baby } = useBaby()
  const unit = baby?.unitPreference ?? 'oz'
  const [toggle, setToggle] = useState<EventToggle>('both')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const loading = feedingsLoading || sleepsLoading
  const hasAnyData = feedings.length > 0 || sleeps.length > 0

  const days = useMemo(
    () => buildHistoryDays(feedings, sleeps, { toggle, typeFilter, search }),
    [feedings, sleeps, toggle, typeFilter, search]
  )

  function toggleType(id: string) {
    setTypeFilter((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div>
          <label htmlFor="search" className="label">Search notes</label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            placeholder="Search by notes..."
          />
        </div>
        <div>
          <p className="label mb-2">Show</p>
          <div className="inline-flex rounded-full bg-cream-100 border border-cream-300 p-0.5">
            {TOGGLES.map((t) => {
              const active = toggle === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setToggle(t.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                    active ? 'bg-white text-lavender-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        {toggle !== 'sleeps' && (
          <div>
            <p className="label mb-2">Filter by type</p>
            <div className="flex flex-wrap gap-2">
              {FEEDING_TYPES.map((t) => {
                const active = typeFilter.includes(t.id)
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleType(t.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border ${
                      active
                        ? 'bg-lavender-100 border-lavender-400 text-lavender-700'
                        : 'bg-cream-100 border-cream-300 text-gray-500 hover:border-lavender-200'
                    }`}
                    aria-pressed={active}
                  >
                    <span style={t.mirrorIcon ? { display: 'inline-block', transform: 'scaleX(-1)' } : undefined}>{t.icon}</span> {t.shortLabel}
                  </button>
                )
              })}
              {typeFilter.length > 0 && (
                <button
                  onClick={() => setTypeFilter([])}
                  className="text-xs font-bold text-gray-400 px-2 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {days.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No activity found"
          message={hasAnyData ? 'Try adjusting the filters.' : "You haven't logged anything yet."}
          action={
            !hasAnyData ? (
              <Link to="/log" className="btn-primary text-sm px-5 py-2.5">
                Log First Feeding
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day.date.toISOString()}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                  {dayLabel(day.date)}
                </h2>
                {day.feedingCount > 0 && (
                  <span className="text-xs font-semibold text-gray-300">
                    {day.feedingCount} feeding{day.feedingCount !== 1 ? 's' : ''}
                    {day.totalAmount > 0 ? ` · ${formatAmount(day.totalAmount, unit)}` : ''}
                  </span>
                )}
                {day.napCount > 0 && (
                  <span className="text-xs font-semibold text-gray-300">
                    · {formatDurationHM(day.sleepSeconds)} sleep · {day.napCount} nap{day.napCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {day.events.map((ev) =>
                  ev.kind === 'feeding' ? (
                    <FeedingCard key={`f-${ev.feeding.id}`} feeding={ev.feeding} />
                  ) : (
                    <SleepCard key={`s-${ev.sleep.id}`} sleep={ev.sleep} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS — helper tests still green.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, log in, open the History tab. Confirm:
- Feedings and sleeps appear interleaved within each day, newest first.
- Day header shows feeding count + amount and, when there are sleeps, total sleep + nap count.
- The "All / Feedings / Sleeps" toggle filters correctly; type chips disappear under "Sleeps".
- Notes search matches both feeding and sleep notes.
- With no data (or filters that hide everything) the empty state reads correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/History.tsx
git commit -m "feat: unified feedings + sleeps timeline in History tab"
```

---

## Self-Review Notes

- **Spec coverage:** merge/group (Task 2), newest-first ordering (Task 2), filters incl. toggle/type/search (Task 3), per-day feeding + sleep stats (Tasks 2 + 4), page wiring with toggle, hidden chips, both card types, generalized empty state (Task 5). All spec sections covered.
- **Type consistency:** `buildHistoryDays`, `HistoryDay`, `HistoryEvent`, `HistoryFilters`, `EventToggle` are defined once in Task 1/2 and used unchanged in Tasks 3–5.
- **Ongoing sleep:** handled by `sleepSeconds()` counting to `new Date()` and by `SleepCard`'s existing "Sleeping" state — no extra work needed.
