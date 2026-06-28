import { useState } from 'react'
import { Timestamp } from 'firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { deleteFeeding, updateFeeding } from '../../firebase/firestore'
import { formatTime, toJsDate } from '../../utils/formatters'
import { useToast } from '../ui/Toast'
import Modal from '../ui/Modal'
import PoopTimeModal from './PoopTimeModal'
import type { Feeding } from '../../types'

export default function PoopRow({ poop }: { poop: Feeding }) {
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleDelete() {
    if (!user) return
    try {
      await deleteFeeding(user.uid, poop.id)
      toast?.('Deleted')
    } catch {
      toast?.('Could not delete — try again', 'error')
    }
  }

  async function saveTime(time: Date) {
    if (!user || busy) return
    setBusy(true)
    try {
      await updateFeeding(user.uid, poop.id, { startTime: Timestamp.fromDate(time) })
      toast?.('Updated')
      setEditOpen(false)
    } catch {
      toast?.('Could not save — please try again', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card p-4 flex items-start gap-4 animate-fade-in">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-peach-100"
          aria-hidden="true"
        >
          💩
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-700">Poopy time</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-semibold text-gray-400 min-w-[3rem] text-right">
            {formatTime(poop.startTime)}
          </span>
          <button
            onClick={() => setEditOpen(true)}
            disabled={busy}
            className="btn-icon"
            aria-label="Edit poop time"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="btn-icon"
            aria-label="Delete poop entry"
          >
            <svg className="w-4 h-4 text-gray-300 hover:text-blush-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <PoopTimeModal
        isOpen={editOpen}
        title="Edit time"
        initialTime={poop.startTime ? toJsDate(poop.startTime) : new Date()}
        saving={busy}
        onClose={() => setEditOpen(false)}
        onSave={saveTime}
      />

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete poop entry?"
        message="This can't be undone."
        confirmLabel="Delete"
        confirmClass="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blush-500 text-white font-bold rounded-xl hover:bg-blush-600 active:scale-95 transition-all duration-150 text-sm"
      />
    </>
  )
}
