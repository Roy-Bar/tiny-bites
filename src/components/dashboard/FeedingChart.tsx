import { useState, useRef, type TouchEvent } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { useFeedings } from '../../hooks/useFeedings'
import { useBaby } from '../../context/BabyContext'
import { FEEDING_TYPE_MAP } from '../../utils/constants'
import Card from '../ui/Card'
import type { DayBucket } from '../../types'

interface ChartView {
  label: string
  barSize: number
  interval: number
}

const VIEWS: ChartView[] = [
  { label: '7-Day Total Amount', barSize: 28, interval: 0 },
  { label: '30-Day Total Amount', barSize: 7, interval: 4 },
  { label: '12-Month Daily Average', barSize: 28, interval: 0 },
]

interface CustomTooltipProps {
  active?: boolean
  payload?: { payload: DayBucket }[]
  label?: string
}

export default function FeedingChart() {
  const { weeklyByDay, monthlyByDay, yearlyByMonth } = useFeedings()
  const { baby } = useBaby()
  const unit = baby?.unitPreference ?? 'oz'
  const [viewIndex, setViewIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const allData: DayBucket[][] = [weeklyByDay, monthlyByDay, yearlyByMonth]

  function navigate(newIndex: number) {
    if (newIndex === viewIndex) return
    setFading(true)
    setTimeout(() => {
      setViewIndex(newIndex)
      setFading(false)
    }, 150)
  }

  function goNext() {
    navigate((viewIndex + 1) % 3)
  }

  function goPrev() {
    navigate((viewIndex + 2) % 3)
  }

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    touchStartX.current = null
  }

  const currentView = VIEWS[viewIndex]
  const currentData = allData[viewIndex]

  const average = (() => {
    const nonZero = currentData.filter((d) => d.totalAmount > 0)
    if (!nonZero.length) return null
    return nonZero.reduce((acc, d) => acc + d.totalAmount, 0) / nonZero.length
  })()

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null
    const { count, totalAmount, byType = {} } = payload[0].payload
    const suffix = viewIndex === 2 ? '/day' : ''
    const typeEntries = Object.entries(byType)
    return (
      <div className="bg-white border border-cream-200 rounded-xl px-3 py-2 shadow-md text-xs font-semibold">
        <p className="text-gray-500 mb-1">{label}</p>
        {totalAmount > 0
          ? <p style={{ color: '#ffb093' }}>{Math.round(totalAmount * 10) / 10} {unit}{suffix}</p>
          : <p className="text-gray-400">No data</p>
        }
        {typeEntries.length > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex flex-col gap-0.5">
            {typeEntries.map(([type, amount]) => {
              const info = FEEDING_TYPE_MAP[type] ?? {}
              return (
                <div key={type} className="flex items-center justify-between gap-4">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    {info.icon} {info.shortLabel ?? type}
                  </span>
                  <span style={{ color: info.color ?? '#ffb093' }}>
                    {Math.round(amount * 10) / 10} {unit}{suffix}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <p className="text-gray-400 mt-1">{count} feeding{count !== 1 ? 's' : ''}</p>
      </div>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {currentView.label}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 items-center">
            {VIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(i)}
                className={`rounded-full transition-all ${i === viewIndex ? 'w-3 h-1.5 bg-[#ffb093]' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            className="text-xs font-semibold text-[#ffb093] hover:text-[#ff9070] transition-colors whitespace-nowrap"
          >
            See more →
          </button>
        </div>
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.15s ease' }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={currentData} barSize={currentView.barSize} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3ede0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fontFamily: 'Nunito', fill: '#9ca3af', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={currentView.interval}
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: 'Nunito', fill: '#9ca3af', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalAmount" name="Total Amount" fill="#ffb093" radius={[8, 8, 0, 0]} />
            {average !== null && hovered && (
              <ReferenceLine
                y={average}
                stroke="#7aaa7a"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `avg  ${Math.round(average * 10) / 10} ${unit}`,
                  position: 'insideTopRight',
                  fontSize: 11,
                  fontFamily: 'Nunito',
                  fontWeight: 800,
                  fill: '#7aaa7a',
                  dy: 12,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
