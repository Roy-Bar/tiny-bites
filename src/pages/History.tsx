import { useMemo, useState } from 'react'
import { useFeedings } from '../hooks/useFeedings'
import FeedingCard from '../components/feeding/FeedingCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { FEEDING_TYPES } from '../utils/constants'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { Link } from 'react-router-dom'
import { useBaby } from '../context/BabyContext'
import { formatAmount } from '../utils/formatters'
import type { Feeding } from '../types'

interface DayGroup {
  date: Date
  feedings: Feeding[]
}

function groupByDay(feedings: Feeding[]): DayGroup[] {
  const groups: Record<string, DayGroup> = {}
  for (const f of feedings) {
    if (!f.startTime) continue
    const d = f.startTime.toDate ? f.startTime.toDate() : new Date(f.startTime as unknown as string)
    const key = format(d, 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = { date: startOfDay(d), feedings: [] }
    groups[key].feedings.push(f)
  }
  return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime())
}

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

export default function History() {
  const { feedings, loading } = useFeedings()
  const { baby } = useBaby()
  const unit = baby?.unitPreference ?? 'oz'
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = feedings
    if (typeFilter.length > 0) {
      result = result.filter((f) => typeFilter.includes(f.type))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((f) => f.notes?.toLowerCase().includes(q))
    }
    return result
  }, [feedings, typeFilter, search])

  const groups = useMemo(() => groupByDay(filtered), [filtered])

  function toggleType(id: string) {
    setTypeFilter((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div>
          <label htmlFor="search" className="label">Search notes</label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
            placeholder="Search by notes..."
          />
        </div>
        <div>
          <p className="label mb-2">Filter by type</p>
          <div className="flex flex-wrap gap-2">
            {FEEDING_TYPES.map((t) => {
              const active = typeFilter.includes(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => toggleType(t.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 border ${
                    active
                      ? 'bg-lavender-100 border-lavender-400 text-lavender-700'
                      : 'bg-cream-100 border-cream-300 text-gray-500 hover:border-lavender-200'
                  }`}
                  aria-pressed={active}
                >
                  <span style={t.mirrorIcon ? { display: 'inline-block', transform: 'scaleX(-1)' } : undefined}>{t.icon}</span> {t.shortLabel}
                </button>
              )
            })}
            {typeFilter.length > 0 && (
              <button
                onClick={() => setTypeFilter([])}
                className="text-xs font-bold text-gray-400 px-2 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No feedings found"
          message={feedings.length === 0 ? "You haven't logged any feedings yet." : 'Try adjusting the filters.'}
          action={
            feedings.length === 0 ? (
              <Link to="/log" className="btn-primary text-sm px-5 py-2.5">
                Log First Feeding
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map(({ date, feedings: group }) => (
            <div key={date.toISOString()}>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                  {dayLabel(date)}
                </h2>
                <span className="text-xs font-semibold text-gray-300">
                  {group.length} feeding{group.length !== 1 ? 's' : ''}
                </span>
                {(() => {
                  const total = group.reduce((acc, f) => {
                    if (f.items && f.items.length > 0) return acc + f.items.reduce((s, item) => s + (item.amount || 0), 0)
                    return acc + (f.amount || 0)
                  }, 0)
                  return total > 0 ? (
                    <span className="text-xs font-semibold text-gray-300">
                      · {formatAmount(Math.round(total * 10) / 10, unit)}
                    </span>
                  ) : null
                })()}
              </div>
              <div className="space-y-2">
                {group.map((f) => (
                  <FeedingCard key={f.id} feeding={f} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
