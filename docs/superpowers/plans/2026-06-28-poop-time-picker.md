# Poop Time Picker + History Edit/Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make poop logging time-aware — pick/confirm a time when logging from the dashboard, edit the time from History, filter poops in History, and drop the "Poopy time" notes shortcut.

**Architecture:** A new shared `PoopTimeModal` (a `datetime-local` dialog) drives both the dashboard "log poop" flow and the History row "edit time" flow. Poops remain documents in `users/{uid}/feedings` with `type: 'poop'`, partitioned out of feeding stats by `isPoop()`. History gains a 4th "Poops" view in its Show toggle.

**Tech Stack:** React + TypeScript, Vite, react-router-dom, Firebase Firestore, Tailwind, date-fns.

## Global Constraints

- **No automated tests** for this project (per convention). Verify each task with `npm run typecheck` and manual app checks — do NOT add test files.
- Commit with personal identity: `Roy Bar <roy.bar134@gmail.com>`. Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Poops must never affect feeding stats (feed count, total amount, "last fed", charts). They already are excluded via the `feedings`/`poops` partition in `useFeedings`.
- Firestore writes follow the existing pattern: guard on `user`/`baby?.id`/busy flag, `try/catch` with toast, flag reset in `finally`, close modal only on success.
- Spec: [docs/superpowers/specs/2026-06-28-poop-time-picker-design.md](../specs/2026-06-28-poop-time-picker-design.md).

---

### Task 1: `PoopTimeModal` component

**Files:**
- Create: `src/components/feeding/PoopTimeModal.tsx`

**Interfaces:**
- Consumes: `toLocalDatetimeString(date?: Date | null): string` from `src/utils/formatters.ts`.
- Produces: default export `PoopTimeModal` with props
  `{ isOpen: boolean; title: string; initialTime: Date; confirmLabel?: string; saving?: boolean; onClose: () => void; onSave: (time: Date) => void }`.
  Parent owns the async write and `saving` flag; parent calls `onClose` on success. Modal does NOT auto-close on save.

- [ ] **Step 1: Create the component**

Create `src/components/feeding/PoopTimeModal.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { toLocalDatetimeString } from '../../utils/formatters'
import Spinner from '../ui/Spinner'

interface PoopTimeModalProps {
  isOpen: boolean
  title: string
  initialTime: Date
  confirmLabel?: string
  saving?: boolean
  onClose: () => void
  onSave: (time: Date) => void
}

export default function PoopTimeModal({
  isOpen,
  title,
  initialTime,
  confirmLabel = 'Save',
  saving = false,
  onClose,
  onSave,
}: PoopTimeModalProps) {
  const [value, setValue] = useState('')

  // Re-seed the input each time the modal opens (or targets a different time),
  // so reopening for another row shows that row's time.
  useEffect(() => {
    if (isOpen) setValue(toLocalDatetimeString(initialTime))
  }, [isOpen, initialTime])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleSave() {
    if (!value) return
    onSave(new Date(value))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="poop-modal-title"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card p-6 w-full max-w-sm animate-slide-up">
        <h2 id="poop-modal-title" className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
        <label htmlFor="poop-time" className="label">Time</label>
        <input
          id="poop-time"
          type="datetime-local"
          className="input-field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2" disabled={saving}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="btn-primary text-sm px-4 py-2"
          >
            {saving ? <Spinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors). The component is not yet imported anywhere, which is fine.

- [ ] **Step 3: Commit**

```bash
git add src/components/feeding/PoopTimeModal.tsx
git commit -m "feat: add PoopTimeModal datetime picker dialog"
```

---

### Task 2: Dashboard 💩 opens the picker; stop storing the poop note

**Files:**
- Modify: `src/components/dashboard/TodayGlance.tsx`
- Modify: `src/utils/constants.ts`

**Interfaces:**
- Consumes: `PoopTimeModal` (Task 1); `addFeeding(userId, data)`, `POOP_TYPE`, `Timestamp`.
- Produces: no exported API change.

- [ ] **Step 1: Remove the unused `POOP_NOTE` constant**

In `src/utils/constants.ts`, delete this line (line 65):

```ts
export const POOP_NOTE = 'Poopy time 💩'
```

Leave the comment above it and `POOP_TYPE` / `isPoop()` intact.

- [ ] **Step 2: Update imports in `TodayGlance.tsx`**

Change the constants import (line 13) from:

```ts
import { POOP_TYPE, POOP_NOTE } from '../../utils/constants'
```

to:

```ts
import { POOP_TYPE } from '../../utils/constants'
```

Add the modal import after the `FeedingIcon` import (line 16):

```ts
import PoopTimeModal from '../feeding/PoopTimeModal'
```

- [ ] **Step 3: Add modal state**

In `TodayGlance`, after `const [busy, setBusy] = useState(false)` (line 26), add:

```ts
  const [poopOpen, setPoopOpen] = useState(false)
```

- [ ] **Step 4: Replace `logPoop` with a time-aware `savePoop`**

Replace the entire `logPoop` function (lines 75-91) with:

```tsx
  async function savePoop(time: Date) {
    if (!baby?.id || !user || busy) return
    setBusy(true)
    try {
      await addFeeding(user.uid, {
        babyId: baby.id,
        type: POOP_TYPE,
        startTime: Timestamp.fromDate(time),
      })
      toast?.('Logged 💩')
      setPoopOpen(false)
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }
```

- [ ] **Step 5: Make the 💩 button open the modal**

Change the 💩 button's `onClick` (line 158) from `onClick={logPoop}` to:

```tsx
              onClick={() => setPoopOpen(true)}
```

Note: keep `disabled={busy}` on the button.

- [ ] **Step 6: Render the modal**

Immediately before the final closing `</div>` of the component's returned root (after the Sleep panel's closing `</div>` and the grid's closing `</div>`, i.e. just before the last `</div>` that closes the `card` wrapper on line 204), add:

```tsx
      <PoopTimeModal
        isOpen={poopOpen}
        title="Log poopy time 💩"
        initialTime={new Date()}
        saving={busy}
        onClose={() => setPoopOpen(false)}
        onSave={savePoop}
      />
```

- [ ] **Step 7: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (If it reports `POOP_NOTE` still imported/used anywhere, fix that import.)

- [ ] **Step 8: Commit**

```bash
git add src/components/dashboard/TodayGlance.tsx src/utils/constants.ts
git commit -m "feat: dashboard poop button opens time picker; drop poop note"
```

---

### Task 3: Edit poop time from History (`PoopRow`)

**Files:**
- Modify: `src/components/feeding/PoopRow.tsx`

**Interfaces:**
- Consumes: `PoopTimeModal` (Task 1); `updateFeeding(userId, feedingId, data)`, `deleteFeeding`, `toJsDate`, `Timestamp`.
- Produces: no exported API change.

- [ ] **Step 1: Rewrite `PoopRow.tsx` with an edit button + modal**

Replace the entire contents of `src/components/feeding/PoopRow.tsx` with:

```tsx
import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { deleteFeeding, updateFeeding } from '../../firebase/firestore'
import { formatTime, toJsDate } from '../../utils/formatters'
import { useToast } from '../ui/Toast'
import PoopTimeModal from './PoopTimeModal'
import type { Feeding } from '../../types'

export default function PoopRow({ poop }: { poop: Feeding }) {
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

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

  async function saveTime(time: Date) {
    if (!user || busy) return
    setBusy(true)
    try {
      await updateFeeding(user.uid, poop.id, { startTime: Timestamp.fromDate(time) })
      toast?.('Updated')
      setEditOpen(false)
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card px-4 py-3 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-peach-100 flex items-center justify-center text-base" aria-hidden="true">💩</span>
        <span className="text-sm font-bold text-gray-700">Poopy time</span>
        <span className="text-xs text-gray-400 ml-auto">{formatTime(poop.startTime)}</span>
        <button
          onClick={() => setEditOpen(true)}
          disabled={busy}
          aria-label="Edit poop time"
          className="btn-icon"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={remove}
          disabled={busy}
          aria-label="Delete poop entry"
          className="text-xs font-bold text-gray-300 hover:text-blush-500 transition-colors disabled:opacity-50"
        >
          ✕
        </button>
      </div>

      <PoopTimeModal
        isOpen={editOpen}
        title="Edit time"
        initialTime={toJsDate(poop.startTime)}
        saving={busy}
        onClose={() => setEditOpen(false)}
        onSave={saveTime}
      />
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/feeding/PoopRow.tsx
git commit -m "feat: edit poop time from History"
```

---

### Task 4: Filter poops in History (`history.ts` + `History.tsx`)

**Files:**
- Modify: `src/utils/history.ts`
- Modify: `src/pages/History.tsx`

**Interfaces:**
- Produces: `EventToggle = 'both' | 'feedings' | 'sleeps' | 'poops'` from `src/utils/history.ts`.
- Consumes: `buildHistoryDays(feedings, sleeps, poops, filters)` (signature unchanged).

- [ ] **Step 1: Extend `EventToggle` and the inclusion guards**

In `src/utils/history.ts`, change the type (line 5) from:

```ts
export type EventToggle = 'both' | 'feedings' | 'sleeps'
```

to:

```ts
export type EventToggle = 'both' | 'feedings' | 'sleeps' | 'poops'
```

Then update the three inclusion guards in `buildHistoryDays`.

Change the feedings guard (line 61) from `if (filters.toggle !== 'sleeps') {` to:

```ts
  if (filters.toggle === 'both' || filters.toggle === 'feedings') {
```

Change the sleeps guard (line 69) from `if (filters.toggle !== 'feedings') {` to:

```ts
  if (filters.toggle === 'both' || filters.toggle === 'sleeps') {
```

Change the poops guard (line 76) from `if (filters.toggle !== 'sleeps') {` to:

```ts
  if (filters.toggle === 'both' || filters.toggle === 'poops') {
```

- [ ] **Step 2: Add the "Poops" toggle option in `History.tsx`**

In `src/pages/History.tsx`, change the `TOGGLES` array (lines 22-26) from:

```tsx
const TOGGLES: { id: EventToggle; label: string }[] = [
  { id: 'both', label: 'All' },
  { id: 'feedings', label: 'Feedings' },
  { id: 'sleeps', label: 'Sleeps' },
]
```

to:

```tsx
const TOGGLES: { id: EventToggle; label: string }[] = [
  { id: 'both', label: 'All' },
  { id: 'feedings', label: 'Feedings' },
  { id: 'poops', label: 'Poops' },
  { id: 'sleeps', label: 'Sleeps' },
]
```

- [ ] **Step 3: Hide the feeding-type chips in the Poops view**

In `src/pages/History.tsx`, change the type-filter wrapper condition (line 94) from:

```tsx
        {toggle !== 'sleeps' && (
```

to:

```tsx
        {(toggle === 'both' || toggle === 'feedings') && (
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/history.ts src/pages/History.tsx
git commit -m "feat: add Poops filter to History; Feedings view excludes poops"
```

---

### Task 5: Remove the "+ Poopy time 💩" shortcut from Log Feeding

**Files:**
- Modify: `src/pages/LogFeeding.tsx`

**Interfaces:** No exported API change.

- [ ] **Step 1: Remove the shortcut button block**

In `src/pages/LogFeeding.tsx`, replace the notes-label header block (lines 244-259):

```tsx
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="notes" className="label mb-0">Notes (optional)</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange((field.value ? field.value + '\n' : '') + 'Poopy time 💩')}
                className="text-xs font-bold text-peach-500 hover:text-peach-600 transition-colors"
              >
                + Poopy time 💩
              </button>
            )}
          />
        </div>
```

with a plain label:

```tsx
        <label htmlFor="notes" className="label">Notes (optional)</label>
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Verify no now-unused imports remain (`Controller` is still used elsewhere in the file, so it stays).

- [ ] **Step 3: Commit**

```bash
git add src/pages/LogFeeding.tsx
git commit -m "chore: remove Poopy time shortcut from Log Feeding notes"
```

---

## Manual Verification (after all tasks)

Run the app (`npm run dev`) and confirm:

1. Dashboard 💩 opens the picker defaulted to now; Save logs a poop at the chosen time; Cancel / Escape / backdrop dismiss without logging.
2. The new poop appears on the daily Timeline and in History at the chosen time.
3. In History, the poop row's edit (pencil) button changes the time and the row re-sorts live; delete still works.
4. History "Show" toggle: **All** lists everything, **Feedings** lists feeds only (no poops), **Poops** lists poops only, **Sleeps** lists sleeps only. The feeding-type chips are hidden in the Poops and Sleeps views.
5. Feed count / total amount / "last fed" are unaffected by poops.
6. Log Feeding no longer shows the "+ Poopy time 💩" button; a newly logged poop stores no `notes`.
