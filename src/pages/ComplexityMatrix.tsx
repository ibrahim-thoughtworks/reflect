import { useRef, useState, useCallback } from 'react'
import { getProblems, updateProblem } from '../store/problems'
import type { CauseNode, Solution } from '../types'

// ─── types ────────────────────────────────────────────────────────────────────
type PlacedSolution = {
  key: string       // `${causeId}:${idx}`
  causeId: string
  idx: number
  text: string
  matrixX?: number  // 0-1 normalised
  matrixY?: number
}

type DragState = {
  key: string
  startPointerX: number
  startPointerY: number
  // offset of pointer within the sticky card
  offsetX: number
  offsetY: number
}

type Props = {
  id: string
  onDone: (id: string) => void  // navigate to detail
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function flattenCauseTree(nodes: CauseNode[]): CauseNode[] {
  return nodes.flatMap(n => [n, ...flattenCauseTree(n.children)])
}

function quadrantColor(x: number, y: number): string {
  if (x < 0.5 && y < 0.5) return 'bg-yellow-300 border-yellow-400'   // Quick Win
  if (x >= 0.5 && y < 0.5) return 'bg-gray-300 border-gray-400'      // Major Project
  if (x < 0.5 && y >= 0.5) return 'bg-green-300 border-green-400'    // Fill-in
  return 'bg-white border-gray-300'                                    // Thankless
}

function updateDeep(causes: CauseNode[], causeId: string, newSolutions: Solution[]): CauseNode[] {
  return causes.map(c => ({
    ...c,
    solutions: c.id === causeId ? newSolutions : c.solutions,
    children: updateDeep(c.children, causeId, newSolutions),
  }))
}

const STICKY_W = 120
const STICKY_H = 68

// ─── component ────────────────────────────────────────────────────────────────
export default function ComplexityMatrix({ id, onDone }: Props) {
  const problem = getProblems().find(p => p.id === id) ?? null
  const matrixRef = useRef<HTMLDivElement>(null)

  // Build flat list of all solutions across all root causes
  const buildSolutions = (): PlacedSolution[] => {
    if (!problem) return []
    return flattenCauseTree(problem.causes)
      .filter(n => n.isActionableRootCause)
      .flatMap(rc =>
        (rc.solutions ?? []).map((s, i) => ({
          key: `${rc.id}:${i}`,
          causeId: rc.id,
          idx: i,
          text: s.text,
          matrixX: s.matrixX,
          matrixY: s.matrixY,
        }))
      )
  }

  const [solutions, setSolutions] = useState<PlacedSolution[]>(buildSolutions)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 })

  const placed = solutions.filter(s => s.matrixX !== undefined)
  const unplaced = solutions.filter(s => s.matrixX === undefined)
  const allPlaced = unplaced.length === 0

  // ── drag handlers ──
  function startDrag(key: string, e: React.PointerEvent, offsetX = STICKY_W / 2, offsetY = STICKY_H / 2) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ key, startPointerX: e.clientX, startPointerY: e.clientY, offsetX, offsetY })
    setPointerPos({ x: e.clientX, y: e.clientY })
  }

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag) return
    setPointerPos({ x: e.clientX, y: e.clientY })
  }, [drag])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag || !matrixRef.current) { setDrag(null); return }

    const rect = matrixRef.current.getBoundingClientRect()
    const dropX = e.clientX - drag.offsetX - rect.left + STICKY_W / 2
    const dropY = e.clientY - drag.offsetY - rect.top + STICKY_H / 2
    const normX = Math.max(0, Math.min(1, dropX / rect.width))
    const normY = Math.max(0, Math.min(1, dropY / rect.height))

    const inside = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top  && e.clientY <= rect.bottom

    if (inside) {
      setSolutions(prev => prev.map(s =>
        s.key === drag.key ? { ...s, matrixX: normX, matrixY: normY } : s
      ))
    }
    setDrag(null)
  }, [drag])

  function saveMatrix() {
    if (!problem || !allPlaced) return
    let causes = problem.causes
    // Group solutions back by causeId
    const byId = new Map<string, { idx: number; s: PlacedSolution }[]>()
    solutions.forEach(s => {
      if (!byId.has(s.causeId)) byId.set(s.causeId, [])
      byId.get(s.causeId)!.push({ idx: s.idx, s })
    })
    byId.forEach((items, causeId) => {
      const causeNode = flattenCauseTree(problem.causes).find(n => n.id === causeId)
      if (!causeNode) return
      const prior = causeNode.solutions ?? []
      const updated: Solution[] = prior.map((sol, i) => {
        const item = items.find(it => it.idx === i)
        return item
          ? { text: sol.text, matrixX: item.s.matrixX, matrixY: item.s.matrixY }
          : sol
      })
      causes = updateDeep(causes, causeId, updated)
    })
    updateProblem(id, { ...problem, causes })
    onDone(id)
  }

  if (!problem) {
    return (
      <div className="fixed inset-4 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center z-10">
        <p className="text-gray-400">Problem not found.</p>
      </div>
    )
  }

  const draggedSolution = drag ? solutions.find(s => s.key === drag.key) : null
  const dragX = pointerPos.x - (drag?.offsetX ?? 0)
  const dragY = pointerPos.y - (drag?.offsetY ?? 0)

  return (
    <div
      className="fixed inset-4 bg-gray-50 rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden z-10"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDrag(null)}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Complexity Matrix</h2>
          <p className="text-xs text-gray-400 truncate">{problem.description}</p>
        </div>
        <button
          onClick={saveMatrix}
          disabled={!allPlaced}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {allPlaced ? 'Save →' : `Place all (${unplaced.length} left)`}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden gap-3 p-4">
        {/* Quadrant matrix */}
        <div
          ref={matrixRef}
          className="flex-1 relative bg-white rounded-xl border border-gray-200 shadow-sm select-none"
        >
          {/* Quadrant labels */}
          <span className="absolute left-3 top-3 text-[10px] font-bold text-yellow-600 uppercase tracking-wide">Quick Win</span>
          <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Major Project</span>
          <span className="absolute left-3 bottom-3 text-[10px] font-bold text-green-600 uppercase tracking-wide">Fill-in</span>
          <span className="absolute right-3 bottom-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Thankless</span>

          {/* Axis labels */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[9px] text-gray-300 font-medium">Low Effort ←→ High Effort</div>
          <div className="absolute top-1/2 -translate-y-1/2 -left-7 text-[9px] text-gray-300 font-medium" style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}>High Impact ↑ Low Impact</div>

          {/* Dividing lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />

          {/* Placed stickies */}
          {placed.map(s => {
            if (drag?.key === s.key) return null  // rendered as ghost during drag
            const left = (s.matrixX ?? 0.5) * 100
            const top = (s.matrixY ?? 0.5) * 100
            const colour = quadrantColor(s.matrixX ?? 0.5, s.matrixY ?? 0.5)
            return (
              <div
                key={s.key}
                onPointerDown={e => startDrag(s.key, e, STICKY_W / 2, STICKY_H / 2)}
                style={{
                  position: 'absolute',
                  left: `calc(${left}% - ${STICKY_W / 2}px)`,
                  top: `calc(${top}% - ${STICKY_H / 2}px)`,
                  width: STICKY_W,
                  height: STICKY_H,
                }}
                className={`cursor-grab active:cursor-grabbing rounded-lg border-2 shadow-sm flex items-center justify-center p-1.5 text-center text-[10px] font-medium text-gray-700 leading-tight ${colour}`}
              >
                {s.text}
              </div>
            )
          })}
        </div>

        {/* Right side panel — unplaced stickies */}
        <div className="w-44 shrink-0 flex flex-col gap-2 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold px-1">
            {unplaced.length > 0 ? `Drag to place (${unplaced.length})` : '✓ All placed'}
          </p>
          {unplaced.map(s => (
            <div
              key={s.key}
              onPointerDown={e => startDrag(s.key, e, STICKY_W / 2, STICKY_H / 2)}
              style={{ height: STICKY_H }}
              className="cursor-grab active:cursor-grabbing w-full bg-amber-50 border-2 border-amber-200 rounded-lg shadow-sm flex items-center justify-center p-2 text-[10px] font-medium text-gray-700 leading-tight text-center select-none"
            >
              {s.text}
            </div>
          ))}
        </div>
      </div>

      {/* Drag ghost */}
      {drag && draggedSolution && (
        <div
          style={{
            position: 'fixed',
            left: dragX,
            top: dragY,
            width: STICKY_W,
            height: STICKY_H,
            pointerEvents: 'none',
            zIndex: 50,
          }}
          className="rounded-lg border-2 border-indigo-400 bg-indigo-50 shadow-xl flex items-center justify-center p-1.5 text-center text-[10px] font-medium text-indigo-700 leading-tight opacity-90"
        >
          {draggedSolution.text}
        </div>
      )}
    </div>
  )
}
