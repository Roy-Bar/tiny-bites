import { format, startOfDay } from 'date-fns'
import { toJsDate } from './formatters'
import type { Feeding, Sleep } from '../types'

export type EventToggle = 'both' | 'feedings' | 'sleeps'

export type HistoryEvent =
  | { kind: 'feeding'; time: Date; feeding: Feeding }
  | { kind: 'sleep'; time: Date; sleep: Sleep }
  | { kind: 'poop'; time: Date; poop: Feeding }

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

function feedingMatchesType(f: Feeding, typeFilter: string[]): boolean {
  if (typeFilter.length === 0) return true
  if (typeFilter.includes(f.type)) return true
  return !!f.items?.some((item) => typeFilter.includes(item.type))
}

function matchesSearch(notes: string | null | undefined, q: string): boolean {
  if (!q) return true
  return !!notes && notes.toLowerCase().includes(q)
}

export function buildHistoryDays(
  feedings: Feeding[],
  sleeps: Sleep[],
  poops: Feeding[],
  filters: HistoryFilters,
): HistoryDay[] {
  const events: HistoryEvent[] = []
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
  if (filters.toggle !== 'sleeps') {
    for (const p of poops) {
      if (!p.startTime) continue
      if (!matchesSearch(p.notes, q)) continue
      events.push({ kind: 'poop', time: toJsDate(p.startTime), poop: p })
    }
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
    } else if (ev.kind === 'sleep') {
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
