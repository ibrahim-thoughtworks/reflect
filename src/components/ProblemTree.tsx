import { useEffect, useRef, useState } from 'react'
import type { CauseNode, Problem } from '../types'
import { groupColour, collectGroupIds } from '../lib/groupColours'

const NODE_W = 184
const NODE_H = 80
const H_GAP = 28
const V_GAP = 64
const PAD = 40

// ─── flat-tree helpers ────────────────────────────────────────────────────────
function flattenCauseTree(nodes: CauseNode[]): CauseNode[] {
  return nodes.flatMap(n => [n, ...flattenCauseTree(n.children)])
}

// For secondary nodes (linkedToId set), effective children come from the primary.
// Ghost-id prefix prevents key collisions when the same child appears twice.
function effectiveChildren(node: CauseNode, flat: CauseNode[], ghostPrefix: string): CauseNode[] {
  if (!node.linkedToId) return node.children
  const primary = flat.find(n => n.id === node.linkedToId)
  if (!primary) return []
  // Wrap children in ghost nodes to avoid duplicate React keys
  return primary.children.map(c => wrapGhost(c, ghostPrefix))
}

function wrapGhost(node: CauseNode, prefix: string): CauseNode {
  return {
    ...node,
    id: `${prefix}:${node.id}`,
    children: node.children.map(c => wrapGhost(c, prefix)),
  }
}

// ─── layout ───────────────────────────────────────────────────────────────────
type LayoutNode = {
  cause: CauseNode
  x: number
  y: number
  sw: number
  children: LayoutNode[]
}

function subtreeW(node: CauseNode, flat: CauseNode[], ghostPrefix: string): number {
  const kids = effectiveChildren(node, flat, ghostPrefix)
  if (kids.length === 0) return NODE_W
  return kids.reduce((s, c) => s + subtreeW(c, flat, ghostPrefix), 0) + (kids.length - 1) * H_GAP
}

function buildLayout(node: CauseNode, flat: CauseNode[], ghostPrefix: string, leftX: number, topY: number): LayoutNode {
  const sw = subtreeW(node, flat, ghostPrefix)
  const centerX = leftX + sw / 2
  const kids = effectiveChildren(node, flat, ghostPrefix)
  let childLeft = leftX
  const children = kids.map(c => {
    const cl = buildLayout(c, flat, ghostPrefix, childLeft, topY + NODE_H + V_GAP)
    childLeft += subtreeW(c, flat, ghostPrefix) + H_GAP
    return cl
  })
  return { cause: node, x: centerX, y: topY, sw, children }
}

function flattenLayout(nodes: LayoutNode[]): LayoutNode[] {
  return nodes.flatMap(n => [n, ...flattenLayout(n.children)])
}

function treeDepth(nodes: CauseNode[], flat: CauseNode[], ghostPrefix: string): number {
  if (nodes.length === 0) return 0
  return 1 + Math.max(...nodes.map(n => treeDepth(effectiveChildren(n, flat, ghostPrefix), flat, ghostPrefix)))
}

// ─── SVG connectors ───────────────────────────────────────────────────────────
function Connectors({ px, py, children }: { px: number; py: number; children: LayoutNode[] }) {
  if (children.length === 0) return null
  const pBottom = py + NODE_H
  const cTop = children[0].y
  const midY = (pBottom + cTop) / 2
  return (
    <>
      {children.length === 1 ? (
        <line x1={px} y1={pBottom} x2={children[0].x} y2={cTop} stroke="#cbd5e1" strokeWidth={1.5} />
      ) : (
        <>
          <line x1={px} y1={pBottom} x2={px} y2={midY} stroke="#cbd5e1" strokeWidth={1.5} />
          <line x1={children[0].x} y1={midY} x2={children[children.length - 1].x} y2={midY} stroke="#cbd5e1" strokeWidth={1.5} />
          {children.map(c => <line key={c.cause.id} x1={c.x} y1={midY} x2={c.x} y2={cTop} stroke="#cbd5e1" strokeWidth={1.5} />)}
        </>
      )}
      {children.map(c => <Connectors key={c.cause.id} px={c.x} py={c.y} children={c.children} />)}
    </>
  )
}

// ─── component ────────────────────────────────────────────────────────────────
export default function ProblemTree({ problem }: { problem: Problem }) {
  const { description, causes } = problem
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null)
  const [showRecenter, setShowRecenter] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef(false)

  const flat = flattenCauseTree(causes)
  const allGroupIds = collectGroupIds(flat)
  const GHOST = 'ghost'

  const rootsW = causes.length === 0
    ? NODE_W
    : causes.reduce((s, c) => s + subtreeW(c, flat, GHOST), 0) + (causes.length - 1) * H_GAP

  const problemX = PAD + rootsW / 2
  const problemY = PAD

  let childLeft = PAD
  const causeLayouts = causes.map(c => {
    const cl = buildLayout(c, flat, GHOST, childLeft, PAD + NODE_H + V_GAP)
    childLeft += subtreeW(c, flat, GHOST) + H_GAP
    return cl
  })

  const depth = treeDepth(causes, flat, GHOST)
  const totalW = Math.max(rootsW + PAD * 2, NODE_W + PAD * 2)
  const totalH = PAD + (depth + 1) * NODE_H + depth * V_GAP + PAD

  const allCauses = flattenLayout(causeLayouts)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const raf = requestAnimationFrame(() => {
      if (el.clientWidth > 0) {
        isProgrammaticScroll.current = true
        el.scrollLeft = Math.max(0, (totalW - el.clientWidth) / 2)
      }
      setShowRecenter(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [totalW])

  function handleScroll() {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false
      return
    }
    const el = scrollRef.current
    if (!el) return
    const centreX = Math.max(0, (totalW - el.clientWidth) / 2)
    setShowRecenter(Math.abs(el.scrollLeft - centreX) > 20)
  }

  function recentre() {
    const el = scrollRef.current
    if (!el) return
    isProgrammaticScroll.current = true
    el.scrollTo({ left: Math.max(0, (totalW - el.clientWidth) / 2), behavior: 'smooth' })
    setShowRecenter(false)
  }

  function handleNodeClick(cause: CauseNode) {
    if (cause.groupId) {
      setHighlightGroupId(cause.groupId)
      setTimeout(() => setHighlightGroupId(null), 1500)
    }
  }

  return (
    <div className="relative pb-4">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto"
      >
        <div style={{ minWidth: totalW, minHeight: totalH, display: 'flex', justifyContent: 'center' }}>
          <div className="relative" style={{ width: totalW, height: totalH }}>
            <svg className="absolute inset-0 pointer-events-none" width={totalW} height={totalH}>
              {causes.length > 0 && <Connectors px={problemX} py={problemY} children={causeLayouts} />}
            </svg>

            {/* Problem node */}
            <div
              title={description}
              style={{ left: problemX - NODE_W / 2, top: problemY, width: NODE_W, height: NODE_H }}
              className="absolute rounded-xl bg-indigo-600 text-white px-3 py-2 flex items-center justify-center shadow-md"
            >
              <p className="text-xs font-semibold text-center line-clamp-3 leading-snug">{description}</p>
            </div>

            {/* Cause nodes */}
            {allCauses.map(({ cause, x, y }) => {
          // Resolve canonical cause for groupId/linkedToId (ghost nodes share the original id prefix)
          const canonicalId = cause.id.includes(':') ? cause.id.split(':').pop()! : cause.id
          const canonical = flat.find(n => n.id === canonicalId) ?? cause
          const isRC = canonical.isActionableRootCause
          const isSecondary = !!canonical.linkedToId
          const isHighlighted = !!canonical.groupId && highlightGroupId === canonical.groupId

          const colour = canonical.groupId ? groupColour(canonical.groupId, allGroupIds) : null
          const borderCls = isRC ? 'border-amber-400' : colour ? colour.border : 'border-gray-200'
          const bgCls = isRC ? 'bg-amber-50' : colour ? colour.bg : 'bg-white'
          const textCls = isRC ? 'text-amber-800 font-semibold' : colour ? colour.text : 'text-gray-700'

          return (
            <div
              key={cause.id}
              title={canonical.text}
              onClick={() => handleNodeClick(canonical)}
              style={{ left: x - NODE_W / 2, top: y, width: NODE_W, height: NODE_H }}
              className={`absolute rounded-xl px-3 py-2 flex flex-col items-center justify-center border-2 shadow-sm transition-all
                ${canonical.groupId ? 'cursor-pointer hover:brightness-95' : ''}
                ${isHighlighted ? 'ring-2 ring-offset-1 ring-indigo-400 animate-pulse' : ''}
                ${bgCls} ${borderCls}`}
            >
              <p className={`text-xs text-center line-clamp-3 leading-snug ${textCls}`}>
                {canonical.text}
              </p>
              {isRC && (
                <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Root Cause
                </span>
              )}
              {isSecondary && !isRC && colour && (
                <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colour.text} bg-white/60`}>
                  ↔ linked
                </span>
              )}
            </div>
          )
        })}
      </div>
        </div>{/* flex-centering wrapper */}
      </div>{/* scrollRef */}

      {/* Re-centre button */}
      {showRecenter && (
        <button
          onClick={recentre}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-white border border-gray-300 shadow-md rounded-full text-xs text-gray-600 font-medium hover:bg-gray-50 transition-colors"
        >
          ⊕ Centre
        </button>
      )}
    </div>
  )
}
