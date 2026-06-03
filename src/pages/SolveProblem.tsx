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
    if (!problem) return
    let causes = problem.causes
    // Clear matrixX/Y when text changes (new or removed solutions reset placement)
    solutionsMap.forEach((solutions, causeId) => {
      // Preserve matrixX/Y for solutions that still exist by text match
      const prior = rootCauses.find(rc => rc.id === causeId)?.solutions ?? []
      const positioned = solutions.map(s => {
        const match = prior.find(p => p.text === s.text)
        return match
          ? { ...s, text: s.text, matrixX: match.matrixX, matrixY: match.matrixY }
          : { ...s, text: s.text }
      })
      causes = updateSolutions(causes, causeId, positioned)
    })
    updateProblem(id, { id: problem.id, description: problem.description, causes, createdAt: problem.createdAt })
    onNext(id)
  }

  return (
    <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-10">
      <div className="shrink-0 px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Solutions</h2>
        <p className="text-sm text-gray-400 mt-0.5 truncate">{problem.description}</p>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6">
        {rootCauses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-gray-400 text-sm text-center">
              No root causes are marked yet.<br />
              Go back and mark at least one node as a root cause.
            </p>
            <button onClick={onDone} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              Skip → Home
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {rootCauses.map(rc => {
              const sols = solutionsMap.get(rc.id) ?? []
              const inputVal = inputs.get(rc.id) ?? ''
              return (
                <div key={rc.id}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">Root Cause</span>
                    <span className="text-gray-800 font-medium text-sm">{rc.text}</span>
                  </div>

                  {sols.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {sols.map((sol, i) => (
                        <li key={i} className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                          <span className="flex-1 text-sm text-indigo-900">{sol.text}</span>
                          <button onClick={() => removeSolution(rc.id, i)} className="text-indigo-300 hover:text-indigo-600 text-xs mt-0.5 transition-colors shrink-0" title="Remove">✕</button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex gap-2">
                    <input
                      ref={el => { inputRefs.current.set(rc.id, el) }}
                      value={inputVal}
                      onChange={e => setInputs(prev => { const n = new Map(prev); n.set(rc.id, e.target.value); return n })}
                      onKeyDown={e => e.key === 'Enter' && addSolution(rc.id)}
                      placeholder="Add a solution…"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button onClick={() => addSolution(rc.id)} disabled={!inputVal.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors">Add</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rootCauses.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button onClick={onDone} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Skip for now</button>
          <button onClick={saveSolutions} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">Save Solutions →</button>
        </div>
      )}
    </div>
  )
}
