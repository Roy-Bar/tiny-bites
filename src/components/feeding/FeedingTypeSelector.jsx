import { FEEDING_TYPES } from '../../utils/constants'

export default function FeedingTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Feeding type">
      {FEEDING_TYPES.map((type) => {
        const selected = value === type.id
        return (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 font-bold text-sm transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-400 focus-visible:ring-offset-2 ${
              selected
                ? 'border-lavender-400 bg-lavender-100 text-lavender-700'
                : 'border-cream-300 bg-cream-50 text-gray-500 hover:border-lavender-200 hover:bg-lavender-50'
            }`}
          >
            <span
              className="text-2xl leading-none"
              style={type.mirrorIcon ? { display: 'inline-block', transform: 'scaleX(-1)' } : undefined}
            >
              {type.icon}
            </span>
            <span className="text-center leading-snug">{type.label}</span>
          </button>
        )
      })}
    </div>
  )
}
