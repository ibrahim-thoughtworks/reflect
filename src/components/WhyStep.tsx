type Props = {
  step: number
  total: number
  value: string
  onChange: (value: string) => void
  onNext: () => void
  onSkip: () => void
}

export default function WhyStep({ step, total, value, onChange, onNext, onSkip }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-indigo-600">
          Why {step} of {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                i < step ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-base font-semibold text-gray-800 mb-1">
          Why did this happen?
        </label>
        <p className="text-sm text-gray-400 mb-3">
          Dig one level deeper. If you're not sure, press Skip.
        </p>
        <textarea
          autoFocus
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Because…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onNext}
          disabled={value.trim() === ''}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {step === total ? 'Finish' : 'Next →'}
        </button>
        <button
          onClick={onSkip}
          className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-500 text-sm font-medium rounded-lg transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
