export const FEEDING_TYPES = [
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

export const FEEDING_TYPE_MAP = Object.fromEntries(FEEDING_TYPES.map((t) => [t.id, t]))

export const BREAST_TYPES = new Set(['breast_left', 'breast_right', 'breast_both'])

export const CHART_COLORS = {
  breast_left: '#ffb093',
  breast_right: '#ff8860',
  breast_both: '#f96b3a',
  formula: '#a78bfa',
  pumped_bottle: '#72a376',
}
