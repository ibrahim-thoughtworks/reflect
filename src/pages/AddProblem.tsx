import { useState } from 'react'
import CauseTreeEditor from '../components/CauseTreeEditor'
import type { EditorNode } from '../components/CauseTreeEditor'
import { saveProblem } from '../store/problems'
import type { CauseNode } from '../types'

type Phase = 'describe' | 'causes'

type Props = {
  onDone: () => void
  onCancel: () => void
}

function newId() { return Math.random().toString(36).slice(2) }

function buildCauseTree(nodes: EditorNode[]): CauseNode[] {
  function build(parentId: string | null): CauseNode[] {
    return nodes
      .filter(n => n.parentId === parentId)
      .map(n => ({
        id: n.id,
        text: n.text,
        isActionableRootCause: n.isActionableRootCause,
        children: build(n.id),
      }))
  }
  return build(null)
}

export default function AddProblem({ onDone, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('describe')
  const [description, setDescription] = useState('')

  function handleSave(nodes: EditorNode[]) {
    saveProblem({
      id: newId(),
      description,
      causes: buildCauseTree(nodes),
      createdAt: Date.now(),
    })
    onDone()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 w-full p-8 ${phase === 'causes' ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {phase === 'describe' ? "What's the problem?" : 'Map the causes'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>

        {phase === 'describe' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the problem
              </label>
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
        )}

        {phase === 'causes' && (
          <CauseTreeEditor description={description} onSave={handleSave} />
        )}
      </div>
    </div>
  )
}
