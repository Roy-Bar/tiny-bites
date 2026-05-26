import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../firebase/auth'
import { useToast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import Logo from '../components/ui/Logo'

export default function Register() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password || !displayName) return
    if (password.length < 6) {
      toast('Password must be at least 6 characters', 'error')
      return
    }
    setLoading(true)
    try {
      await signUp(email, password, displayName)
      navigate('/profile')
    } catch (err) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'An account already exists with this email'
          : err.code === 'auth/invalid-email'
          ? 'Please enter a valid email address'
          : 'Registration failed — please try again'
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-3xl font-extrabold text-peach-500">Tiny Bites</h1>
          <p className="text-gray-400 font-medium mt-1">Your baby feeding companion</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4" noValidate>
          <h2 className="text-xl font-extrabold text-gray-800">Create your account ✨</h2>

          <div>
            <label htmlFor="displayName" className="label">Your name</label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="Sarah"
              required
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || !displayName}
            className="btn-primary w-full"
          >
            {loading ? <Spinner size="sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-peach-500 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
