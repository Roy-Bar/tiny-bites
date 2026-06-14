import { useState, useRef } from 'react'
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
import { useSleeps } from '../../hooks/useSleeps'
import Card from '../ui/Card'

const LAVENDER = '#a78bfa'

const VIEWS = [
  { label: '7-Day Sleep', barSize: 28, interval: 0 },
  { label: '30-Day Sleep', barSize: 7, interval: 4 },
]

export default function SleepChart() {
  const { weeklyByDay, monthlyByDay } = useSleeps()
  const [viewIndex, setViewIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const touchStartX = useRef(null)

  const allData = [weeklyByDay, monthlyByDay]

  function navigate(newIndex) {
    if (newIndex === viewIndex) return
    setFading(true)
    setTimeout(() => {
      setViewIndex(newIndex)
      setFading(false)
    }, 150)
  }

  function goNext() {
    navigate((viewIndex + 1) % VIEWS.length)
  }

  function goPrev() {
    navigate((viewIndex + VIEWS.length - 1) % VIEWS.length)
  }

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) goNext()
    else if (dx > 50) goPrev()
    touchStartX.current = null
  }

  const currentView = VIEWS[viewIndex]
  const currentData = allData[viewIndex]

  const average = (() => {
    const nonZero = currentData.filter((d) => d.hours > 0)
    if (!nonZero.length) return null
    return nonZero.reduce((acc, d) => acc + d.hours, 0) / nonZero.length
  })()

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const { hours, count } = payload[0].payload
    return (
      <div className="bg-white border border-cream-200 rounded-xl px-3 py-2 shadow-md text-xs font-semibold">
        <p className="text-gray-500 mb-1">{label}</p>
        {hours > 0
          ? <p style={{ color: LAVENDER }}>{hours}h sleep</p>
          : <p className="text-gray-400">No data</p>
        }
        <p className="text-gray-400 mt-1">{count} sleep{count !== 1 ? 's' : ''}</p>
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
                className={`rounded-full transition-all ${i === viewIndex ? 'w-3 h-1.5 bg-lavender-400' : 'w-1.5 h-1.5 bg-gray-200 hover:bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            className="text-xs font-semibold text-lavender-500 hover:text-lavender-600 transition-colors whitespace-nowrap"
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
            <Bar dataKey="hours" name="Hours" fill={LAVENDER} radius={[8, 8, 0, 0]} />
            {average !== null && hovered && (
              <ReferenceLine
                y={average}
                stroke="#7aaa7a"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `avg  ${Math.round(average * 10) / 10}h`,
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
