import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'

export default function PrivateRoute() {
  const user = useAuth()

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
