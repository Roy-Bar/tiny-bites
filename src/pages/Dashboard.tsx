import { Link } from 'react-router-dom'
import { useFeedings } from '../hooks/useFeedings'
import { useBaby } from '../context/BabyContext'
import StatsBar from '../components/dashboard/StatsBar'
import DailyTimeline from '../components/dashboard/DailyTimeline'
import FeedingChart from '../components/dashboard/FeedingChart'
import FeedingCard from '../components/feeding/FeedingCard'
import SleepTracker from '../components/sleep/SleepTracker'
import EmptyState from '../components/ui/EmptyState'
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

      <StatsBar />

      <DailyTimeline />

      <FeedingChart />

      {/* Recent Feedings */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">
            Today's Feedings
          </h2>
          <Link to="/history" className="text-xs font-bold text-peach-500 hover:underline">
            See all →
          </Link>
        </div>

        {todayFeedings.length === 0 ? (
          <EmptyState
            icon="🍼"
            title="No feedings logged today"
            message="Tap the + button to log your first feeding of the day."
            action={
              <Link to="/log" className="btn-primary text-sm px-5 py-2.5">
                Log a Feeding
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {todayFeedings.slice(0, 5).map((f) => (
              <FeedingCard key={f.id} feeding={f} />
            ))}
            {todayFeedings.length > 5 && (
              <Link
                to="/history"
                className="block text-center text-sm font-bold text-peach-500 py-2 hover:underline"
              >
                +{todayFeedings.length - 5} more — view all
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Sleep tracker */}
      <SleepTracker />
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
