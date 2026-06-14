import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { Timestamp } from 'firebase/firestore'
import { addSleep, updateSleep, getSleep } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useBaby } from '../context/BabyContext'
import { useToast } from '../components/ui/Toast'
import Spinner from '../components/ui/Spinner'
import { toLocalDatetimeString } from '../utils/formatters'

export default function LogSleep() {
  const { sleepId } = useParams()
  const isEdit = Boolean(sleepId)
  const user = useAuth()
  const { baby } = useBaby()
  const toast = useToast()
  const navigate = useNavigate()
  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      startTime: toLocalDatetimeString(new Date()),
      endTime: '',
    },
  })

  useEffect(() => {
    if (!isEdit || !user) return
    setLoadingData(true)
    getSleep(user.uid, sleepId).then((s) => {
      if (!s) { navigate('/sleep'); return }
      const start = s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime)
      const end = s.endTime ? (s.endTime.toDate ? s.endTime.toDate() : new Date(s.endTime)) : null
      reset({
        startTime: toLocalDatetimeString(start),
        endTime: end ? toLocalDatetimeString(end) : '',
      })
      setLoadingData(false)
    })
  }, [isEdit, sleepId, user, navigate, reset])

  async function onSubmit(data) {
    const startDate = new Date(data.startTime)
    const endDate = data.endTime ? new Date(data.endTime) : null

    if (endDate && endDate <= startDate) {
      toast('Wake time must be after sleep time', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        babyId: baby.id,
        startTime: Timestamp.fromDate(startDate),
        endTime: endDate ? Timestamp.fromDate(endDate) : null,
      }

      if (isEdit) {
        await updateSleep(user.uid, sleepId, payload)
        toast('Sleep updated!')
      } else {
        await addSleep(user.uid, payload)
        toast('Sleep logged!')
      }
      navigate(-1)
    } catch {
      toast('Could not save — please try again', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in" noValidate>
      <div>
        <label htmlFor="startTime" className="label">Fell asleep 🌙</label>
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <input id="startTime" type="datetime-local" className="input-field" {...field} />
          )}
        />
      </div>

      <div>
        <label htmlFor="endTime" className="label">Woke up ☀️ (optional)</label>
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <input id="endTime" type="datetime-local" className="input-field" {...field} />
          )}
        />
        <p className="text-xs text-gray-400 mt-1">Leave empty if the baby is still asleep.</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="btn-ghost flex-1"
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary flex-1">
          {saving ? <Spinner size="sm" /> : isEdit ? 'Save Changes' : 'Log Sleep'}
        </button>
      </div>
    </form>
  )
}
