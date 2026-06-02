import { useState } from 'react'

export type WizardNode = {
  id: string
  text: string
  parentId: string | null
  depth: number
}

type Props = {
  description: string
  nodes: WizardNode[]
  onSave: (rootCauseIds: Set<string>) => void
}

// Returns nodes in DFS pre-order for display.
function flattenDFS(nodes: WizardNode[]): WizardNode[] {
  const result: WizardNode[] = []
  function visit(parentId: string | null) {
    nodes.filter((n) => n.parentId === parentId).forEach((n) => {
      result.push(n)
      visit(n.id)
    })
  }
  visit(null)
  return result
}

export default function RootCauseSelector({ description, nodes, onSave }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const ordered = flattenDFS(nodes)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Problem context */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
        <p className="text-xs text-indigo-400 mb-0.5 font-medium uppercase tracking-wide">Problem</p>
        <p className="text-sm text-indigo-800 font-medium">{description}</p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-800 mb-1">
          Select actionable root causes
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Check the causes you can act on. You can select any at any level.
        </p>

        {ordered.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No causes were recorded — you can still save the problem.
          </p>
        ) : (
          <ul className="space-y-2">
            {ordered.map((node) => {
              const indent = (node.depth - 1) * 20
              const isChecked = selected.has(node.id)
              return (
                <li key={node.id} style={{ paddingLeft: indent }}>
                  <label
                    className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(node.id)}
                      className="mt-0.5 h-4 w-4 accent-amber-500 shrink-0"
                    />
                    <span className={`text-sm ${isChecked ? 'text-amber-800 font-medium' : 'text-gray-700'}`}>
                      {node.text}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <button
        onClick={() => onSave(selected)}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Save Problem
      </button>
    </div>
  )
}
