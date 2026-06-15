import { useFeedings } from '../hooks/useFeedings'
import { useBaby } from '../context/BabyContext'
import TodayGlance from '../components/dashboard/TodayGlance'
import DailyTimeline from '../components/dashboard/DailyTimeline'
import FeedingChart from '../components/dashboard/FeedingChart'
import SleepChart from '../components/sleep/SleepChart'
import Spinner from '../components/ui/Spinner'

export default function Dashboard() {
  const { todayFeedings, loading } = useFeedings()
  const { baby } = useBaby()

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome Banner */}
      <div className="card p-5 bg-gradient-to-br from-peach-50 to-lavender-50 border-peach-100">
        <p className="text-sm font-semibold text-peach-500">
          {getGreeting()}{baby?.name ? `, ${baby.name} is growing! 🌱` : ' 🌱'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {todayFeedings.length === 0
            ? 'No feedings logged today yet'
            : `${todayFeedings.length} feeding${todayFeedings.length !== 1 ? 's' : ''} logged today`}
        </p>
      </div>

      <TodayGlance />

      <DailyTimeline />

      <FeedingChart />

      <SleepChart />
    </div>
  )
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return 'Up late?'
  if (h < 12) return 'Good morning!'
  if (h < 18) return 'Good afternoon!'
  return 'Good evening!'
}
