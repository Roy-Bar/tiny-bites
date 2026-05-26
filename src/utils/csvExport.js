import { format } from 'date-fns'
import { FEEDING_TYPE_MAP } from './constants'

export function exportToCSV(feedings, babyName) {
  const BOM = '\uFEFF'
  const header = ['Date', 'Time', 'Type', 'Amount', 'Unit', 'Duration (min)', 'Notes']

  const rows = feedings.map((f) => {
    const date = f.startTime?.toDate ? f.startTime.toDate() : new Date(f.startTime)
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
