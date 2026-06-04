import { useMemo, useState } from 'react'
import { getProblems, updateProblem } from '../store/problems'
import type { CauseNode } from '../types'

type Props = {
  id: string
  onDone: (id: string) => void
  onBack: (id: string) => void
}

type ApplyingSolution = {
  key: string
  causeId: string
  solutionIndex: number
  text: string
  causeText: string
  applying: boolean
  applyingSteps: string[]
}

function flattenCauseTree(nodes: CauseNode[]): CauseNode[] {
  return nodes.flatMap(n => [n, ...flattenCauseTree(n.children)])
}

export default function ApplyingSteps({ id, onDone, onBack }: Props) {
  const problem = getProblems().find(p => p.id === id) ?? null

  const applyingSolutions = useMemo<ApplyingSolution[]>(() => {
    if (!problem) return []
    return flattenCauseTree(problem.causes)
      .flatMap(rc => (rc.solutions ?? []).map((sol, idx) => ({
        key: `${rc.id}:${idx}`,
        causeId: rc.id,
        solutionIndex: idx,
        text: sol.text ?? 'Untitled solution',
        causeText: rc.text,
        applying: !!sol.applying,
        applyingSteps: sol.applying && sol.applyingSteps ? [...sol.applyingSteps] : [],
      })))
      .filter(sol => sol.applying)
  }, [problem])

  const [selectedKey, setSelectedKey] = useState<string | null>(applyingSolutions[0]?.key ?? null)
  const [stepsMap, setStepsMap] = useState<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>()
    applyingSolutions.forEach(sol => map.set(sol.key, [...sol.applyingSteps]))
    return map
  })

  const selectedSolution = applyingSolutions.find(sol => sol.key === selectedKey) ?? applyingSolutions[0] ?? null
  const selectedSteps = selectedSolution ? stepsMap.get(selectedSolution.key) ?? [] : []

  function updateSteps(key: string, nextSteps: string[]) {
    setStepsMap(prev => {
      const next = new Map(prev)
      next.set(key, nextSteps)
      return next
    })
  }

  function addStep() {
    if (!selectedSolution) return
    const next = [...selectedSteps, '']
    updateSteps(selectedSolution.key, next)
  }

  function setStepText(index: number, text: string) {
    if (!selectedSolution) return
    const next = [...selectedSteps]
    next[index] = text
    updateSteps(selectedSolution.key, next)
  }

  function removeStep(index: number) {
    if (!selectedSolution) return
    const next = [...selectedSteps]
    next.splice(index, 1)
    updateSteps(selectedSolution.key, next)
  }

  function moveStep(index: number, direction: 'up' | 'down') {
    if (!selectedSolution) return
    const next = [...selectedSteps]
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    const temp = next[target]
    next[target] = next[index]
    next[index] = temp
    updateSteps(selectedSolution.key, next)
  }

  function saveApplyingSteps() {
    if (!problem) return
    const updateNodes = (nodes: CauseNode[]): CauseNode[] => {
      return nodes.map(node => ({
        ...node,
        solutions: node.solutions?.map((sol, solutionIndex) => {
          const key = `${node.id}:${solutionIndex}`
          if (!sol.applying) {
            const { applyingSteps, ...rest } = sol
            return rest
          }
          const steps = stepsMap.get(key) ?? []
          return {
            ...sol,
            applyingSteps: steps.filter(step => step.trim() !== ''),
          }
        }),
        children: updateNodes(node.children),
      }))
    }

    updateProblem(id, { ...problem, causes: updateNodes(problem.causes) })
    onDone(id)
  }

  if (!problem) {
    return (
      <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center z-10">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Problem not found.</p>
          <button onClick={() => onBack(id)} className="text-indigo-600 text-sm underline">
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-4 bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10">
      <div className="shrink-0 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div>
          <button onClick={() => onBack(id)} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back</button>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Applying steps</h2>
          <p className="mt-1 text-sm text-slate-500">Define implementation steps for each selected solution.</p>
        </div>
        <button
          onClick={saveApplyingSteps}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-3xl shadow-lg transition-all duration-200"
          disabled={applyingSolutions.length === 0}
        >
          Save →
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        <div className="w-72 shrink-0 rounded-[2rem] bg-white border border-slate-200 shadow-sm overflow-auto">
          <div className="px-5 py-4 border-b border-slate-200">
            <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 font-semibold">Solutions</p>
            <p className="mt-2 text-sm text-slate-500">Select a solution to edit implementation steps.</p>
          </div>
          {applyingSolutions.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No applying solutions found. Mark solutions as applying in the Complexity Matrix first.</div>
          ) : (
            <div className="space-y-1 p-4">
              {applyingSolutions.map(sol => (
                <button
                  key={sol.key}
                  onClick={() => setSelectedKey(sol.key)}
                  className={`w-full text-left rounded-3xl px-4 py-3 transition-colors ${selectedKey === sol.key ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
                >
                  <div className="text-sm font-semibold truncate">{sol.text}</div>
                  <div className="mt-1 text-[11px] text-slate-500 truncate">{sol.causeText}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 rounded-[2rem] bg-white border border-slate-200 shadow-sm overflow-auto p-6">
          {selectedSolution ? (
            <>
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 font-semibold">Selected solution</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{selectedSolution.text}</h3>
                <p className="mt-1 text-sm text-slate-500">{selectedSolution.causeText}</p>
              </div>

              <div className="space-y-4">
                {selectedSteps.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                    No implementation steps yet. Add the first step below.
                  </div>
                ) : selectedSteps.map((step, index) => (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
                    <div>
                      <label className="text-xs uppercase tracking-[0.22em] text-slate-500">Step {index + 1}</label>
                      <input
                        value={step}
                        onChange={e => setStepText(index, e.target.value)}
                        placeholder="Describe this implementation step"
                        className="mt-2 w-full border border-slate-300 rounded-3xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                        className="rounded-3xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === selectedSteps.length - 1}
                        className="rounded-3xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeStep(index)}
                        className="rounded-3xl bg-white border border-slate-200 px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addStep}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Add Step
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              <p className="text-sm">Select an applying solution to define steps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
