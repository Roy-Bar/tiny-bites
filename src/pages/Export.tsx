import { useMemo, useState } from 'react'
import { useFeedings } from '../hooks/useFeedings'
import { useBaby } from '../context/BabyContext'
import { useToast } from '../components/ui/Toast'
import { exportToCSV } from '../utils/csvExport'
import { formatAmount, formatDuration } from '../utils/formatters'
import { FEEDING_TYPE_MAP } from '../utils/constants'
import Spinner from '../components/ui/Spinner'
import { isAfter, isBefore, startOfDay, endOfDay, subDays } from 'date-fns'
import type { FeedingTypeDef } from '../types'

export default function Export() {
  const { feedings, loading } = useFeedings()
  const { baby } = useBaby()
  const toast = useToast()!

  const [dateFrom, setDateFrom] = useState(subDays(new Date(), 6).toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))

  const filtered = useMemo(() => {
    const from = startOfDay(new Date(dateFrom))
    const to = endOfDay(new Date(dateTo))
    return feedings.filter((f) => {
      if (!f.startTime) return false
      const d = f.startTime.toDate()
      return !isBefore(d, from) && !isAfter(d, to)
    })
  }, [feedings, dateFrom, dateTo])

  const byType = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const f of filtered) {
      counts[f.type] = (counts[f.type] ?? 0) + 1
    }
    return counts
  }, [filtered])

  const avgAmount = useMemo(() => {
    const withAmt = filtered.filter((f) => (f.amount ?? 0) > 0)
    if (!withAmt.length) return null
    const sum = withAmt.reduce((a, f) => a + (f.amount ?? 0), 0)
    return Math.round((sum / withAmt.length) * 10) / 10
  }, [filtered])

  const totalDuration = useMemo(() => {
    return filtered.reduce((a, f) => a + (f.durationSeconds ?? 0), 0)
  }, [filtered])

  function handleCSV() {
    if (!filtered.length) { toast('No feedings in this date range', 'error'); return }
    exportToCSV(filtered, baby?.name)
    toast('CSV downloaded!')
  }

  function handleCopyJSON() {
    if (!filtered.length) { toast('No feedings in this date range', 'error'); return }
    const data = filtered.map((f) => ({
      ...f,
      startTime: f.startTime?.toDate?.().toISOString(),
      createdAt: f.createdAt?.toDate?.().toISOString(),
      updatedAt: f.updatedAt?.toDate?.().toISOString(),
    }))
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    toast('JSON copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Date range */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Date Range</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dateFrom" className="label">From</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="label">To</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              min={dateFrom}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 font-semibold">Total Feedings</p>
            <p className="text-2xl font-extrabold text-gray-800">{filtered.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Avg Amount</p>
            <p className="text-2xl font-extrabold text-gray-800">
              {avgAmount != null
                ? formatAmount(avgAmount, baby?.unitPreference ?? 'oz')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Total Duration</p>
            <p className="text-2xl font-extrabold text-gray-800">
              {totalDuration > 0 ? formatDuration(totalDuration) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Feedings / Day</p>
            <p className="text-2xl font-extrabold text-gray-800">
              {filtered.length > 0
                ? (filtered.length / Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / 86400000) + 1)).toFixed(1)
                : '—'}
            </p>
          </div>
        </div>

        {/* By type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-2">By Type</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byType).map(([type, count]) => {
                const info: Partial<FeedingTypeDef> = FEEDING_TYPE_MAP[type] ?? {}
                return (
                  <span key={type} className={info.badgeClass ?? 'badge-breast'}>
                    {info.icon} {info.shortLabel}: {count}
                  </span>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Export buttons */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide mb-4">Export</h2>
        <button onClick={handleCSV} className="btn-primary w-full">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download CSV
        </button>
        <button onClick={handleCopyJSON} className="btn-ghost w-full">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy as JSON
        </button>
        <p className="text-xs text-gray-400 text-center">
          {filtered.length} feeding{filtered.length !== 1 ? 's' : ''} in selected range
        </p>
      </div>
    </div>
  )
}
