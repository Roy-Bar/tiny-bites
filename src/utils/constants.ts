import type { FeedingTypeDef, FeedingTypeId } from '../types'

export const FEEDING_TYPES: FeedingTypeDef[] = [
  {
    id: 'breast_left',
    label: 'Left Breast',
    shortLabel: 'Left',
    icon: '🌙',
    mirrorIcon: true,
    badgeClass: 'badge-breast',
    color: '#ffb093',
  },
  {
    id: 'breast_right',
    label: 'Right Breast',
    shortLabel: 'Right',
    icon: '🌙',
    badgeClass: 'badge-breast',
    color: '#ff8860',
  },
  {
    id: 'breast_both',
    label: 'Both Breasts',
    shortLabel: 'Both',
    icon: '✨',
    badgeClass: 'badge-breast',
    color: '#f96b3a',
  },
  {
    id: 'formula',
    label: 'Formula',
    shortLabel: 'Formula',
    icon: '🍼',
    badgeClass: 'badge-formula',
    color: '#a78bfa',
  },
  {
    id: 'pumped_bottle',
    label: 'Pumped Bottle',
    shortLabel: 'Pumped',
    icon: '🥛',
    badgeClass: 'badge-bottle',
    color: '#72a376',
  },
]

export const FEEDING_TYPE_MAP: Record<string, FeedingTypeDef> = Object.fromEntries(
  FEEDING_TYPES.map((t) => [t.id, t])
)

export const BREAST_TYPES = new Set<FeedingTypeId>(['breast_left', 'breast_right', 'breast_both'])

export const CHART_COLORS: Record<FeedingTypeId, string> = {
  breast_left: '#ffb093',
  breast_right: '#ff8860',
  breast_both: '#f96b3a',
  formula: '#a78bfa',
  pumped_bottle: '#72a376',
}

// Poops reuse the feedings collection, marked by this sentinel type. They are
// intentionally NOT part of FEEDING_TYPES, so they never appear in feeding-type
// filters, charts, or stats.
export const POOP_TYPE = 'poop'
export const POOP_NOTE = 'Poopy time 💩'

export function isPoop(f: { type?: string | null }): boolean {
  return f.type === POOP_TYPE
}
