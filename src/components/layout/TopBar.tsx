import { Link, useLocation } from 'react-router-dom'
import { signOut } from '../../firebase/auth'
import { useAuth } from '../../context/AuthContext'
import { useBaby } from '../../context/BabyContext'
import { useToast } from '../ui/Toast'
import { formatBabyAge } from '../../utils/formatters'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/log': 'Log Feeding',
  '/sleep': 'Sleep',
  '/sleep/log': 'Log Sleep',
  '/history': 'History',
  '/profile': 'Baby Profile',
  '/export': 'Export',
}

export default function TopBar() {
  useAuth()
  const { baby } = useBaby()
  const toast = useToast()!
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] ?? 'Tiny Bites'
  const age = baby?.birthDate ? formatBabyAge(baby.birthDate) : null

  async function handleSignOut() {
    await signOut()
    toast('Signed out. See you soon! 👋')
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-cream-200 px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="font-extrabold text-lg text-peach-500 leading-tight">{title}</h1>
        {baby?.name && (
          <p className="text-xs text-gray-400 font-medium">
            {baby.name}
            {age && <span className="ml-1 text-lavender-400">· {age}</span>}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Link to="/profile" className="btn-icon" aria-label="Baby profile">
          <svg className="w-5 h-5 text-peach-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </Link>
        <button onClick={handleSignOut} className="btn-icon" aria-label="Sign out">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
