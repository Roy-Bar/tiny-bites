import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller, useFieldArray, type SubmitHandler } from 'react-hook-form'
import { Timestamp } from 'firebase/firestore'
import { addFeeding, updateFeeding, getFeeding } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useBaby } from '../context/BabyContext'
import { useToast } from '../components/ui/Toast'
import FeedingTypeSelector from '../components/feeding/FeedingTypeSelector'
import AmountInput from '../components/feeding/AmountInput'
import DurationInput from '../components/feeding/DurationInput'
import Spinner from '../components/ui/Spinner'
import { BREAST_TYPES } from '../utils/constants'
import { toLocalDatetimeString } from '../utils/formatters'
import type { Feeding, FeedingItem, FeedingTypeId } from '../types'

interface LogFeedingItemValues {
  type: string
  amount: string | number
  unit: string
}

interface LogFeedingFormValues {
  items: LogFeedingItemValues[]
  startTime: string
  durationSeconds: number
  notes: string
}

export default function LogFeeding() {
  const { feedingId } = useParams<{ feedingId: string }>()
  const isEdit = Boolean(feedingId)
  const user = useAuth()
  const { baby } = useBaby()
  const toast = useToast()
  const navigate = useNavigate()
  const [loadingData, setLoadingData] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const babyUnit = baby?.unitPreference ?? 'oz'

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LogFeedingFormValues>({
    defaultValues: {
      items: [{ type: '', amount: '', unit: babyUnit }],
      startTime: toLocalDatetimeString(new Date()),
      durationSeconds: 0,
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const isBreast = watchedItems?.some((item) => BREAST_TYPES.has(item.type as never))

  useEffect(() => {
    if (!isEdit || !user) return
    setLoadingData(true)
    getFeeding(user.uid, feedingId!).then((f) => {
      if (!f) { navigate('/history'); return }
      const dt = f.startTime?.toDate ? f.startTime.toDate() : new Date(f.startTime as unknown as string)
      const loadedItems: FeedingItem[] =
        f.items ?? [{ type: f.type, amount: (f.amount ?? '') as number }]
      reset({
        items: loadedItems.map((i) => ({
          type: i.type,
          amount: i.amount ?? '',
          unit: (i as FeedingItem & { unit?: string }).unit ?? babyUnit,
        })),
        startTime: toLocalDatetimeString(dt),
        durationSeconds: f.durationSeconds ?? 0,
        notes: f.notes ?? '',
      })
      setLoadingData(false)
    })
  }, [isEdit, feedingId, user, navigate, reset, babyUnit])

  const onSubmit: SubmitHandler<LogFeedingFormValues> = async (data) => {
    if (!data.items?.[0]?.type) {
      toast?.('Please select a feeding type', 'error')
      return
    }
    setSaving(true)
    try {
      const startDate = new Date(data.startTime)
      const processedItems = data.items
        .filter((item) => item.type)
        .map((item) => ({
          type: item.type,
          amount: item.amount !== '' ? parseFloat(String(item.amount)) : null,
          unit: item.unit,
        }))

      const payload: Partial<Feeding> = {
        babyId: baby!.id,
        startTime: Timestamp.fromDate(startDate),
        items: processedItems as unknown as FeedingItem[],
        // backward compat fields for queries
        type: processedItems[0].type,
        amount: processedItems[0].amount,
        unit: processedItems[0].unit,
        durationSeconds: data.durationSeconds || null,
        notes: data.notes?.trim() || null,
      }

      if (isEdit) {
        await updateFeeding(user!.uid, feedingId!, payload)
        toast?.('Feeding updated!')
      } else {
        await addFeeding(user!.uid, payload)
        toast?.('Feeding logged!')
      }
      navigate(-1)
    } catch {
      toast?.('Could not save — please try again', 'error')
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
        <label htmlFor="startTime" className="label">Time</label>
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <input
              id="startTime"
              type="datetime-local"
              className="input-field"
              {...field}
            />
          )}
        />
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 p-4 bg-gray-50 rounded-2xl relative">
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute top-3 right-3 btn-icon"
                aria-label="Remove item"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <div>
              <label className="label">
                {index === 0 ? 'Feeding Type *' : 'Additional Item'}
              </label>
              <Controller
                name={`items.${index}.type`}
                control={control}
                rules={index === 0 ? { required: true } : {}}
                render={({ field }) => (
                  <FeedingTypeSelector
                    value={field.value as FeedingTypeId}
                    onChange={field.onChange}
                  />
                )}
              />
              {index === 0 && errors.items?.[0]?.type && (
                <p className="text-xs text-blush-500 font-semibold mt-2" role="alert">
                  Please select a feeding type
                </p>
              )}
            </div>

            <div>
              <label className="label">
                Amount{BREAST_TYPES.has(watchedItems?.[index]?.type as never) ? ' (optional)' : ''}
              </label>
              <Controller
                name={`items.${index}.amount`}
                control={control}
                render={({ field: amountField }) => (
                  <Controller
                    name={`items.${index}.unit`}
                    control={control}
                    render={({ field: unitField }) => (
                      <AmountInput
                        amount={String(amountField.value)}
                        unit={unitField.value}
                        onAmountChange={amountField.onChange}
                        onUnitChange={unitField.onChange}
                      />
                    )}
                  />
                )}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({
            type: '',
            amount: '',
            unit: watchedItems?.[watchedItems.length - 1]?.unit ?? babyUnit,
          })}
          className="btn-ghost w-full text-sm"
        >
          + Add another item
        </button>
      </div>

      {isBreast && (
        <div className="animate-slide-up">
          <label className="label">Duration</label>
          <Controller
            name="durationSeconds"
            control={control}
            render={({ field }) => (
              <DurationInput value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-xs text-gray-400 mt-1">Use the timer or enter manually</p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="notes" className="label mb-0">Notes (optional)</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange((field.value ? field.value + '\n' : '') + 'Poopy time 💩')}
                className="text-xs font-bold text-peach-500 hover:text-peach-600 transition-colors"
              >
                + Poopy time 💩
              </button>
            )}
          />
        </div>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea
              id="notes"
              rows={2}
              className="input-field resize-none"
              placeholder="Any observations, mood, etc."
              {...field}
            />
          )}
        />
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
          {saving ? <Spinner size="sm" /> : isEdit ? 'Save Changes' : 'Log Feeding'}
        </button>
      </div>
    </form>
  )
}
