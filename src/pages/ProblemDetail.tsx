import { getProblems } from '../store/problems'
import ProblemTree from '../components/ProblemTree'
import ComplexityMatrixView from '../components/ComplexityMatrixView'

type Props = {
  id: string
  onBack: () => void
  onEdit: (id: string) => void
}

export default function ProblemDetail({ id, onBack, onEdit }: Props) {
  const problem = getProblems().find((p) => p.id === id) ?? null

  if (!problem) {
    return (
      <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center z-10">
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
    <div className="fixed inset-4 bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10">
      {/* Header */}
      <header className="shrink-0 bg-white/95 backdrop-blur-sm flex items-center gap-4 px-6 py-5 border-b border-slate-200">
        <button
          onClick={onBack}
          className="shrink-0 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
        >
          ← Back
        </button>
        <h1 className="flex-1 text-base font-semibold text-gray-800 truncate">{problem.description}</h1>
        <button
          onClick={() => onEdit(id)}
          className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          Edit
        </button>
      </header>

      {/* Scrollable tree area */}
      <main className="flex-1 overflow-auto px-6 py-6">
        {problem.causes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-300 text-4xl mb-4">🌿</p>
              <p className="text-slate-500 text-sm">No causes were recorded for this problem.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 mb-4">Problem map</h2>
              <ProblemTree problem={problem} />
            </div>
            <div className="rounded-[2rem] bg-white border border-slate-200 shadow-sm p-6">
              <ComplexityMatrixView causes={problem.causes} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
