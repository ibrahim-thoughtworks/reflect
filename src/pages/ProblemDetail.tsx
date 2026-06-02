import { getProblems } from '../store/problems'
import ProblemTree from '../components/ProblemTree'

type Props = {
  id: string
  onBack: () => void
}

export default function ProblemDetail({ id, onBack }: Props) {
  const problem = getProblems().find((p) => p.id === id) ?? null

  if (!problem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Problem not found.</p>
          <button onClick={onBack} className="text-indigo-600 text-sm underline">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button
          onClick={onBack}
          className="shrink-0 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-base font-semibold text-gray-800 truncate">{problem.description}</h1>
      </header>

      <main className="px-6 py-8">
        {problem.causes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-300 text-4xl mb-4">🌿</p>
            <p className="text-gray-400 text-sm">No causes were recorded for this problem.</p>
          </div>
        ) : (
          <ProblemTree problem={problem} />
        )}
      </main>
    </div>
  )
}
