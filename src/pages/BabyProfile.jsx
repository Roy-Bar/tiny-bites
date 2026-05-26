import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { useBaby } from '../context/BabyContext'
import { useToast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'

export default function BabyProfile() {
  const { baby, loading, saveBaby } = useBaby()
  const toast = useToast()
  const navigate = useNavigate()
  const user = useAuth()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [unit, setUnit] = useState('oz')

  useEffect(() => {
    if (!baby) return
    setName(baby.name ?? '')
    setUnit(baby.unitPreference ?? 'oz')
    if (baby.birthDate) {
      const d = baby.birthDate.toDate ? baby.birthDate.toDate() : new Date(baby.birthDate)
      setBirthDate(d.toISOString().slice(0, 10))
    }
  }, [baby])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      toast("Please enter your baby's name", 'error')
      return
    }
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        unitPreference: unit,
        birthDate: birthDate ? Timestamp.fromDate(new Date(birthDate)) : null,
      }
      await saveBaby(data)
      toast("Profile saved!")
      navigate('/dashboard')
    } catch {
      toast('Could not save — please try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  const isFirst = !baby?.name

  return (
    <div className="max-w-md mx-auto animate-fade-in">
      {isFirst && (
        <div className="text-center mb-8">
          <span className="text-5xl block mb-2">👶</span>
          <h2 className="text-2xl font-extrabold text-gray-800">Welcome!</h2>
          <p className="text-gray-400 mt-1">Let's set up your baby's profile first.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5" noValidate>
        {!isFirst && (
          <h2 className="text-xl font-extrabold text-gray-800">Baby Profile 👶</h2>
        )}

        <div>
          <label htmlFor="babyName" className="label">Baby's name *</label>
          <input
            id="babyName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Mia"
            required
          />
        </div>

        <div>
          <label htmlFor="birthDate" className="label">Date of birth</label>
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="input-field"
          />
        </div>

        <div>
          <p className="label mb-2">Preferred unit</p>
          <div
            className="flex bg-cream-200 rounded-xl p-1 gap-1 w-fit"
            role="radiogroup"
            aria-label="Unit preference"
          >
            {['oz', 'ml'].map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                onClick={() => setUnit(u)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-150 ${
                  unit === u
                    ? 'bg-white text-peach-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Used as default when logging feedings</p>
        </div>

        <div className="pt-2 flex gap-3">
          {!isFirst && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost flex-1"
              disabled={saving}
            >
              Cancel
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? <Spinner size="sm" /> : isFirst ? 'Get Started →' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
