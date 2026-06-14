import { useEffect, useMemo, useState } from 'react'
import { subscribeToFeedings } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useBaby } from '../context/BabyContext'
import { startOfDay, isToday, subDays, format, startOfMonth, endOfMonth } from 'date-fns'

export function useFeedings() {
  const user = useAuth()
  const { baby } = useBaby()
  const [feedings, setFeedings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !baby?.id) {
      setFeedings([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = subscribeToFeedings(
      user.uid,
      baby.id,
      (data) => {
        setFeedings(data)
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

  const todayFeedings = useMemo(
    () => feedings.filter((f) => f.startTime && isToday(f.startTime.toDate())),
    [feedings]
  )

  const lastFeeding = feedings[0] ?? null

  const avgAmountToday = useMemo(() => {
    const withAmount = todayFeedings.filter((f) => f.amount > 0)
    if (!withAmount.length) return null
    const sum = withAmount.reduce((acc, f) => acc + f.amount, 0)
    return Math.round((sum / withAmount.length) * 10) / 10
  }, [todayFeedings])

  const totalAmountToday = useMemo(() => {
    const sum = todayFeedings.reduce((acc, f) => {
      if (f.items?.length > 0) return acc + f.items.reduce((s, item) => s + (item.amount || 0), 0)
      return acc + (f.amount || 0)
    }, 0)
    return Math.round(sum * 10) / 10
  }, [todayFeedings])

  const amountByTypeToday = useMemo(() => {
    const byType = {}
    todayFeedings.forEach((f) => {
      const items = f.items?.length > 0 ? f.items : [{ type: f.type, amount: f.amount || 0 }]
      items.forEach((item) => {
        if (item.amount > 0) byType[item.type] = Math.round(((byType[item.type] ?? 0) + item.amount) * 10) / 10
      })
    })
    return byType
  }, [todayFeedings])

  function computeByType(feedingsList) {
    const byType = {}
    feedingsList.forEach((f) => {
      const items = f.items?.length > 0 ? f.items : [{ type: f.type, amount: f.amount || 0 }]
      items.forEach((item) => {
        if (item.amount > 0) byType[item.type] = Math.round(((byType[item.type] ?? 0) + item.amount) * 10) / 10
      })
    })
    return byType
  }

  const weeklyByDay = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const label = format(day, 'EEE')
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const dayFeedings = feedings.filter((f) => {
        if (!f.startTime) return false
        const t = f.startTime.toDate()
        return t >= dayStart && t < dayEnd
      })
      const count = dayFeedings.length
      const totalAmount = dayFeedings.reduce((acc, f) => {
        if (f.items?.length > 0) {
          return acc + f.items.reduce((sum, item) => sum + (item.amount || 0), 0)
        }
        return acc + (f.amount || 0)
      }, 0)
      days.push({ label, count, totalAmount, byType: computeByType(dayFeedings), date: day })
    }
    return days
  }, [feedings])

  const monthlyByDay = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const day = subDays(new Date(), i)
      const label = format(day, 'MMM d')
      const dayStart = startOfDay(day)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const dayFeedings = feedings.filter((f) => {
        if (!f.startTime) return false
        const t = f.startTime.toDate()
        return t >= dayStart && t < dayEnd
      })
      const count = dayFeedings.length
      const totalAmount = dayFeedings.reduce((acc, f) => {
        if (f.items?.length > 0) return acc + f.items.reduce((sum, item) => sum + (item.amount || 0), 0)
        return acc + (f.amount || 0)
      }, 0)
      days.push({ label, count, totalAmount, byType: computeByType(dayFeedings), date: day })
    }
    return days
  }, [feedings])

  const yearlyByMonth = useMemo(() => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const monthStart = startOfMonth(d)
      const monthEnd = endOfMonth(d)
      const label = format(d, 'MMM')
      const monthFeedings = feedings.filter((f) => {
        if (!f.startTime) return false
        const t = f.startTime.toDate()
        return t >= monthStart && t <= monthEnd
      })
      const count = monthFeedings.length
      const total = monthFeedings.reduce((acc, f) => {
        if (f.items?.length > 0) return acc + f.items.reduce((sum, item) => sum + (item.amount || 0), 0)
        return acc + (f.amount || 0)
      }, 0)
      const activeDays = new Set(monthFeedings.map((f) => format(f.startTime.toDate(), 'yyyy-MM-dd'))).size
      const totalAmount = activeDays > 0 ? Math.round((total / activeDays) * 10) / 10 : 0
      const rawByType = computeByType(monthFeedings)
      const byType = activeDays > 0
        ? Object.fromEntries(Object.entries(rawByType).map(([k, v]) => [k, Math.round((v / activeDays) * 10) / 10]))
        : {}
      months.push({ label, count, totalAmount, byType, date: d })
    }
    return months
  }, [feedings])

  return { feedings, todayFeedings, lastFeeding, avgAmountToday, totalAmountToday, amountByTypeToday, weeklyByDay, monthlyByDay, yearlyByMonth, loading, error }
}
