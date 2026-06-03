import { useState } from 'react'
import { getProblems } from '../store/problems'
import type { CauseNode, Problem } from '../types'

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

function countRootCauses(nodes: CauseNode[]): number {
  return nodes.reduce((acc, n) => acc + (n.isActionableRootCause ? 1 : 0) + countRootCauses(n.children), 0)
}

export default function Home({ onAddProblem, onSelectProblem }: Props) {
  const [problems] = useState<Problem[]>(() => getProblems())

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-indigo-600 font-semibold">Reflect</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Capture problems, map causes, and solve them.</h1>
        </div>
        <button
          onClick={onAddProblem}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200"
        >
          + Add Problem
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        {problems.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🤔</p>
            <p className="text-gray-500 text-lg mb-1">No problems yet</p>
            <p className="text-gray-400 text-sm">
              Click <span className="font-medium">+ Add Problem</span> to start reflecting
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {problems.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelectProblem(p.id)}
                  className="w-full text-left bg-white border border-slate-200 rounded-3xl px-6 py-5 shadow-sm hover:border-indigo-300 hover:shadow-lg transition-all duration-200 group"
                >
                  <p className="text-lg font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    {p.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{formatDate(p.createdAt)}</span>
                    {countRootCauses(p.causes) > 0 && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">
                        {countRootCauses(p.causes)} root cause{countRootCauses(p.causes) > 1 ? 's' : ''}
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
