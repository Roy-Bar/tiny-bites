import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import AnnouncementBanner from '../ui/AnnouncementBanner'

export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-cream-100">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-4 py-6 pb-28 md:px-8 md:pb-8 max-w-3xl mx-auto w-full">
          <AnnouncementBanner />
          <Outlet />
        </main>
        <footer className="text-center text-xs text-gray-300 py-4 pb-32 md:pb-4">
          © Roy &amp; Miri Bar 2026
        </footer>
      </div>
      <BottomNav />
    </div>
  )
}
