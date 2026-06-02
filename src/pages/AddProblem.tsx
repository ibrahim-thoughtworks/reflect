import { useState } from 'react'
import WhyStep from '../components/WhyStep'

const MAX_DEPTH = 5

// Flat node used during the wizard; tree is built at save time.
type WizardNode = {
  id: string
  text: string
  parentId: string | null
  depth: number // 1 = direct child of problem, up to MAX_DEPTH
}

type Phase = 'describe' | 'whyCauses' | 'selectRootCauses'

type WizardState = {
  description: string
  nodes: WizardNode[]
  // IDs of nodes whose causes still need to be collected, in DFS order (front = next).
  pendingStack: string[]
  // null = asking about the problem itself; otherwise an id in nodes.
  currentTargetId: string | null
  hasAddedChild: boolean
  currentInput: string
}

type Props = {
  onDone: () => void
  onCancel: () => void
}

function getDepth(nodes: WizardNode[], targetId: string | null): number {
  if (!targetId) return 0
  return nodes.find((n) => n.id === targetId)!.depth
}

function getBreadcrumb(nodes: WizardNode[], targetId: string | null, description: string): string[] {
  if (!targetId) return [description]
  const path: string[] = []
  let id: string | null = targetId
  while (id !== null) {
    const node = nodes.find((n) => n.id === id)!
    path.unshift(node.text)
    id = node.parentId
  }
  return [description, ...path]
}

function nextId(): string {
  return Math.random().toString(36).slice(2)
}

export default function AddProblem({ onDone, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('describe')
  const [wizard, setWizard] = useState<WizardState>({
    description: '',
    nodes: [],
    pendingStack: [],
    currentTargetId: null,
    hasAddedChild: false,
    currentInput: '',
  })

  function startWhys() {
    setPhase('whyCauses')
    setWizard((w) => ({ ...w, currentTargetId: null, hasAddedChild: false, currentInput: '' }))
  }

  function handleNext() {
    const text = wizard.currentInput.trim()
    if (!text) return
    const childDepth = getDepth(wizard.nodes, wizard.currentTargetId) + 1
    const newNode: WizardNode = {
      id: nextId(),
      text,
      parentId: wizard.currentTargetId,
      depth: childDepth,
    }
    setWizard((w) => ({
      ...w,
      nodes: [...w.nodes, newNode],
      hasAddedChild: true,
      currentInput: '',
    }))
  }

  function handleSkipOrDone() {
    setWizard((w) => {
      // Collect children of current target added so far, eligible for DFS (depth < MAX_DEPTH).
      const children = w.nodes.filter(
        (n) => n.parentId === w.currentTargetId && n.depth < MAX_DEPTH,
      )
      // Push children to front of stack in reverse order so first child is visited first.
      const newFront = [...children].reverse().map((c) => c.id)
      const newStack = [...newFront, ...w.pendingStack]

      if (newStack.length === 0) {
        // All branches exhausted — move to root cause selection.
        setPhase('selectRootCauses')
        return { ...w, pendingStack: [], currentInput: '', hasAddedChild: false }
      }

      const [next, ...rest] = newStack
      return {
        ...w,
        pendingStack: rest,
        currentTargetId: next,
        hasAddedChild: false,
        currentInput: '',
      }
    })
  }

  // When phase transitions to selectRootCauses we need to call setPhase from outside setWizard.
  // Use a side-effect-free check after state settles.
  // (Phase is set inside handleSkipOrDone via closure — we call setPhase directly there.)

  const breadcrumb = getBreadcrumb(wizard.nodes, wizard.currentTargetId, wizard.description)

  if (phase === 'selectRootCauses') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
          <p className="text-gray-500 text-sm">Root cause selection — coming soon (Task 6)</p>
          <button onClick={onDone} className="mt-4 text-sm text-indigo-600 underline">
            Go home (temporary)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {phase === 'describe' ? "What's the problem?" : 'Five Whys'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Phase: describe */}
        {phase === 'describe' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the problem
              </label>
              <textarea
                autoFocus
                rows={4}
                value={wizard.description}
                onChange={(e) => setWizard((w) => ({ ...w, description: e.target.value }))}
                placeholder="e.g. I struggle to finish books I start"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <button
              onClick={startWhys}
              disabled={wizard.description.trim() === ''}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start 5 Whys →
            </button>
          </div>
        )}

        {/* Phase: whyCauses */}
        {phase === 'whyCauses' && (
          <WhyStep
            breadcrumb={breadcrumb}
            isFirstCause={!wizard.hasAddedChild}
            value={wizard.currentInput}
            onChange={(v) => setWizard((w) => ({ ...w, currentInput: v }))}
            onNext={handleNext}
            onSkip={handleSkipOrDone}
          />
        )}
      </div>
    </div>
  )
}
