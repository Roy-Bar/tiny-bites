import { useEffect, useMemo, useState } from 'react'
import { subscribeToSleeps } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useBaby } from '../context/BabyContext'
import { startOfDay, isToday, subDays, format } from 'date-fns'

// Duration of a sleep in seconds. Ongoing sleeps (no endTime) count up to now.
function sleepSeconds(sleep) {
  if (!sleep?.startTime) return 0
  const start = sleep.startTime.toDate ? sleep.startTime.toDate() : new Date(sleep.startTime)
  const end = sleep.endTime
    ? (sleep.endTime.toDate ? sleep.endTime.toDate() : new Date(sleep.endTime))
    : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

export function useSleeps() {
  const user = useAuth()
  const { baby } = useBaby()
  const [sleeps, setSleeps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !baby?.id) {
      setSleeps([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeToSleeps(
      user.uid,
      baby.id,
      (data) => {
        setSleeps(data)
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )

    return unsub
  }, [user, baby?.id])

  // The single in-progress sleep, if any.
  const activeSleep = useMemo(
    () => sleeps.find((s) => !s.endTime) ?? null,
    [sleeps]
  )

  // Most recent completed sleep (baby is awake again).
  const lastSleep = useMemo(
    () => sleeps.find((s) => s.endTime) ?? null,
    [sleeps]
  )

  // Sleeps attributed to today by the day they started.
  const todaySleeps = useMemo(
    () => sleeps.filter((s) => s.startTime && isToday(s.startTime.toDate())),
    [sleeps]
  )

  const totalSleepToday = useMemo(
    () => todaySleeps.reduce((acc, s) => acc + sleepSeconds(s), 0),
    [todaySleeps]
  )

  const napsToday = todaySleeps.length

  // Hours slept per day. A sleep is attributed entirely to the day it started
  // (a night sleep crossing midnight counts toward the evening it began) —
  // a deliberate v1 simplification that keeps the trend math simple.
  function hoursByDays(numDays, labelFormat) {
    const days = []
    for (let i = numDays - 1; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const daySleeps = sleeps.filter((s) => {
        if (!s.startTime) return false
        const t = s.startTime.toDate()
        return t >= dayStart && t < dayEnd
      })
      const seconds = daySleeps.reduce((acc, s) => acc + sleepSeconds(s), 0)
      days.push({
        label: format(day, labelFormat),
        hours: Math.round((seconds / 3600) * 10) / 10,
        count: daySleeps.length,
        date: day,
      })
    }
    return days
  }

  const weeklyByDay = useMemo(() => hoursByDays(7, 'EEE'), [sleeps])
  const monthlyByDay = useMemo(() => hoursByDays(30, 'MMM d'), [sleeps])

  return {
    sleeps,
    activeSleep,
    lastSleep,
    todaySleeps,
    totalSleepToday,
    napsToday,
    weeklyByDay,
    monthlyByDay,
    loading,
    error,
  }
}
