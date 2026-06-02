import { useState } from 'react'
import { getProblems } from '../store/problems'
import type { Problem } from '../types'

type Props = {
  onAddProblem: () => void
  onSelectProblem: (id: string) => void
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function rootCauseCount(p: Problem) {
  return p.whys.filter((w) => w.isActionableRootCause).length
}

export default function Home({ onAddProblem, onSelectProblem }: Props) {
  const [problems] = useState<Problem[]>(() => getProblems())

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Reflect</h1>
        <button
          onClick={onAddProblem}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add Problem
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {problems.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🤔</p>
            <p className="text-gray-500 text-lg mb-1">No problems yet</p>
            <p className="text-gray-400 text-sm">
              Click <span className="font-medium">+ Add Problem</span> to start reflecting
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {problems.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelectProblem(p.id)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all group"
                >
                  <p className="text-gray-800 font-medium group-hover:text-indigo-700 transition-colors">
                    {p.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDate(p.createdAt)}</span>
                    {rootCauseCount(p) > 0 && (
                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {rootCauseCount(p)} root cause{rootCauseCount(p) > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
