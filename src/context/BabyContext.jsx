import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getActiveBaby, createBaby, updateBaby } from '../firebase/firestore'
import { useAuth } from './AuthContext'

const BabyContext = createContext(null)

export function BabyProvider({ children }) {
  const user = useAuth()
  const [baby, setBaby] = useState(undefined) // undefined = loading
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

  async function saveBaby(data) {
    if (!user) return
    if (baby?.id) {
      await updateBaby(user.uid, baby.id, data)
      setBaby((prev) => ({ ...prev, ...data }))
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

export function useBaby() {
  return useContext(BabyContext)
}
