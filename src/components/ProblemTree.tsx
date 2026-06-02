import type { CauseNode, Problem } from '../types'

const NODE_W = 184
const NODE_H = 80
const H_GAP = 28
const V_GAP = 64
const PAD = 40

type LayoutNode = {
  cause: CauseNode
  x: number      // horizontal centre
  y: number      // top edge
  sw: number     // subtree width
  children: LayoutNode[]
}

function subtreeW(node: CauseNode): number {
  if (node.children.length === 0) return NODE_W
  return (
    node.children.reduce((s, c) => s + subtreeW(c), 0) +
    (node.children.length - 1) * H_GAP
  )
}

function buildLayout(node: CauseNode, leftX: number, topY: number): LayoutNode {
  const sw = subtreeW(node)
  const centerX = leftX + sw / 2
  let childLeft = leftX
  const children = node.children.map((c) => {
    const cl = buildLayout(c, childLeft, topY + NODE_H + V_GAP)
    childLeft += subtreeW(c) + H_GAP
    return cl
  })
  return { cause: node, x: centerX, y: topY, sw, children }
}

function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  return nodes.flatMap((n) => [n, ...flattenLayout(n.children)])
}

function treeDepth(nodes: CauseNode[]): number {
  if (nodes.length === 0) return 0
  return 1 + Math.max(...nodes.map((n) => treeDepth(n.children)))
}

// Renders SVG connector lines between a parent centre and its children.
function Connectors({
  px,
  py,
  children,
}: {
  px: number
  py: number
  children: LayoutNode[]
}) {
  if (children.length === 0) return null
  const parentBottom = py + NODE_H
  const childTop = children[0].y
  const midY = (parentBottom + childTop) / 2

  return (
    <>
      {children.length === 1 ? (
        <line x1={px} y1={parentBottom} x2={children[0].x} y2={childTop} stroke="#cbd5e1" strokeWidth={1.5} />
      ) : (
        <>
          <line x1={px} y1={parentBottom} x2={px} y2={midY} stroke="#cbd5e1" strokeWidth={1.5} />
          <line
            x1={children[0].x} y1={midY}
            x2={children[children.length - 1].x} y2={midY}
            stroke="#cbd5e1" strokeWidth={1.5}
          />
          {children.map((c) => (
            <line key={c.cause.id} x1={c.x} y1={midY} x2={c.x} y2={childTop} stroke="#cbd5e1" strokeWidth={1.5} />
          ))}
        </>
      )}
      {children.map((c) => (
        <Connectors key={c.cause.id} px={c.x} py={c.y} children={c.children} />
      ))}
    </>
  )
}

export default function ProblemTree({ problem }: { problem: Problem }) {
  const { description, causes } = problem

  const rootsW =
    causes.length === 0
      ? NODE_W
      : causes.reduce((s, c) => s + subtreeW(c), 0) + (causes.length - 1) * H_GAP

  const problemX = PAD + rootsW / 2
  const problemY = PAD

  let childLeft = PAD
  const causeLayouts = causes.map((c) => {
    const cl = buildLayout(c, childLeft, PAD + NODE_H + V_GAP)
    childLeft += subtreeW(c) + H_GAP
    return cl
  })

  const depth = treeDepth(causes)
  const totalW = Math.max(rootsW + PAD * 2, NODE_W + PAD * 2)
  const totalH = PAD + (depth + 1) * NODE_H + depth * V_GAP + PAD

  const allCauses = flattenLayout(causeLayouts)

  return (
    <div className="overflow-auto pb-4">
      <div className="relative" style={{ width: totalW, height: totalH }}>
        {/* Connector lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalW}
          height={totalH}
        >
          {/* Problem → root-level causes */}
          {causes.length > 0 && (
            <Connectors px={problemX} py={problemY} children={causeLayouts} />
          )}
        </svg>

        {/* Problem node */}
        <div
          title={description}
          style={{ left: problemX - NODE_W / 2, top: problemY, width: NODE_W, height: NODE_H }}
          className="absolute rounded-xl bg-indigo-600 text-white px-3 py-2 flex items-center justify-center shadow-md"
        >
          <p className="text-xs font-semibold text-center line-clamp-3 leading-snug">
            {description}
          </p>
        </div>

        {/* Cause nodes */}
        {allCauses.map(({ cause, x, y }) => {
          const isRoot = cause.isActionableRootCause
          return (
            <div
              key={cause.id}
              title={cause.text}
              style={{ left: x - NODE_W / 2, top: y, width: NODE_W, height: NODE_H }}
              className={`absolute rounded-xl px-3 py-2 flex flex-col items-center justify-center shadow-sm border-2 transition-colors ${
                isRoot
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-white border-gray-200'
              }`}
            >
              <p
                className={`text-xs text-center line-clamp-3 leading-snug ${
                  isRoot ? 'text-amber-800 font-semibold' : 'text-gray-700'
                }`}
              >
                {cause.text}
              </p>
              {isRoot && (
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Root Cause
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
