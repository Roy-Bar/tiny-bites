import { useMemo, useState } from 'react'
import { useFeedings } from '../hooks/useFeedings'
import { useSleeps } from '../hooks/useSleeps'
import FeedingCard from '../components/feeding/FeedingCard'
import PoopRow from '../components/feeding/PoopRow'
import SleepCard from '../components/sleep/SleepCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { FEEDING_TYPES } from '../utils/constants'
import { format, isToday, isYesterday } from 'date-fns'
import { Link } from 'react-router-dom'
import { useBaby } from '../context/BabyContext'
import { formatAmount, formatDurationHM } from '../utils/formatters'
import { buildHistoryDays, type EventToggle } from '../utils/history'

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

const TOGGLES: { id: EventToggle; label: string }[] = [
  { id: 'both', label: 'All' },
  { id: 'feedings', label: 'Feedings' },
  { id: 'sleeps', label: 'Sleeps' },
]

export default function History() {
  const { feedings, poops, loading: feedingsLoading } = useFeedings()
  const { sleeps, loading: sleepsLoading } = useSleeps()
  const { baby } = useBaby()
  const unit = baby?.unitPreference ?? 'oz'
  const [toggle, setToggle] = useState<EventToggle>('both')
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const loading = feedingsLoading || sleepsLoading
  const hasAnyData = feedings.length > 0 || sleeps.length > 0 || poops.length > 0

  const days = useMemo(
    () => buildHistoryDays(feedings, sleeps, poops, { toggle, typeFilter, search }),
    [feedings, sleeps, poops, toggle, typeFilter, search]
  )

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
          <p className="label mb-2">Show</p>
          <div className="inline-flex rounded-full bg-cream-100 border border-cream-300 p-0.5">
            {TOGGLES.map((t) => {
              const active = toggle === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setToggle(t.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 ${
                    active ? 'bg-white text-lavender-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  aria-pressed={active}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        {toggle !== 'sleeps' && (
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
        )}
      </div>

      {days.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No activity found"
          message={hasAnyData ? 'Try adjusting the filters.' : "You haven't logged anything yet."}
          action={
            !hasAnyData ? (
              <Link to="/log" className="btn-primary text-sm px-5 py-2.5">
                Log First Feeding
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day.date.toISOString()}>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                  {dayLabel(day.date)}
                </h2>
                {day.feedingCount > 0 && (
                  <span className="text-xs font-semibold text-gray-300">
                    {day.feedingCount} feeding{day.feedingCount !== 1 ? 's' : ''}
                    {day.totalAmount > 0 ? ` · ${formatAmount(day.totalAmount, unit)}` : ''}
                  </span>
                )}
                {day.napCount > 0 && (
                  <span className="text-xs font-semibold text-gray-300">
                    · {formatDurationHM(day.sleepSeconds)} sleep · {day.napCount} nap{day.napCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {day.events.map((ev) =>
                  ev.kind === 'feeding' ? (
                    <FeedingCard key={`f-${ev.feeding.id}`} feeding={ev.feeding} />
                  ) : ev.kind === 'sleep' ? (
                    <SleepCard key={`s-${ev.sleep.id}`} sleep={ev.sleep} />
                  ) : (
                    <PoopRow key={`p-${ev.poop.id}`} poop={ev.poop} />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
