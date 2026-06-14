import { useEffect, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  message?: ReactNode
  confirmLabel?: ReactNode
  confirmClass?: string
}

export default function Modal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmClass = 'btn-primary' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card p-6 w-full max-w-sm animate-slide-up">
        <h2 id="modal-title" className="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        {message && <p className="text-gray-500 text-sm mb-6">{message}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className={`${confirmClass} text-sm px-4 py-2`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
