import { format } from 'date-fns'
import { FEEDING_TYPE_MAP } from './constants'
import { toJsDate } from './formatters'
import type { Feeding } from '../types'

export function exportToCSV(feedings: Feeding[], babyName?: string | null): void {
  const BOM = '﻿'
  const header = ['Date', 'Time', 'Type', 'Amount', 'Unit', 'Duration (min)', 'Notes']

  const rows = feedings.map((f) => {
    const date = f.startTime ? toJsDate(f.startTime) : new Date()
    const type = FEEDING_TYPE_MAP[f.type]?.label ?? f.type
    const durationMin = f.durationSeconds ? (f.durationSeconds / 60).toFixed(1) : ''
    return [
      format(date, 'yyyy-MM-dd'),
      format(date, 'HH:mm'),
      type,
      f.amount ?? '',
      f.unit ?? '',
      durationMin,
      f.notes ?? '',
    ]
  })

  const csv =
    BOM +
    [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${babyName ?? 'baby'}-feedings-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
