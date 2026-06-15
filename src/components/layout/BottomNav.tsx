import { Link, useLocation } from 'react-router-dom'
import { type ReactNode } from 'react'
import { MoonIcon } from '../sleep/icons'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  primary?: boolean
  accent?: 'peach' | 'lavender'
}

// Full class names per accent so Tailwind keeps them through purge.
const ACCENT_STYLES = {
  peach: { pill: 'bg-peach-500 shadow-peach-300/50', label: 'text-peach-500' },
  lavender: { pill: 'bg-lavender-400 shadow-lavender-300/50', label: 'text-lavender-500' },
} as const

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/log',
    label: 'Feed',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="10.5" y="1.8" width="3" height="2.8" rx="1.2" />
        <rect x="8.5" y="4" width="7" height="2.8" rx="1" />
        <path d="M9 6.8H15V8c1.7 0 2.5 1 2.5 3v7c0 2-1 3.5-3 3.5h-5c-2 0-3-1.5-3-3.5v-7c0-2 .8-3 2.5-3z" />
        <path d="M9 12h2.5M9 15h2.5" />
      </svg>
    ),
    primary: true,
    accent: 'peach',
  },
  {
    to: '/sleep',
    label: 'Sleep',
    icon: <MoonIcon className="w-6 h-6" />,
    primary: true,
    accent: 'lavender',
  },
  {
    to: '/history',
    label: 'History',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/export',
    label: 'Export',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-cream-200 flex md:hidden"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.to
        if (item.primary) {
          const accent = ACCENT_STYLES[item.accent ?? 'peach']
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
              aria-label={item.label}
            >
              <span className={`flex items-center justify-center w-12 h-12 -mt-5 rounded-2xl shadow-lg text-white ${accent.pill}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold mt-0.5 ${accent.label}`}>{item.label}</span>
            </Link>
          )
        }
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              active ? 'text-peach-500' : 'text-gray-400'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
