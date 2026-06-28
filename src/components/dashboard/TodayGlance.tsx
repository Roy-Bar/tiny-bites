import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useFeedings } from '../../hooks/useFeedings'
import { useSleeps } from '../../hooks/useSleeps'
import { useElapsedHM } from '../../hooks/useElapsed'
import { useTimeSince } from '../../hooks/useTimeSince'
import { useAuth } from '../../context/AuthContext'
import { useBaby } from '../../context/BabyContext'
import { useToast } from '../ui/Toast'
import { addSleep, updateSleep, addFeeding } from '../../firebase/firestore'
import { formatAmount, formatDurationHM, formatBabyAge, toJsDate } from '../../utils/formatters'
import { POOP_TYPE } from '../../utils/constants'
import Spinner from '../ui/Spinner'
import { MoonIcon, SleepingIcon, SunIcon } from '../sleep/icons'
import { FeedingIcon } from '../feeding/icons'
import PoopTimeModal from '../feeding/PoopTimeModal'

// A warm, at-a-glance summary of the day across feeding + sleep. Detail lives on
// the Feeding (History) and Sleep pages, linked from each panel.
export default function TodayGlance() {
  const { todayFeedings, totalAmountToday, lastFeeding } = useFeedings()
  const { totalSleepToday, napsToday, activeSleep, lastSleep } = useSleeps()
  const { baby } = useBaby()
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [poopOpen, setPoopOpen] = useState(false)

  const unit = baby?.unitPreference ?? 'oz'
  const lastFedAgo = useTimeSince(lastFeeding?.startTime ?? null)
  const asleepFor = useElapsedHM(activeSleep?.startTime ?? null)
  const awakeFor = useElapsedHM(lastSleep?.endTime ?? null)

  const feedingCount = todayFeedings.length

  // Flag a long wake window: awake (not currently sleeping) for over 90 minutes.
  // Recomputed each minute as awakeFor ticks, so the alert appears on its own.
  const awakeMinutes =
    !activeSleep && lastSleep?.endTime
      ? Math.floor((Date.now() - toJsDate(lastSleep.endTime).getTime()) / 60000)
      : 0
  const longAwake = awakeMinutes > 90

  async function startSleep() {
    if (!baby?.id || !user || busy) return
    setBusy(true)
    try {
      await addSleep(user.uid, {
        babyId: baby.id,
        startTime: Timestamp.fromDate(new Date()),
        endTime: null,
      })
      toast?.('Sweet dreams 😴')
    } catch {
      toast?.('Could not start — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function wakeUp() {
    if (!activeSleep || !user || busy) return
    setBusy(true)
    try {
      await updateSleep(user.uid, activeSleep.id, {
        endTime: Timestamp.fromDate(new Date()),
      })
      toast?.('Good morning! ☀️')
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function savePoop(time: Date) {
    if (!baby?.id || !user || busy) return
    setBusy(true)
    try {
      await addFeeding(user.uid, {
        babyId: baby.id,
        type: POOP_TYPE,
        startTime: Timestamp.fromDate(time),
      })
      toast?.('Logged 💩')
      setPoopOpen(false)
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  let sleepStatus: ReactNode
  if (activeSleep) {
    sleepStatus = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lavender-100 text-lavender-600 text-xs font-bold">
        <SleepingIcon size={13} /> Asleep · {asleepFor || '0:00'}
      </span>
    )
  } else if (lastSleep) {
    sleepStatus = (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
          longAwake ? 'bg-blush-100 text-blush-600' : 'bg-peach-100 text-peach-600'
        }`}
      >
        <SunIcon size={13} /> Awake · {awakeFor || '0:00'}
      </span>
    )
  } else {
    sleepStatus = (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cream-100 text-gray-400 text-xs font-bold">
        No sleep yet
      </span>
    )
  }

  return (
    <div className="card p-5 bg-gradient-to-br from-cream-50 via-peach-50/30 to-lavender-50/40 border-peach-100">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-extrabold text-gray-600">Today at a Glance</p>
        {baby?.birthDate && (
          <span className="text-xs font-semibold text-gray-400">
            🎂 {formatBabyAge(baby.birthDate)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 items-stretch">
        {/* Feeding */}
        <div className="rounded-2xl bg-peach-50/70 border border-peach-100 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-full bg-peach-100 flex items-center justify-center text-lg" aria-hidden="true">🍼</span>
            <span className="text-sm font-extrabold text-peach-600">Feeding</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-800 leading-none">
            {feedingCount}
            <span className="text-sm font-bold text-gray-400 ml-1.5">
              feed{feedingCount !== 1 ? 's' : ''}
            </span>
          </p>
          <p className="text-sm font-semibold text-gray-500 mt-1.5">
            {totalAmountToday > 0 ? `${formatAmount(totalAmountToday, unit)} today` : 'No bottles today'}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastFeeding ? `Last fed ${lastFedAgo}` : 'Not fed yet'}
          </p>
          <div className="flex gap-2 mt-3">
            <Link
              to="/log"
              aria-label="Log a feeding"
              className="btn-primary text-sm !py-2 flex-1 !bg-peach-400 hover:!bg-peach-500"
            >
              <FeedingIcon size={18} />
              <span className="hidden md:inline">Log Feed</span>
            </Link>
            <button
              onClick={() => setPoopOpen(true)}
              disabled={busy}
              aria-label="Log poopy time"
              className="text-sm py-2 px-3 rounded-xl bg-peach-100 text-peach-600 font-bold hover:bg-peach-200 transition-colors disabled:opacity-50 flex-1 md:flex-none"
            >
              💩
            </button>
          </div>
          <Link to="/history" className="text-xs font-bold text-peach-500 hover:underline mt-auto pt-3">
            View feeding →
          </Link>
        </div>

        {/* Sleep */}
        <div className="rounded-2xl bg-lavender-50/70 border border-lavender-100 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-9 h-9 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-500" aria-hidden="true">
              <MoonIcon size={18} />
            </span>
            <span className="text-sm font-extrabold text-lavender-500">Sleep</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-800 leading-none">
            {totalSleepToday > 0 ? formatDurationHM(totalSleepToday) : '0m'}
          </p>
          <p className="text-sm font-semibold text-gray-500 mt-1.5">
            {napsToday} nap{napsToday !== 1 ? 's' : ''}
          </p>
          <div className="mt-2">{sleepStatus}</div>
          <button
            onClick={activeSleep ? wakeUp : startSleep}
            disabled={busy}
            className="btn-lavender text-sm py-2 mt-3 w-full"
          >
            {busy ? (
              <Spinner size="sm" />
            ) : activeSleep ? (
              <><SunIcon size={18} /> Wake Up</>
            ) : (
              <><MoonIcon size={21} /> Start Sleep</>
            )}
          </button>
          <Link to="/sleep" className="text-xs font-bold text-lavender-500 hover:underline mt-auto pt-3">
            View sleep →
          </Link>
        </div>
      </div>

      <PoopTimeModal
        isOpen={poopOpen}
        title="Log poopy time 💩"
        initialTime={new Date()}
        saving={busy}
        onClose={() => setPoopOpen(false)}
        onSave={savePoop}
      />
    </div>
  )
}
