import { useEffect, useState } from 'react'
import { toLocalDatetimeString } from '../../utils/formatters'
import Spinner from '../ui/Spinner'

interface PoopTimeModalProps {
  isOpen: boolean
  title: string
  initialTime: Date
  confirmLabel?: string
  saving?: boolean
  onClose: () => void
  onSave: (time: Date) => void
}

export default function PoopTimeModal({
  isOpen,
  title,
  initialTime,
  confirmLabel = 'Save',
  saving = false,
  onClose,
  onSave,
}: PoopTimeModalProps) {
  const [value, setValue] = useState('')

  // Seed the input when the modal opens, so reopening for another row shows
  // that row's time. Intentionally keyed on `isOpen` only: callers pass a fresh
  // Date object each render, so depending on `initialTime` would re-fire on
  // every parent re-render and clobber what the user typed.
  useEffect(() => {
    if (isOpen) setValue(toLocalDatetimeString(initialTime))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleSave() {
    if (!value) return
    onSave(new Date(value))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="poop-modal-title"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card p-6 w-full max-w-sm animate-slide-up">
        <h2 id="poop-modal-title" className="text-lg font-bold text-gray-800 mb-4">{title}</h2>
        <label htmlFor="poop-time" className="label">Time</label>
        <input
          id="poop-time"
          type="datetime-local"
          className="input-field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2" disabled={saving}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="btn-primary text-sm px-4 py-2"
          >
            {saving ? <Spinner size="sm" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
