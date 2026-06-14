import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FEEDING_TYPE_MAP } from '../../utils/constants'
import { formatTime, formatAmount, formatDuration, formatDate } from '../../utils/formatters'
import Modal from '../ui/Modal'
import { deleteFeeding } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import type { Feeding, FeedingItem, FeedingTypeDef } from '../../types'

interface FeedingCardProps {
  feeding: Feeding
  showDate?: boolean
}

export default function FeedingCard({ feeding, showDate = false }: FeedingCardProps) {
  const user = useAuth()
  const toast = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const items: FeedingItem[] = feeding.items?.length
    ? feeding.items
    : [{ type: feeding.type, amount: feeding.amount ?? 0 }]
  const typeInfo: Partial<FeedingTypeDef> = FEEDING_TYPE_MAP[items[0]?.type] ?? {}

  async function handleDelete() {
    if (!user || !toast) return
    try {
      await deleteFeeding(user.uid, feeding.id)
      toast('Feeding deleted')
    } catch {
      toast('Could not delete — try again', 'error')
    }
  }

  return (
    <>
      <div className="card p-4 flex items-start gap-4 animate-fade-in">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: typeInfo.color + '33' }}
          aria-hidden="true"
        >
          {typeInfo.icon}
        </div>

        <div className="flex-1 min-w-0">
          {showDate && feeding.startTime && (
            <p className="text-xs font-semibold text-gray-400 mb-0.5">
              {formatDate(feeding.startTime)}
            </p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            {items.map((item, i) => {
              const info: Partial<FeedingTypeDef> = FEEDING_TYPE_MAP[item.type] ?? {}
              return (
                <span key={i} className="flex items-center gap-1">
                  <span className={info.badgeClass ?? 'badge-breast'}>
                    {info.shortLabel ?? item.type}
                  </span>
                  {item.amount > 0 && (
                    <span className="text-sm font-semibold text-gray-600">
                      {formatAmount(item.amount, feeding.unit)}
                    </span>
                  )}
                </span>
              )
            })}
            {(feeding.durationSeconds ?? 0) > 0 && (
              <span className="text-sm font-semibold text-gray-500">
                ⏱ {formatDuration(feeding.durationSeconds)}
              </span>
            )}
          </div>
          {feeding.notes && (
            <p className="text-xs text-gray-400 mt-1 truncate">{feeding.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-semibold text-gray-400 min-w-[3rem] text-right">
            {formatTime(feeding.startTime)}
          </span>
          <Link
            to={`/log/${feeding.id}`}
            className="btn-icon"
            aria-label="Edit feeding"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </Link>
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-icon"
            aria-label="Delete feeding"
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
        title="Delete feeding?"
        message="This can't be undone."
        confirmLabel="Delete"
        confirmClass="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blush-500 text-white font-bold rounded-xl hover:bg-blush-600 active:scale-95 transition-all duration-150 text-sm"
      />
    </>
  )
}
