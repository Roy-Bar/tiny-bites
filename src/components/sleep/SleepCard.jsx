import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTime, formatDate, formatDurationHM } from '../../utils/formatters'
import Modal from '../ui/Modal'
import { deleteSleep } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'

function durationSeconds(sleep) {
  if (!sleep?.startTime) return 0
  const start = sleep.startTime.toDate ? sleep.startTime.toDate() : new Date(sleep.startTime)
  const end = sleep.endTime
    ? (sleep.endTime.toDate ? sleep.endTime.toDate() : new Date(sleep.endTime))
    : new Date()
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

export default function SleepCard({ sleep, showDate = false }) {
  const user = useAuth()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const ongoing = !sleep.endTime

  async function handleDelete() {
    try {
      await deleteSleep(user.uid, sleep.id)
      toast('Sleep deleted')
    } catch {
      toast('Could not delete — try again', 'error')
    }
  }

  return (
    <>
      <div className="card p-4 flex items-start gap-4 animate-fade-in">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: '#a78bfa33' }}
          aria-hidden="true"
        >
          🌙
        </div>

        <div className="flex-1 min-w-0">
          {showDate && sleep.startTime && (
            <p className="text-xs font-semibold text-gray-400 mb-0.5">
              {formatDate(sleep.startTime)}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">
              {formatTime(sleep.startTime)} → {ongoing ? 'now' : formatTime(sleep.endTime)}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                ongoing
                  ? 'bg-lavender-100 text-lavender-600 animate-pulse-soft'
                  : 'bg-lavender-100 text-lavender-700'
              }`}
            >
              {ongoing ? '😴 Sleeping' : `⏰ ${formatDurationHM(durationSeconds(sleep))}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            to={`/sleep/log/${sleep.id}`}
            className="btn-icon"
            aria-label="Edit sleep"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-icon"
            aria-label="Delete sleep"
          >
            <svg className="w-4 h-4 text-gray-300 hover:text-blush-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete sleep?"
        message="This can't be undone."
        confirmLabel="Delete"
        confirmClass="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blush-500 text-white font-bold rounded-xl hover:bg-blush-600 active:scale-95 transition-all duration-150 text-sm"
      />
    </>
  )
}
