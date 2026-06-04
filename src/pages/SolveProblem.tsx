import { useRef, useState } from 'react'
import { getProblems, updateProblem } from '../store/problems'
import type { CauseNode, Solution } from '../types'

type Props = {
  id: string
  onDone: () => void   // skip / no root causes
  onNext: (id: string) => void  // proceed to complexity matrix
}

function flattenCauseTree(nodes: CauseNode[]): CauseNode[] {
  return nodes.flatMap(n => [n, ...flattenCauseTree(n.children)])
}

function updateSolutions(causes: CauseNode[], nodeId: string, solutions: Solution[]): CauseNode[] {
  return causes.map(c => ({
    ...c,
    solutions: c.id === nodeId ? solutions : c.solutions,
    children: updateSolutions(c.children, nodeId, solutions),
  }))
}

function canSaveSolutions(rootCauses: CauseNode[], solutionsMap: Map<string, Solution[]>): boolean {
  return rootCauses.length > 0 && rootCauses.every(rc => (solutionsMap.get(rc.id) ?? []).length > 0)
}

export default function SolveProblem({ id, onDone, onNext }: Props) {
  const problem = getProblems().find(p => p.id === id) ?? null

  const rootCauses = problem
    ? flattenCauseTree(problem.causes).filter(n => n.isActionableRootCause)
    : []

  // Local state: solutions per cause id — preserve existing matrixX/Y
  const [solutionsMap, setSolutionsMap] = useState<Map<string, Solution[]>>(() => {
    const map = new Map<string, Solution[]>()
    rootCauses.forEach(rc => map.set(rc.id, rc.solutions ?? []))
    return map
  })

  const [inputs, setInputs] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>()
    rootCauses.forEach(rc => map.set(rc.id, ''))
    return map
  })

  const inputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map())

  if (!problem) {
    return (
      <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center z-10">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Problem not found.</p>
          <button onClick={onDone} className="text-indigo-600 text-sm underline">← Home</button>
        </div>
      </div>
    )
  }

  function addSolution(causeId: string) {
    const text = (inputs.get(causeId) ?? '').trim()
    if (!text) return
    setSolutionsMap(prev => {
      const next = new Map(prev)
      next.set(causeId, [...(next.get(causeId) ?? []), { text }])
      return next
    })
    setInputs(prev => { const n = new Map(prev); n.set(causeId, ''); return n })
    setTimeout(() => inputRefs.current.get(causeId)?.focus(), 30)
  }

  function removeSolution(causeId: string, idx: number) {
    setSolutionsMap(prev => {
      const next = new Map(prev)
      const list = [...(next.get(causeId) ?? [])]
      list.splice(idx, 1)
      next.set(causeId, list)
      return next
    })
  }

  function saveSolutions() {
    if (!problem || !canSaveSolutions(rootCauses, solutionsMap)) return
    let causes = problem.causes
    // Clear matrixX/Y when text changes (new or removed solutions reset placement)
    solutionsMap.forEach((solutions, causeId) => {
      // Preserve matrixX/Y for solutions that still exist by text match
      const prior = rootCauses.find(rc => rc.id === causeId)?.solutions ?? []
      const positioned = solutions.map(s => {
        const match = prior.find(p => p.text === s.text)
        return match
          ? {
              ...s,
              text: s.text,
              matrixX: match.matrixX,
              matrixY: match.matrixY,
              applying: match.applying,
              applyingSteps: match.applyingSteps,
            }
          : { ...s, text: s.text }
      })
      causes = updateSolutions(causes, causeId, positioned)
    })
    updateProblem(id, { id: problem.id, description: problem.description, causes, createdAt: problem.createdAt })
    onNext(id)
  }

  return (
    <div className="fixed inset-4 bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10">
      <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-sky-500 text-white px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Solutions</h2>
            <p className="text-sm text-slate-100/80 truncate">{problem.description}</p>
          </div>
          <div className="rounded-3xl bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/90">
            Add solutions for root causes
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="grid gap-6">
          {rootCauses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-slate-500 text-sm text-center">
                No root causes are marked yet.<br />
                Go back and mark at least one node as a root cause.
              </p>
              <button onClick={onDone} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
                Skip → Home
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {rootCauses.map(rc => {
                const sols = solutionsMap.get(rc.id) ?? []
                const inputVal = inputs.get(rc.id) ?? ''
                return (
                  <div key={rc.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.16em] text-amber-700 font-semibold">Root Cause</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{rc.text}</p>
                      </div>
                      <div className="text-xs text-slate-500">Add solutions below and keep them focused.</div>
                    </div>

                    {sols.length > 0 && (
                      <ul className="space-y-2 mb-4">
                        {sols.map((sol, i) => (
                          <li key={i} className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                            <span className="flex-1 text-sm text-slate-700">{sol.text}</span>
                            <button onClick={() => removeSolution(rc.id, i)} className="text-slate-400 hover:text-slate-700 text-xs mt-0.5 transition-colors shrink-0" title="Remove">✕</button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        ref={el => { inputRefs.current.set(rc.id, el) }}
                        value={inputVal}
                        onChange={e => setInputs(prev => { const n = new Map(prev); n.set(rc.id, e.target.value); return n })}
                        onKeyDown={e => e.key === 'Enter' && addSolution(rc.id)}
                        placeholder="Add a solution…"
                        className="flex-1 border border-slate-300 rounded-3xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
                      />
                      <button onClick={() => addSolution(rc.id)} disabled={!inputVal.trim()} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-3xl transition-all duration-200">Add</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {rootCauses.length > 0 && (
        <div className="shrink-0 flex flex-col gap-3 px-6 py-4 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={onDone} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Skip for now</button>
          <button
            onClick={saveSolutions}
            disabled={!canSaveSolutions(rootCauses, solutionsMap)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-3xl transition-all duration-200"
          >
            Save Solutions →
          </button>
        </div>
      )}
    </div>
  )
}
