import { useState } from 'react'
import CauseTreeEditor from '../components/CauseTreeEditor'
import type { EditorNode } from '../components/CauseTreeEditor'
import { saveProblem, updateProblem } from '../store/problems'
import { causeTreeToEditorNodes } from '../lib/causeTreeToEditorNodes'
import type { CauseNode, Problem, Solution } from '../types'

type Phase = 'describe' | 'causes'

type Props = {
  onSave: (id: string) => void   // called with the saved problem id → navigate to solve
  onCancel: () => void
  existingProblem?: Problem       // if set, edit mode
}

function newId() { return Math.random().toString(36).slice(2) }

function flattenCauses(causes: CauseNode[]): CauseNode[] {
  return causes.flatMap(c => [c, ...flattenCauses(c.children)])
}

// Rebuild a CauseNode tree from editor nodes, carrying solutions forward from
// the prior saved tree so that editing causes doesn't wipe solutions.
function buildCauseTree(nodes: EditorNode[], priorCauses?: CauseNode[]): CauseNode[] {
  const solutionsById = new Map<string, Solution[]>()
  if (priorCauses) {
    flattenCauses(priorCauses).forEach(c => {
      if (c.solutions?.length) solutionsById.set(c.id, c.solutions)
    })
  }

  function build(parentId: string | null): CauseNode[] {
    return nodes
      .filter(n => n.parentId === parentId)
      .map(n => ({
        id: n.id,
        text: n.text,
        isActionableRootCause: n.isActionableRootCause,
        children: n.linkedToId ? [] : build(n.id),
        ...(n.groupId ? { groupId: n.groupId } : {}),
        ...(n.linkedToId ? { linkedToId: n.linkedToId } : {}),
        ...(solutionsById.has(n.id)
          ? { solutions: solutionsById.get(n.id)?.map(sol => ({ ...sol })) }
          : {}),
      }))
  }
  return build(null)
}

export default function AddProblem({ onSave, onCancel, existingProblem }: Props) {
  const isEditing = !!existingProblem

  // Edit mode: start directly in causes phase with pre-loaded data
  const [phase, setPhase] = useState<Phase>(isEditing ? 'causes' : 'describe')
  const [description, setDescription] = useState(existingProblem?.description ?? '')

  function handleSave(nodes: EditorNode[]) {
    const causes = buildCauseTree(nodes, existingProblem?.causes)
    if (isEditing) {
      const updated = { ...existingProblem!, description, causes }
      updateProblem(existingProblem!.id, updated)
      onSave(existingProblem!.id)
    } else {
      const id = newId()
      saveProblem({ id, description, causes, createdAt: Date.now() })
      onSave(id)
    }
  }

  // ── Describe phase ─────────────────────────────────────────────────────────
  if (phase === 'describe') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 w-full max-w-xl p-10">
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-600 font-semibold">Reflect</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900">What's the problem you want to solve?</h2>
            </div>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Describe the problem</label>
              <textarea
                autoFocus
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. I struggle to finish books I start"
                className="w-full border border-slate-300 rounded-3xl px-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none shadow-sm"
              />
            </div>
            <button
              onClick={() => setPhase('causes')}
              disabled={description.trim() === ''}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-3xl shadow-lg transition-all duration-200"
            >
              Map causes →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Causes phase ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-4 bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10">
      <div className="shrink-0 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 text-indigo-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">Cause map</div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEditing ? 'Edit causes' : 'Map the causes'}
            </h2>
            {isEditing && (
              <button
                onClick={() => setPhase('describe')}
                className="text-xs text-indigo-500 hover:text-indigo-700 underline transition-colors"
              >
                Edit description
              </button>
            )}
          </div>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
          Cancel
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
          <CauseTreeEditor
            description={description}
            onSave={handleSave}
            initialNodes={isEditing ? causeTreeToEditorNodes(existingProblem!.causes) : undefined}
          />
        </div>
      </div>
    </div>
  )
}
