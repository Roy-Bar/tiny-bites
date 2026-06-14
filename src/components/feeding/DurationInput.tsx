import { useState, useEffect, useRef } from 'react'

interface DurationInputProps {
  value: number
  onChange: (next: number) => void
}

export default function DurationInput({ value, onChange }: DurationInputProps) {
  const [timing, setTiming] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const minutes = Math.floor(value / 60)
  const seconds = value % 60

  function handleMinutes(v: string) {
    const m = Math.max(0, parseInt(v, 10) || 0)
    onChange(m * 60 + seconds)
  }

  function handleSeconds(v: string) {
    const s = Math.max(0, Math.min(59, parseInt(v, 10) || 0))
    onChange(minutes * 60 + s)
  }

  function startTimer() {
    startRef.current = Date.now() - elapsed * 1000
    setTiming(true)
    intervalRef.current = setInterval(() => {
      const secs = Math.floor((Date.now() - (startRef.current ?? Date.now())) / 1000)
      setElapsed(secs)
      onChange(secs)
    }, 1000)
  }

  function stopTimer() {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    setTiming(false)
  }

  function resetTimer() {
    stopTimer()
    setElapsed(0)
    onChange(0)
  }

  useEffect(() => () => {
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="120"
            value={minutes}
            onChange={(e) => handleMinutes(e.target.value)}
            disabled={timing}
            className="input-field w-16 text-center text-xl font-bold"
            aria-label="Minutes"
          />
          <span className="text-gray-400 font-bold">m</span>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="numeric"
            min="0"
            max="59"
            value={String(seconds).padStart(2, '0')}
            onChange={(e) => handleSeconds(e.target.value)}
            disabled={timing}
            className="input-field w-16 text-center text-xl font-bold"
            aria-label="Seconds"
          />
          <span className="text-gray-400 font-bold">s</span>
        </div>
      </div>

      <div className="flex gap-2">
        {!timing ? (
          <button
            type="button"
            onClick={startTimer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sage-400 text-white rounded-xl text-sm font-bold hover:bg-sage-500 active:scale-95 transition-all duration-150"
          >
            ▶ {elapsed > 0 ? 'Resume' : 'Start Timer'}
          </button>
        ) : (
          <button
            type="button"
            onClick={stopTimer}
            className="inline-flex items-center gap-2 px-4 py-2 bg-peach-500 text-white rounded-xl text-sm font-bold hover:bg-peach-600 active:scale-95 transition-all duration-150"
          >
            ⏸ Stop
          </button>
        )}
        {(elapsed > 0 || value > 0) && (
          <button
            type="button"
            onClick={resetTimer}
            className="px-4 py-2 text-gray-400 text-sm font-bold hover:text-gray-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}
