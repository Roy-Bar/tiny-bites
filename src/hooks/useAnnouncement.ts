import { useCallback, useEffect, useState } from 'react'
import { getLatestAnnouncement } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import type { Announcement } from '../types'

const STORAGE_KEY = 'tinybites:dismissedAnnouncements'

function readDismissed(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeDismissed(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable (private mode, quota) — non-fatal, just skip.
  }
}

interface UseAnnouncementResult {
  announcement: Announcement | null
  dismiss: () => void
}

// Loads the latest active announcement and hides it once the user dismisses it.
// Dismissals are remembered per-browser in localStorage. A failed fetch is
// silently ignored — an announcement is never important enough to disrupt the app.
export function useAnnouncement(): UseAnnouncementResult {
  const user = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!user) {
      setAnnouncement(null)
      return
    }

    let cancelled = false
    getLatestAnnouncement()
      .then((latest) => {
        if (cancelled || !latest) return
        if (readDismissed().includes(latest.id)) return
        setAnnouncement(latest)
      })
      .catch(() => {
        // ignore — no banner is fine
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const dismiss = useCallback(() => {
    setAnnouncement((current) => {
      if (current) writeDismissed([...readDismissed(), current.id])
      return null
    })
  }, [])

  return { announcement, dismiss }
}
