import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useFeedings } from '../../hooks/useFeedings'
import { useSleeps } from '../../hooks/useSleeps'
import { FEEDING_TYPE_MAP } from '../../utils/constants'
import { formatTime, formatAmount, formatDuration, formatDurationHM, toJsDate } from '../../utils/formatters'
import { startOfDay } from 'date-fns'
import type { Feeding, FeedingTypeDef, Sleep, TimestampLike } from '../../types'

const DAY_MINUTES = 1440

function minutesFromMidnight(timestamp: TimestampLike | null | undefined): number {
  if (!timestamp) return 0
  const d = toJsDate(timestamp)
  return d.getHours() * 60 + d.getMinutes()
}

interface SleepBand {
  id: string
  leftPct: number
  widthPct: number
  startLabel: string
  endLabel: string
  durationSeconds: number
}

// Sleep periods that overlap today, clamped to the [00:00, 24:00) window and
// expressed as percentages of the 24h bar. An ongoing sleep extends to now.
function todaySleepBands(sleeps: Sleep[]): SleepBand[] {
  const dayStart = startOfDay(new Date())
  const dayStartMs = dayStart.getTime()
  const dayEndMs = dayStartMs + DAY_MINUTES * 60000
  const now = Date.now()
  const bands: SleepBand[] = []

  for (const s of sleeps) {
    if (!s.startTime) continue
    const startMs = toJsDate(s.startTime).getTime()
    const endMs = s.endTime ? toJsDate(s.endTime).getTime() : now
    const bandStart = Math.max(startMs, dayStartMs)
    const bandEnd = Math.min(endMs, dayEndMs)
    if (bandEnd <= bandStart) continue
    bands.push({
      id: s.id,
      leftPct: ((bandStart - dayStartMs) / (dayEndMs - dayStartMs)) * 100,
      widthPct: ((bandEnd - bandStart) / (dayEndMs - dayStartMs)) * 100,
      startLabel: formatTime(s.startTime),
      endLabel: s.endTime ? formatTime(s.endTime) : 'now',
      durationSeconds: Math.floor((endMs - startMs) / 1000),
    })
  }
  return bands
}

export default function DailyTimeline() {
  const { todayFeedings } = useFeedings()
  const { sleeps } = useSleeps()
  const [tooltip, setTooltip] = useState<Feeding | null>(null)
  const [sleepTip, setSleepTip] = useState<SleepBand | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()
  const bands = todaySleepBands(sleeps)
  const isEmpty = todayFeedings.length === 0 && bands.length === 0

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's Timeline</p>
        <Link to="/history" className="text-xs font-bold text-peach-500 hover:underline">
          View all →
        </Link>
      </div>

      {isEmpty ? (
        <div className="h-10 bg-cream-100 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-300 font-medium">Nothing logged today yet</span>
        </div>
      ) : (
        <div
          ref={barRef}
          className="relative h-10 bg-cream-100 rounded-full cursor-pointer overflow-visible"
          role="img"
          aria-label="Timeline of today's feedings and sleeps"
        >
          {/* Sleep bands (behind dots and the time marker) */}
          {bands.map((b) => (
            <button
              key={`sleep-${b.id}`}
              className="absolute top-0 h-full bg-lavender-200 hover:bg-lavender-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400"
              style={{
                left: `${b.leftPct}%`,
                width: `${b.widthPct}%`,
                borderRadius: b.leftPct <= 0.5 || b.widthPct + b.leftPct >= 99.5 ? '9999px' : '6px',
              }}
              aria-label={`Sleeping ${b.startLabel} to ${b.endLabel}, ${formatDurationHM(b.durationSeconds)}`}
              onMouseEnter={() => setSleepTip(b)}
              onFocus={() => setSleepTip(b)}
              onMouseLeave={() => setSleepTip(null)}
              onBlur={() => setSleepTip(null)}
            />
          ))}

          {/* Current time marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-lavender-400 z-10"
            style={{ left: `${(nowMinutes / DAY_MINUTES) * 100}%` }}
            aria-hidden="true"
          />

          {todayFeedings.map((f) => {
            const pct = (minutesFromMidnight(f.startTime) / DAY_MINUTES) * 100
            const items = f.items?.filter((i) => i.type) ?? [{ type: f.type }]
            const isMixed = items.length > 1
            const label = isMixed
              ? `Mixed feeding at ${formatTime(f.startTime)}`
              : `${(FEEDING_TYPE_MAP[f.type] ?? {} as Partial<FeedingTypeDef>).label} at ${formatTime(f.startTime)}`
            return (
              <button
                key={f.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform duration-150 z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400"
                style={{ left: `${pct}%`, backgroundColor: '#ffb093' }}
                aria-label={label}
                onMouseEnter={() => setTooltip(f)}
                onFocus={() => setTooltip(f)}
                onMouseLeave={() => setTooltip(null)}
                onBlur={() => setTooltip(null)}
              />
            )
          })}

          {/* Feeding tooltip */}
          {tooltip && (() => {
            const pct = (minutesFromMidnight(tooltip.startTime) / DAY_MINUTES) * 100
            const alignRight = pct > 70
            const tooltipItems: { type: string; amount?: number; unit?: string | null }[] =
              tooltip.items?.filter((i) => i.type) ?? [{ type: tooltip.type, amount: tooltip.amount ?? undefined, unit: tooltip.unit }]
            const isMixed = tooltipItems.length > 1
            return (
              <div
                className="absolute bottom-full mb-2 z-30 pointer-events-none"
                style={alignRight ? { right: `${100 - pct}%` } : { left: `${pct}%` }}
              >
                <div className="bg-gray-800 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-lg">
                  <span className="font-bold">
                    {isMixed
                      ? tooltipItems.map((i) => (FEEDING_TYPE_MAP[i.type] ?? {} as Partial<FeedingTypeDef>).shortLabel ?? i.type).join(' + ')
                      : (FEEDING_TYPE_MAP[tooltip.type] ?? {} as Partial<FeedingTypeDef>).label}
                  </span>
                  <span className="mx-1 opacity-50">·</span>
                  {formatTime(tooltip.startTime)}
                  {(tooltip.amount ?? 0) > 0 && <span className="ml-1 opacity-75">{formatAmount(tooltip.amount, tooltip.unit)}</span>}
                  {(tooltip.durationSeconds ?? 0) > 0 && <span className="ml-1 opacity-75">{formatDuration(tooltip.durationSeconds)}</span>}
                </div>
              </div>
            )
          })()}

          {/* Sleep tooltip */}
          {sleepTip && (() => {
            const center = sleepTip.leftPct + sleepTip.widthPct / 2
            const alignRight = center > 70
            return (
              <div
                className="absolute bottom-full mb-2 z-30 pointer-events-none"
                style={alignRight ? { right: `${100 - center}%` } : { left: `${center}%` }}
              >
                <div className="bg-gray-800 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-lg">
                  <span className="font-bold">Sleep</span>
                  <span className="mx-1 opacity-50">·</span>
                  {sleepTip.startLabel}–{sleepTip.endLabel}
                  <span className="ml-1 opacity-75">{formatDurationHM(sleepTip.durationSeconds)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300">12am</span>
        <span className="text-[10px] text-gray-300">12pm</span>
        <span className="text-[10px] text-gray-300">11:59pm</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <span className="w-3 h-3 rounded-full bg-peach-300 border-2 border-white shadow-sm" /> Feeding
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
          <span className="w-4 h-3 rounded bg-lavender-200" /> Sleep
        </span>
      </div>
    </div>
  )
}
