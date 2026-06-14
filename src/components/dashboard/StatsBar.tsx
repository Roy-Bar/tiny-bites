import { useState, useRef, type ReactNode } from 'react'
import { useFeedings } from '../../hooks/useFeedings'
import { useTimeSince } from '../../hooks/useTimeSince'
import { formatAmount, formatBabyAge, formatTime } from '../../utils/formatters'
import { useBaby } from '../../context/BabyContext'
import { FEEDING_TYPE_MAP } from '../../utils/constants'

const BottleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="10" y="1" width="4" height="5" rx="2" fill="#f96b3a" />
    <rect x="8"  y="5" width="8" height="5" rx="1.5" fill="#f96b3a" />
    <rect x="5"  y="9" width="14" height="3" rx="1.5" fill="#f96b3a" />
    <rect x="6"  y="11" width="12" height="11" rx="4" fill="#f96b3a" />
    <rect x="8"  y="16" width="5" height="1.5" rx="0.75" fill="white" opacity="0.5" />
    <rect x="8"  y="19" width="4" height="1.5" rx="0.75" fill="white" opacity="0.4" />
  </svg>
)

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" stroke="#f96b3a" strokeWidth="2.5" />
    <circle cx="12" cy="12" r="1.2" fill="#f96b3a" />
    <line x1="12" y1="12" x2="12" y2="6.5" stroke="#f96b3a" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="12" x2="16.5" y2="14.5" stroke="#f96b3a" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="2"  y="15" width="5" height="7" rx="1.5" fill="#f96b3a" opacity="0.5" />
    <rect x="9.5" y="10" width="5" height="12" rx="1.5" fill="#f96b3a" opacity="0.75" />
    <rect x="17" y="5"  width="5" height="17" rx="1.5" fill="#f96b3a" />
  </svg>
)

const FootprintIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
    <ellipse cx="12" cy="15.5" rx="5" ry="6.5" fill="#f96b3a" />
    <circle cx="7.5"  cy="8"   r="2"   fill="#f96b3a" />
    <circle cx="11"   cy="6.5" r="2"   fill="#f96b3a" />
    <circle cx="14.5" cy="6.5" r="2"   fill="#f96b3a" />
    <circle cx="18"   cy="8"   r="1.8" fill="#f96b3a" />
  </svg>
)

interface StatCardProps {
  icon: ReactNode
  label: string
  value: ReactNode
  sub?: ReactNode
  className?: string
}

function StatCard({ icon, label, value, sub, className = '' }: StatCardProps) {
  return (
    <div className={`card p-4 flex flex-col gap-1 items-center text-center ${className}`}>
      <span className="leading-none">{icon}</span>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">{label}</p>
      <p className="text-xl font-extrabold text-gray-800 leading-tight">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

interface TotalAmountCardProps {
  total: number
  byType: Record<string, number>
  unit: string
}

function TotalAmountCard({ total, byType, unit }: TotalAmountCardProps) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasBreakdown = Object.keys(byType).length > 0

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }
  function handleClick() {
    setOpen((v) => !v)
  }

  return (
    <div
      className="relative"
      onMouseEnter={hasBreakdown ? handleMouseEnter : undefined}
      onMouseLeave={hasBreakdown ? handleMouseLeave : undefined}
    >
      <button
        onClick={hasBreakdown ? handleClick : undefined}
        className={`card p-4 flex flex-col gap-1 items-center text-center w-full ${hasBreakdown ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      >
        <span className="leading-none"><ChartIcon /></span>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-1">Total Amount</p>
        <p className="text-xl font-extrabold text-gray-800 leading-tight">
          {total > 0 ? formatAmount(total, unit) : '—'}
        </p>
        <p className="text-xs text-gray-400">today</p>
      </button>

      {open && hasBreakdown && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-white rounded-xl shadow-lg border border-gray-100 p-3 min-w-[140px]"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">By type</p>
          <div className="flex flex-col gap-1">
            {Object.entries(byType).map(([type, amount]) => {
              const info = FEEDING_TYPE_MAP[type] ?? {}
              return (
                <div key={type} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    {info.icon} {info.shortLabel ?? type}
                  </span>
                  <span className="text-xs font-bold text-gray-800">{formatAmount(amount, unit)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatsBar() {
  const { todayFeedings, lastFeeding, totalAmountToday, amountByTypeToday } = useFeedings()
  const { baby } = useBaby()
  const lastFedLabel = useTimeSince(lastFeeding?.startTime ?? null)

  const age = baby?.birthDate ? formatBabyAge(baby.birthDate) : '—'
  const unit = baby?.unitPreference ?? 'oz'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        icon={<BottleIcon />}
        label="Fed Today"
        value={todayFeedings.length}
        sub={todayFeedings.length === 1 ? 'feeding' : 'feedings'}
      />
      <StatCard
        icon={<ClockIcon />}
        label="Last Feeding"
        value={lastFeeding ? formatTime(lastFeeding.startTime) : '—'}
        sub={lastFeeding ? lastFedLabel : 'No data yet'}
      />
      <TotalAmountCard total={totalAmountToday} byType={amountByTypeToday} unit={unit} />
      <StatCard
        icon={<FootprintIcon />}
        label="Baby Age"
        value={age}
      />
    </div>
  )
}
