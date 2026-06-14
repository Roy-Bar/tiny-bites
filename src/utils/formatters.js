import { format, formatDistanceToNow } from 'date-fns'

export function formatAmount(amount, unit) {
  if (amount == null || amount === 0) return '—'
  return `${amount} ${unit ?? 'oz'}`
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  if (s === 0) return `${m} min`
  return `${m}m ${s}s`
}

export function formatDurationHM(seconds) {
  if (!seconds || seconds <= 0) return '—'
  const totalMinutes = Math.round(seconds / 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatTime(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'h:mm a')
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'MMM d, h:mm a')
}

export function formatDate(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'EEEE, MMMM d')
}

export function formatBabyAge(birthDate) {
  if (!birthDate) return ''
  const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate)
  const now = new Date()
  const diffDays = Math.floor((now - birth) / 86400000)
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} old`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} old`
  }
  const months = Math.floor(diffDays / 30)
  return `${months} month${months !== 1 ? 's' : ''} old`
}

export function toLocalDatetimeString(date) {
  const d = date ?? new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
