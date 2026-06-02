type Props = {
  breadcrumb: string[]       // [problemDesc, cause1, cause2, ..., currentTarget]
  isFirstCause: boolean      // true → "Why did X happen?", false → "Any other cause for X?"
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onSkip: () => void
}

export default function WhyStep({ breadcrumb, isFirstCause, value, onChange, onNext, onSkip }: Props) {
  const targetText = breadcrumb[breadcrumb.length - 1]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
        {breadcrumb.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={i === breadcrumb.length - 1 ? 'text-indigo-600 font-medium' : ''}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Prompt */}
      <div>
        <label className="block text-base font-semibold text-gray-800 mb-1">
          {isFirstCause
            ? `Why did "${targetText}" happen?`
            : `Any other cause for "${targetText}"?`}
        </label>
        <p className="text-sm text-gray-400 mb-3">
          {isFirstCause
            ? "Dig one level deeper. Press Skip if you're not sure."
            : 'Add another cause, or press Done to move on.'}
        </p>
        <textarea
          autoFocus
          key={breadcrumb.join('|') + String(isFirstCause)}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Because…"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onNext}
          disabled={value.trim() === ''}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Next →
        </button>
        <button
          onClick={onSkip}
          className="px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-500 text-sm font-medium rounded-lg transition-colors"
        >
          {isFirstCause ? 'Skip' : 'Done'}
        </button>
      </div>
    </div>
  )
}
