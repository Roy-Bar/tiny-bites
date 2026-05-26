import { useRef, useState } from 'react'
import { useFeedings } from '../../hooks/useFeedings'
import { FEEDING_TYPE_MAP } from '../../utils/constants'
import { formatTime, formatAmount, formatDuration } from '../../utils/formatters'

function minutesFromMidnight(timestamp) {
  if (!timestamp) return 0
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return d.getHours() * 60 + d.getMinutes()
}

export default function DailyTimeline() {
  const { todayFeedings } = useFeedings()
  const [tooltip, setTooltip] = useState(null)
  const barRef = useRef(null)

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  if (todayFeedings.length === 0) {
    return (
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today's Timeline</p>
        <div className="h-10 bg-cream-100 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-300 font-medium">No feedings logged today</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-300">12am</span>
          <span className="text-[10px] text-gray-300">12pm</span>
          <span className="text-[10px] text-gray-300">11:59pm</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Today's Timeline</p>
      <div
        ref={barRef}
        className="relative h-10 bg-cream-100 rounded-full cursor-pointer overflow-visible"
        role="img"
        aria-label="Timeline of today's feedings"
      >
        {/* Current time marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-lavender-300 z-10"
          style={{ left: `${(nowMinutes / 1440) * 100}%` }}
          aria-hidden="true"
        />

        {todayFeedings.map((f) => {
          const pct = (minutesFromMidnight(f.startTime) / 1440) * 100
          const items = f.items?.filter((i) => i.type) ?? [{ type: f.type }]
          const isMixed = items.length > 1
          let dotStyle
          if (isMixed) {
            const colors = items.map((i) => (FEEDING_TYPE_MAP[i.type] ?? {}).color ?? '#f96b3a')
            const step = 100 / colors.length
            const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')
            dotStyle = { background: `conic-gradient(${stops})` }
          } else {
            const typeInfo = FEEDING_TYPE_MAP[items[0]?.type ?? f.type] ?? {}
            dotStyle = { backgroundColor: typeInfo.color ?? '#f96b3a' }
          }
          const label = isMixed
            ? `Mixed feeding at ${formatTime(f.startTime)}`
            : `${(FEEDING_TYPE_MAP[f.type] ?? {}).label} at ${formatTime(f.startTime)}`
          return (
            <button
              key={f.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400"
              style={{ left: `${pct}%`, ...dotStyle }}
              aria-label={label}
              onMouseEnter={() => setTooltip(f)}
              onFocus={() => setTooltip(f)}
              onMouseLeave={() => setTooltip(null)}
              onBlur={() => setTooltip(null)}
            />
          )
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const pct = (minutesFromMidnight(tooltip.startTime) / 1440) * 100
          const alignRight = pct > 70
          const tooltipItems = tooltip.items?.filter((i) => i.type) ?? [{ type: tooltip.type, amount: tooltip.amount, unit: tooltip.unit }]
          const isMixed = tooltipItems.length > 1
          return (
            <div
              className="absolute bottom-full mb-2 z-20 pointer-events-none"
              style={alignRight ? { right: `${100 - pct}%` } : { left: `${pct}%` }}
            >
              <div className="bg-gray-800 text-white text-xs rounded-xl px-3 py-2 whitespace-nowrap shadow-lg">
                <span className="font-bold">
                  {isMixed
                    ? tooltipItems.map((i) => (FEEDING_TYPE_MAP[i.type] ?? {}).shortLabel ?? i.type).join(' + ')
                    : (FEEDING_TYPE_MAP[tooltip.type] ?? {}).label}
                </span>
                <span className="mx-1 opacity-50">·</span>
                {formatTime(tooltip.startTime)}
                {tooltip.amount > 0 && <span className="ml-1 opacity-75">{formatAmount(tooltip.amount, tooltip.unit)}</span>}
                {tooltip.durationSeconds > 0 && <span className="ml-1 opacity-75">{formatDuration(tooltip.durationSeconds)}</span>}
              </div>
            </div>
          )
        })()}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-300">12am</span>
        <span className="text-[10px] text-gray-300">12pm</span>
        <span className="text-[10px] text-gray-300">11:59pm</span>
      </div>
    </div>
  )
}
