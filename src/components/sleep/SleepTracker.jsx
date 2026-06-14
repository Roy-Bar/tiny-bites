import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useSleeps } from '../../hooks/useSleeps'
import { useElapsed } from '../../hooks/useElapsed'
import { useTimeSince } from '../../hooks/useTimeSince'
import { useAuth } from '../../context/AuthContext'
import { useBaby } from '../../context/BabyContext'
import { useToast } from '../ui/Toast'
import { addSleep, updateSleep } from '../../firebase/firestore'
import { formatTime } from '../../utils/formatters'
import Spinner from '../ui/Spinner'

export default function SleepTracker() {
  const { activeSleep, lastSleep, loading, error } = useSleeps()
  const { baby } = useBaby()
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const elapsed = useElapsed(activeSleep?.startTime ?? null)
  const wokeAgo = useTimeSince(lastSleep?.endTime ?? null)

  async function startSleep() {
    if (!baby?.id || busy) return
    setBusy(true)
    try {
      await addSleep(user.uid, {
        babyId: baby.id,
        startTime: Timestamp.fromDate(new Date()),
        endTime: null,
      })
      toast('Sweet dreams 😴')
    } catch {
      toast('Could not start — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function wakeUp() {
    if (!activeSleep || busy) return
    setBusy(true)
    try {
      await updateSleep(user.uid, activeSleep.id, {
        endTime: Timestamp.fromDate(new Date()),
      })
      toast('Good morning! ☀️')
    } catch {
      toast('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-5 bg-gradient-to-br from-lavender-50 to-peach-50 border-lavender-100 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">
          Sleep
        </h2>
        <Link to="/sleep" className="text-xs font-bold text-lavender-500 hover:underline">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <p className="text-xs text-blush-500 font-semibold text-center py-3">
          Couldn't load sleep data — sleep rules may need to be deployed.
        </p>
      ) : activeSleep ? (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-sm font-semibold text-lavender-500">😴 Sleeping</p>
          <p className="text-4xl font-extrabold text-gray-800 tabular-nums tracking-tight">
            {elapsed || '0:00'}
          </p>
          <p className="text-xs text-gray-400">
            Since {formatTime(activeSleep.startTime)}
          </p>
          <button
            onClick={wakeUp}
            disabled={busy}
            className="btn-primary w-full mt-1"
          >
            {busy ? <Spinner size="sm" /> : '☀️ Wake Up'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs text-gray-400">
            {lastSleep
              ? `Awake · woke ${wokeAgo}`
              : 'No sleeps logged yet'}
          </p>
          <button
            onClick={startSleep}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-lavender-400 text-white font-bold rounded-xl hover:bg-lavender-500 active:scale-95 transition-all duration-150 text-sm disabled:opacity-60"
          >
            {busy ? <Spinner size="sm" /> : '🌙 Start Sleep'}
          </button>
        </div>
      )}

      <div className="flex justify-center mt-3">
        <Link
          to="/sleep/log"
          className="text-xs font-bold text-gray-400 hover:text-lavender-500 transition-colors"
        >
          + Log a past sleep
        </Link>
      </div>
    </div>
  )
}
