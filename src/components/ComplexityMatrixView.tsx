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

const STICKY_W = 112
const STICKY_H = 64

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
          text: s.text,
          matrixX: s.matrixX!,
          matrixY: s.matrixY!,
        }))
    )

  if (all.length === 0) return null

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Complexity Matrix</h3>
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-sm" style={{ height: 320 }}>
        {/* Labels */}
        <span className="absolute left-3 top-3 text-[10px] font-bold text-yellow-600 uppercase tracking-wide">Quick Win</span>
        <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Major Project</span>
        <span className="absolute left-3 bottom-3 text-[10px] font-bold text-green-600 uppercase tracking-wide">Fill-in</span>
        <span className="absolute right-3 bottom-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Thankless</span>

        {/* Dividers */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />

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
              className={`rounded-lg border-2 shadow-sm flex items-center justify-center p-1.5 text-center text-[10px] font-medium text-gray-700 leading-tight ${colour}`}
            >
              {s.text}
            </div>
          )
        })}
      </div>
    </div>
  )
}
