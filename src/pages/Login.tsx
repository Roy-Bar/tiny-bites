import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../firebase/auth'
import { useToast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()!

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
      const code = err instanceof Error ? (err as { code?: string }).code : undefined
      const msg =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Incorrect email or password'
          : code === 'auth/user-not-found'
          ? 'No account found with this email'
          : 'Sign in failed — please try again'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-peach-500">Tiny Bites</h1>
          <p className="text-gray-400 font-medium mt-1">Your baby feeding companion</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4" noValidate>
          <h2 className="text-xl font-extrabold text-gray-800">Welcome back 👋</h2>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full"
          >
            {loading ? <Spinner size="sm" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          New here?{' '}
          <Link to="/register" className="font-bold text-peach-500 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
