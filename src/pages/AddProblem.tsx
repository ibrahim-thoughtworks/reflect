import { useState } from 'react'
import CauseTreeEditor from '../components/CauseTreeEditor'
import type { EditorNode } from '../components/CauseTreeEditor'
import { saveProblem, updateProblem } from '../store/problems'
import { causeTreeToEditorNodes } from '../lib/causeTreeToEditorNodes'
import type { CauseNode, Problem } from '../types'

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
  const solutionsById = new Map<string, string[]>()
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
        ...(solutionsById.has(n.id) ? { solutions: solutionsById.get(n.id) } : {}),
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-gray-800">What's the problem?</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
              Cancel
            </button>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Describe the problem</label>
              <textarea
                autoFocus
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. I struggle to finish books I start"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <button
              onClick={() => setPhase('causes')}
              disabled={description.trim() === ''}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
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
    <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-10">
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
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
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Cancel
        </button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <CauseTreeEditor
          description={description}
          onSave={handleSave}
          initialNodes={isEditing ? causeTreeToEditorNodes(existingProblem!.causes) : undefined}
        />
      </div>
    </div>
  )
}
