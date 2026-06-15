import { useEffect, useState } from 'react'
import { toJsDate } from '../utils/formatters'
import type { TimestampLike } from '../types'

// Live "H:MM:SS" (or "MM:SS") string since the given timestamp, ticking each second.
export function useElapsed(timestamp: TimestampLike | null | undefined): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!timestamp) {
      setLabel('')
      return
    }

    function update() {
      const date = toJsDate(timestamp!)
      const total = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      const pad = (n: number) => String(n).padStart(2, '0')
      setLabel(h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timestamp])

  return label
}

// Live "H:MM" string since the given timestamp (hours:minutes, no seconds),
// ticking each second so it stays in sync. Used for at-a-glance status durations.
export function useElapsedHM(timestamp: TimestampLike | null | undefined): string {
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!timestamp) {
      setLabel('')
      return
    }

    function update() {
      const date = toJsDate(timestamp!)
      const total = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      setLabel(`${h}:${String(m).padStart(2, '0')}`)
    }

    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [timestamp])

  return label
}
