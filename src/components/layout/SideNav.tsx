import { Link, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import { signOut } from '../../firebase/auth'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ui/Toast'
import Logo from '../ui/Logo'
import { FeedingIcon } from '../feeding/icons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/log',
    label: 'Log Feeding',
    icon: (
      <FeedingIcon className="w-5 h-5" />
    ),
  },
  {
    to: '/sleep',
    label: 'Sleep',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Baby Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/export',
    label: 'Export',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
]

export default function SideNav() {
  const { pathname } = useLocation()
  const user = useAuth()
  const toast = useToast()!

  async function handleSignOut() {
    await signOut()
    toast('Signed out. See you soon! 👋')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-cream-200 py-6 shrink-0">
      <Link to="/dashboard" className="px-6 mb-8 flex items-center gap-2">
        <Logo size={32} />
        <span className="text-xl font-extrabold text-peach-500">Tiny Bites</span>
      </Link>

      <nav className="flex-1 px-3 flex flex-col gap-1" aria-label="Sidebar navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${
                active
                  ? 'bg-peach-100 text-peach-600'
                  : 'text-gray-500 hover:bg-cream-100 hover:text-gray-700'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 mt-4 border-t border-cream-200 pt-4">
        <div className="px-4 py-2 mb-2">
          <p className="text-xs font-semibold text-gray-500 truncate">{user?.displayName ?? user?.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:bg-cream-100 hover:text-gray-700 transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
