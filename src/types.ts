import type { Timestamp } from 'firebase/firestore'

// ── Time ───────────────────────────────────────────────────────────────────────
// Firestore stores Timestamps, but values coming from forms (datetime-local) or
// already-converted code can be Dates, strings, or epoch millis. Anything the
// formatters/charts accept is a TimestampLike.
export type TimestampLike = Timestamp | Date | string | number

// ── Feeding types (constants.ts) ────────────────────────────────────────────────
export type FeedingTypeId =
  | 'breast_left'
  | 'breast_right'
  | 'breast_both'
  | 'formula'
  | 'pumped_bottle'

export interface FeedingTypeDef {
  id: FeedingTypeId
  label: string
  shortLabel: string
  icon: string
  mirrorIcon?: boolean
  badgeClass: string
  color: string
}

// ── Domain models ───────────────────────────────────────────────────────────────
export interface FeedingItem {
  type: FeedingTypeId | string
  amount: number
}

export interface Feeding {
  id: string
  babyId: string
  type: FeedingTypeId | string
  amount?: number | null
  unit?: string | null
  durationSeconds?: number | null
  items?: FeedingItem[]
  notes?: string | null
  startTime?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Sleep {
  id: string
  babyId: string
  startTime?: Timestamp
  endTime?: Timestamp | null
  notes?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Baby {
  id: string
  name?: string
  birthDate?: Timestamp | string | null
  gender?: string
  unitPreference?: string
  isActive?: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Announcement {
  id: string
  title?: string
  body?: string
  publishedAt?: Timestamp
  active?: boolean
}

// Aggregations produced by the data hooks for charts.
export interface DayBucket {
  label: string
  count: number
  totalAmount: number
  byType: Record<string, number>
  date: Date
}

export interface SleepDayBucket {
  label: string
  hours: number
  count: number
  date: Date
}
