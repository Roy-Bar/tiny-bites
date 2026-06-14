import { format } from 'date-fns'
import type { TimestampLike } from '../types'

// Coerce any TimestampLike (Firestore Timestamp, Date, string, or epoch millis)
// into a JS Date.
export function toJsDate(value: TimestampLike): Date {
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') return new Date(value)
  return value.toDate()
}

export function formatAmount(amount: number | null | undefined, unit?: string | null): string {
  if (amount == null || amount === 0) return '—'
  return `${amount} ${unit ?? 'oz'}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

export function formatDurationHM(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '—'
  const totalMinutes = Math.round(seconds / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatTime(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return '—'
  return format(toJsDate(timestamp), 'h:mm a')
}

export function formatDateTime(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return '—'
  return format(toJsDate(timestamp), 'MMM d, h:mm a')
}

export function formatDate(timestamp: TimestampLike | null | undefined): string {
  if (!timestamp) return '—'
  return format(toJsDate(timestamp), 'EEEE, MMMM d')
}

export function formatBabyAge(birthDate: TimestampLike | null | undefined): string {
  if (!birthDate) return ''
  const birth = toJsDate(birthDate)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - birth.getTime()) / 86400000)
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} old`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} old`
  }
  const months = Math.floor(diffDays / 30)
  return `${months} month${months !== 1 ? 's' : ''} old`
}

export function toLocalDatetimeString(date?: Date | null): string {
  const d = date ?? new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
