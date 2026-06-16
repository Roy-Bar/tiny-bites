import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { deleteFeeding } from '../../firebase/firestore'
import { formatTime } from '../../utils/formatters'
import { useToast } from '../ui/Toast'
import type { Feeding } from '../../types'

export default function PoopRow({ poop }: { poop: Feeding }) {
  const user = useAuth()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  async function remove() {
    if (!user || busy) return
    setBusy(true)
    try {
      await deleteFeeding(user.uid, poop.id)
      toast?.('Deleted')
    } catch {
      toast?.('Could not delete — please try again', 'error')
      setBusy(false)
    }
  }

  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-peach-100 flex items-center justify-center text-base" aria-hidden="true">💩</span>
      <span className="text-sm font-bold text-gray-700">Poopy time</span>
      <span className="text-xs text-gray-400 ml-auto">{formatTime(poop.startTime)}</span>
      <button
        onClick={remove}
        disabled={busy}
        aria-label="Delete poop entry"
        className="text-xs font-bold text-gray-300 hover:text-blush-500 transition-colors disabled:opacity-50"
      >
        ✕
      </button>
    </div>
  )
}
