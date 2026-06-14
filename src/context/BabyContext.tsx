import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { getActiveBaby, createBaby, updateBaby } from '../firebase/firestore'
import { useAuth } from './AuthContext'
import type { Baby } from '../types'

interface BabyContextValue {
  baby: Baby | null | undefined
  loading: boolean
  saveBaby: (data: Partial<Baby>) => Promise<void>
  refetch: () => Promise<void>
}

const BabyContext = createContext<BabyContextValue | null>(null)

export function BabyProvider({ children }: { children: ReactNode }) {
  const user = useAuth()
  const [baby, setBaby] = useState<Baby | null | undefined>(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  const fetchBaby = useCallback(async () => {
    if (!user) {
      setBaby(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const b = await getActiveBaby(user.uid)
    setBaby(b)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchBaby()
  }, [fetchBaby])

  async function saveBaby(data: Partial<Baby>) {
    if (!user) return
    if (baby?.id) {
      await updateBaby(user.uid, baby.id, data)
      setBaby((prev) => ({ ...prev, ...data }) as Baby)
    } else {
      const id = await createBaby(user.uid, data)
      setBaby({ id, ...data, isActive: true })
    }
  }

  return (
    <BabyContext.Provider value={{ baby, loading, saveBaby, refetch: fetchBaby }}>
      {children}
    </BabyContext.Provider>
  )
}

export function useBaby(): BabyContextValue {
  const ctx = useContext(BabyContext)
  if (!ctx) throw new Error('useBaby must be used within a BabyProvider')
  return ctx
}
