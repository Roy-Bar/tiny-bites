export default function AmountInput({ amount, unit, onAmountChange, onUnitChange }) {
  function addPreset(n) {
    const current = parseFloat(amount) || 0
    onAmountChange(String(current + n))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0"
          className="input-field w-28 text-center text-xl font-bold"
          aria-label="Amount"
        />
        <button
          type="button"
          onClick={() => addPreset(60)}
          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-peach-100 text-peach-600 hover:bg-peach-200 transition-colors"
        >
          +60
        </button>
      </div>
      <div
        className="flex bg-cream-200 rounded-xl p-1 gap-1 w-fit"
        role="radiogroup"
        aria-label="Unit"
      >
        {['oz', 'ml'].map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={unit === u}
            onClick={() => onUnitChange(u)}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-150 ${
              unit === u
                ? 'bg-white text-peach-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  )
}
