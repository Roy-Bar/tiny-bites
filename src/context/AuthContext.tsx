import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange } from '../firebase/auth'

// undefined = still loading, null = signed out, User = signed in
type AuthState = User | null | undefined

const AuthContext = createContext<AuthState>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState>(undefined) // undefined = loading

  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u ?? null))
    return unsub
  }, [])

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
