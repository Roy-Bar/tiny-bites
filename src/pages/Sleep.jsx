import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import { useSleeps } from '../hooks/useSleeps'
import { useElapsed } from '../hooks/useElapsed'
import SleepChart from '../components/sleep/SleepChart'
import SleepCard from '../components/sleep/SleepCard'
import EmptyState from '../components/ui/EmptyState'
import Spinner from '../components/ui/Spinner'
import { formatDurationHM } from '../utils/formatters'

function groupByDay(sleeps) {
  const groups = {}
  for (const s of sleeps) {
    if (!s.startTime) continue
    const d = s.startTime.toDate ? s.startTime.toDate() : new Date(s.startTime)
    const key = format(d, 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = { date: startOfDay(d), sleeps: [] }
    groups[key].sleeps.push(s)
  }
  return Object.values(groups).sort((a, b) => b.date - a.date)
}

function dayLabel(date) {
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d')
}

function StatCard({ emoji, label, value, sub }) {
  return (
    <div className="card p-4 flex flex-col gap-1 items-center text-center">
      <span className="text-xl leading-none">{emoji}</span>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">{label}</p>
      <p className="text-xl font-extrabold text-gray-800 leading-tight tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

export default function Sleep() {
  const { sleeps, activeSleep, totalSleepToday, napsToday, loading, error } = useSleeps()
  const elapsed = useElapsed(activeSleep?.startTime ?? null)

  const groups = useMemo(() => groupByDay(sleeps), [sleeps])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {error && (
        <div className="card p-4 bg-blush-50 border-blush-200 text-sm text-blush-600 font-semibold">
          Couldn't load sleep data right now. Please check your connection and refresh.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          emoji="🌙"
          label="Sleep Today"
          value={formatDurationHM(totalSleepToday)}
        />
        <StatCard
          emoji="💤"
          label="Naps Today"
          value={napsToday}
          sub={napsToday === 1 ? 'sleep' : 'sleeps'}
        />
        <StatCard
          emoji={activeSleep ? '😴' : '☀️'}
          label="Status"
          value={activeSleep ? (elapsed || '0:00') : 'Awake'}
          sub={activeSleep ? 'asleep' : undefined}
        />
      </div>

      <SleepChart />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">
            Sleep History
          </h2>
          <Link to="/sleep/log" className="text-xs font-bold text-lavender-500 hover:underline">
            + Log sleep
          </Link>
        </div>

        {sleeps.length === 0 ? (
          <EmptyState
            icon="🌙"
            title="No sleeps logged yet"
            message="Use Start Sleep on the dashboard, or log a past sleep here."
            action={
              <Link to="/sleep/log" className="btn-primary text-sm px-5 py-2.5">
                Log First Sleep
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {groups.map(({ date, sleeps: group }) => {
              const total = group.reduce((acc, s) => {
                if (!s.startTime) return acc
                const start = s.startTime.toDate()
                const end = s.endTime ? s.endTime.toDate() : new Date()
                return acc + Math.max(0, Math.floor((end - start) / 1000))
              }, 0)
              return (
                <div key={date.toISOString()}>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wide">
                      {dayLabel(date)}
                    </h3>
                    <span className="text-xs font-semibold text-gray-300">
                      {group.length} sleep{group.length !== 1 ? 's' : ''}
                    </span>
                    {total > 0 && (
                      <span className="text-xs font-semibold text-gray-300">
                        · {formatDurationHM(total)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {group.map((s) => (
                      <SleepCard key={s.id} sleep={s} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
