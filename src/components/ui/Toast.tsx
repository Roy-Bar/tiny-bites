import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

type ShowToast = (message: string, type?: ToastType) => void

const ToastContext = createContext<ShowToast | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback<ShowToast>((message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up px-5 py-3 rounded-xl shadow-lg text-sm font-bold text-white flex items-center gap-2 pointer-events-auto ${
              t.type === 'error' ? 'bg-blush-500' : 'bg-sage-400'
            }`}
          >
            {t.type === 'error' ? '⚠️' : '✓'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
