import type { CauseNode } from '../types'

type PlacedSolution = {
  key: string
  text: string
  matrixX: number
  matrixY: number
}

function flattenCauseTree(nodes: CauseNode[]): CauseNode[] {
  return nodes.flatMap(n => [n, ...flattenCauseTree(n.children)])
}

function quadrantColor(x: number, y: number): string {
  if (x < 0.5 && y < 0.5) return 'bg-yellow-300 border-yellow-400'
  if (x >= 0.5 && y < 0.5) return 'bg-gray-300 border-gray-400'
  if (x < 0.5 && y >= 0.5) return 'bg-green-300 border-green-400'
  return 'bg-white border-gray-300'
}

const STICKY_W = 140
const STICKY_H = 80

type Props = {
  causes: CauseNode[]
}

export default function ComplexityMatrixView({ causes }: Props) {
  const all: PlacedSolution[] = flattenCauseTree(causes)
    .filter(n => n.isActionableRootCause)
    .flatMap(rc =>
      (rc.solutions ?? [])
        .filter(s => s.matrixX !== undefined && s.matrixY !== undefined)
        .map((s, i) => ({
          key: `${rc.id}:${i}`,
          text: s.text ?? 'Untitled solution',
          matrixX: s.matrixX!,
          matrixY: s.matrixY!,
        }))
    )

  if (all.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Complexity Matrix</h3>
      <div className="rounded-[1.75rem] border border-slate-200 shadow-sm bg-white overflow-visible p-6">
        <p className="text-xs text-slate-500 mb-4">Drag-and-drop positions are saved by effort (horizontal) and impact (vertical).</p>
        <div className="flex justify-center">
          <div className="relative border-2 border-slate-300 rounded-lg" style={{ width: 1200, height: 840, minWidth: 1200, minHeight: 840 }}>
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
              <div className="border-r border-b border-slate-200 bg-amber-50/70" />
              <div className="border-b border-slate-200 bg-slate-100/60" />
              <div className="border-r border-slate-200 bg-emerald-50/70" />
              <div className="bg-white" />
            </div>

            {/* Labels */}
            <span className="absolute left-4 top-4 text-[10px] font-bold text-amber-700 uppercase tracking-wide">Quick Win</span>
            <span className="absolute right-4 top-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Major Project</span>
            <span className="absolute left-4 bottom-4 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Fill-in</span>
            <span className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-500 uppercase tracking-wide">Thankless</span>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300" />
            </div>

            {/* Stickies */}
            {all.map(s => {
              const colour = quadrantColor(s.matrixX, s.matrixY)
              return (
                <div
                  key={s.key}
                  style={{
                    position: 'absolute',
                    left: `calc(${s.matrixX * 100}% - ${STICKY_W / 2}px)`,
                    top: `calc(${s.matrixY * 100}% - ${STICKY_H / 2}px)`,
                    width: STICKY_W,
                    height: STICKY_H,
                  }}
                  className={`rounded-2xl border-2 shadow-sm flex items-center justify-center px-3 py-2 text-center text-[11px] font-semibold tracking-tight leading-snug break-words whitespace-normal ${colour}`}
                >
                  {s.text || 'Untitled solution'}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
