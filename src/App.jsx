import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BabyProvider } from './context/BabyContext'
import { ToastProvider } from './components/ui/Toast'
import PrivateRoute from './routes/PrivateRoute'
import PublicRoute from './routes/PublicRoute'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import LogFeeding from './pages/LogFeeding'
import History from './pages/History'
import BabyProfile from './pages/BabyProfile'
import Export from './pages/Export'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BabyProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/log" element={<LogFeeding />} />
                  <Route path="/log/:feedingId" element={<LogFeeding />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/profile" element={<BabyProfile />} />
                  <Route path="/export" element={<Export />} />
                </Route>
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </BabyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
