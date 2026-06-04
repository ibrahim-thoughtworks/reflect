import { useEffect, useRef, useState } from 'react'
import { groupColour, collectGroupIds } from '../lib/groupColours'

// ─── constants ───────────────────────────────────────────────────────────────
const NODE_W = 184
const NODE_H = 76
const ACTION_H = 48
const H_GAP = 32
const V_GAP = 56
const PAD = 40
const MAX_DEPTH = 5

// ─── types ───────────────────────────────────────────────────────────────────
export type EditorNode = {
  id: string
  text: string
  parentId: string | null
  depth: number
  status: 'open' | 'closed'
  isActionableRootCause: boolean
  groupId?: string
  linkedToId?: string
}

type LinkCandidate = {
  parentId: string | null   // where the new node would be added
  text: string              // the typed text
  matchId: string           // id of the existing primary that matched
  matchText: string         // text of the existing primary
}

type LayoutItem = {
  id: string
  isAction: boolean
  x: number
  y: number
  w: number
  h: number
  children: LayoutItem[]
}

type Props = {
  description: string
  onSave: (nodes: EditorNode[]) => void
  initialNodes?: EditorNode[]   // pre-loaded nodes for edit mode
}

// ─── layout ──────────────────────────────────────────────────────────────────
// Skip was removed — every non-secondary node is always open (always has an
// Add slot). Secondary nodes (linkedToId set) are always closed leaves.
function subtreeW(parentId: string | null, nodes: EditorNode[]): number {
  const node = parentId ? nodes.find(n => n.id === parentId) : null
  const isSecondary = !!node?.linkedToId
  const depth = node?.depth ?? 0
  // Root (parentId=null) and non-secondary nodes are always open.
  const hasSlot = !isSecondary && depth < MAX_DEPTH

  const children = isSecondary ? [] : nodes.filter(n => n.parentId === parentId)
  const widths = [...children.map(c => subtreeW(c.id, nodes)), ...(hasSlot ? [NODE_W] : [])]
  if (widths.length === 0) return NODE_W
  return widths.reduce((s, w) => s + w, 0) + (widths.length - 1) * H_GAP
}

function buildLayout(
  parentId: string | null,
  nodes: EditorNode[],
  leftX: number,
  topY: number,
): LayoutItem {
  const node = parentId ? nodes.find(n => n.id === parentId) : null
  const isSecondary = !!node?.linkedToId
  const depth = node?.depth ?? 0
  const hasSlot = !isSecondary && depth < MAX_DEPTH

  const sw = subtreeW(parentId, nodes)
  const centreX = leftX + sw / 2
  const childTopY = topY + NODE_H + V_GAP

  const children = isSecondary ? [] : nodes.filter(n => n.parentId === parentId)
  let curLeft = leftX
  const childLayouts = children.map(c => {
    const cw = subtreeW(c.id, nodes)
    const cl = buildLayout(c.id, nodes, curLeft, childTopY)
    curLeft += cw + H_GAP
    return cl
  })

  const slotItem: LayoutItem | null = hasSlot
    ? { id: `action:${parentId ?? 'root'}`, isAction: true, x: curLeft + NODE_W / 2, y: childTopY, w: NODE_W, h: ACTION_H, children: [] }
    : null

  return {
    id: parentId ?? 'root',
    isAction: false,
    x: centreX,
    y: topY,
    w: NODE_W,
    h: NODE_H,
    children: slotItem ? [...childLayouts, slotItem] : childLayouts,
  }
}

function flattenLayout(item: LayoutItem): LayoutItem[] {
  return [item, ...item.children.flatMap(flattenLayout)]
}

// ─── SVG connectors ───────────────────────────────────────────────────────────
function Connectors({ item }: { item: LayoutItem }) {
  if (item.children.length === 0) return null
  const kids = item.children
  const pBottom = item.y + item.h
  const cTop = kids[0].y
  const midY = (pBottom + cTop) / 2
  return (
    <>
      {kids.length === 1 ? (
        <line x1={item.x} y1={pBottom} x2={kids[0].x} y2={cTop} stroke="#cbd5e1" strokeWidth={1.5} />
      ) : (
        <>
          <line x1={item.x} y1={pBottom} x2={item.x} y2={midY} stroke="#cbd5e1" strokeWidth={1.5} />
          <line x1={kids[0].x} y1={midY} x2={kids[kids.length - 1].x} y2={midY} stroke="#cbd5e1" strokeWidth={1.5} />
          {kids.map(k => <line key={k.id} x1={k.x} y1={midY} x2={k.x} y2={cTop} stroke="#cbd5e1" strokeWidth={1.5} />)}
        </>
      )}
      {kids.map(k => <Connectors key={k.id} item={k} />)}
    </>
  )
}

// ─── id generator ─────────────────────────────────────────────────────────────
let _seq = 0
function newId() { return `en${++_seq}` }
function newGroupId() { return `g${++_seq}` }

// ─── ancestor/descendant helpers (group-aware) ───────────────────────────────
// Returns all ancestor node ids across ALL group members' parent chains.
// Returns true if the node itself OR any node in its linked group is a root cause.
// Exported for unit testing.
export function isNodeOrGroupEffectivelyRC(nodeId: string, nodes: EditorNode[]): boolean {
  const node = nodes.find(n => n.id === nodeId)
  if (!node) return false
  if (node.isActionableRootCause) return true
  if (!node.groupId) return false
  return nodes.some(n => n.groupId === node.groupId && n.isActionableRootCause)
}

export function allAncestorIds(targetId: string, nodes: EditorNode[]): Set<string> {
  const target = nodes.find(n => n.id === targetId)!
  const groupMembers = target.groupId
    ? nodes.filter(n => n.groupId === target.groupId)
    : [target]

  const result = new Set<string>()
  for (const member of groupMembers) {
    let cur: string | null = member.parentId
    while (cur) {
      result.add(cur)
      const anc = nodes.find(n => n.id === cur)
      cur = anc?.parentId ?? null
    }
  }
  return result
}

function hasActionableRootCause(nodes: EditorNode[]): boolean {
  return nodes.some(node => node.isActionableRootCause)
}

// Returns all descendant node ids across ALL group members' subtrees.
function allDescendantIds(targetId: string, nodes: EditorNode[]): Set<string> {
  const target = nodes.find(n => n.id === targetId)!
  const groupMembers = target.groupId
    ? nodes.filter(n => n.groupId === target.groupId)
    : [target]

  const result = new Set<string>()
  for (const member of groupMembers) {
    // Use the canonical id (primary's id) to collect real children
    const canonicalId = member.linkedToId ?? member.id
    const stack = nodes.filter(n => n.parentId === canonicalId)
    while (stack.length) {
      const d = stack.pop()!
      result.add(d.id)
      stack.push(...nodes.filter(n => n.parentId === (d.linkedToId ?? d.id)))
    }
  }
  return result
}

// ─── pure unlink helper (exported for testing) ───────────────────────────────
export function applyUnlink(id: string, nodes: EditorNode[]): EditorNode[] {
  const target = nodes.find(n => n.id === id)!
  const gId = target.groupId
  const otherSecondaries = gId
    ? nodes.filter(n => n.groupId === gId && n.linkedToId && n.id !== id)
    : []

  return nodes.map(n => {
    if (n.id === id) {
      const next: EditorNode = { ...n, status: 'open', isActionableRootCause: false }
      delete next.groupId
      delete next.linkedToId
      return next
    }
    if (gId && n.groupId === gId && !n.linkedToId && otherSecondaries.length === 0) {
      const next: EditorNode = { ...n }
      delete next.groupId
      return next
    }
    return n
  })
}

// ─── pure delete helper (exported for testing) ───────────────────────────────
export function applyDelete(id: string, nodes: EditorNode[]): EditorNode[] {
  const target = nodes.find(n => n.id === id)!
  const newParentId = target.parentId
  const gId = target.groupId

  // Collect all real descendants (BFS) to decrement their depth
  const allDescendants = new Set<string>()
  let frontier = nodes.filter(n => n.parentId === id && !n.linkedToId).map(n => n.id)
  while (frontier.length) {
    frontier.forEach(fid => allDescendants.add(fid))
    frontier = nodes.filter(n => frontier.includes(n.parentId!) && !n.linkedToId).map(n => n.id)
  }
  const directChildIds = new Set(nodes.filter(n => n.parentId === id).map(n => n.id))

  const otherSecondaries = gId
    ? nodes.filter(n => n.groupId === gId && n.linkedToId && n.id !== id)
    : []

  return nodes
    .filter(n => n.id !== id)
    .map(n => {
      // Promote direct children to grandparent; clear RC (path changed)
      if (directChildIds.has(n.id)) {
        return { ...n, parentId: newParentId, depth: n.depth - 1, isActionableRootCause: false }
      }
      // Decrement depth for other descendants
      if (allDescendants.has(n.id)) {
        return { ...n, depth: n.depth - 1 }
      }
      // Convert secondary copies of deleted node to independent open nodes
      if (n.linkedToId === id) {
        const next: EditorNode = { ...n, status: 'open', isActionableRootCause: false }
        delete next.groupId
        delete next.linkedToId
        return next
      }
      // Remove primary's groupId when no secondaries remain
      if (gId && n.groupId === gId && !n.linkedToId && otherSecondaries.length === 0) {
        const next: EditorNode = { ...n }
        delete next.groupId
        return next
      }
      return n
    })
}

// ─── pure relink helper (exported for testing) ────────────────────────────────
export function applyRelink(sourceId: string, targetId: string, nodes: EditorNode[]): EditorNode[] {
  if (sourceId === targetId) return nodes
  const target = nodes.find(n => n.id === targetId)
  if (!target || target.linkedToId) return nodes // can't link to secondary

  const source = nodes.find(n => n.id === sourceId)!
  const gId = target.groupId ?? `g${sourceId}`
  const newParentId = source.parentId

  // Collect direct children + all descendants of source for promotion + depth fix
  const allDescendants = new Set<string>()
  let frontier = nodes.filter(n => n.parentId === sourceId && !n.linkedToId).map(n => n.id)
  while (frontier.length) {
    frontier.forEach(fid => allDescendants.add(fid))
    frontier = nodes.filter(n => frontier.includes(n.parentId!) && !n.linkedToId).map(n => n.id)
  }
  const directChildIds = new Set(nodes.filter(n => n.parentId === sourceId).map(n => n.id))

  return nodes.map(n => {
    // Source becomes secondary
    if (n.id === sourceId) {
      return { ...n, status: 'closed' as const, isActionableRootCause: false, groupId: gId, linkedToId: targetId }
    }
    // Target gains groupId if it doesn't already have one
    if (n.id === targetId && !n.groupId) {
      return { ...n, groupId: gId }
    }
    // Promote source's direct children to source's parent; clear RC
    if (directChildIds.has(n.id)) {
      return { ...n, parentId: newParentId, depth: n.depth - 1, isActionableRootCause: false }
    }
    // Decrement depth for other descendants
    if (allDescendants.has(n.id)) {
      return { ...n, depth: n.depth - 1 }
    }
    return n
  })
}

// ─── component ────────────────────────────────────────────────────────────────
export default function CauseTreeEditor({ description, onSave, initialNodes }: Props) {
  const [nodes, setNodes] = useState<EditorNode[]>(initialNodes ?? [])
  const [inputtingFor, setInputtingFor] = useState<string | null>(null) // 'root' | nodeId | null
  const [inputValue, setInputValue] = useState('')
  const [linkCandidate, setLinkCandidate] = useState<LinkCandidate | null>(null)
  const [shakingId, setShakingId] = useState<string | null>(null)
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null) // panel open
  const [linkingFromId, setLinkingFromId] = useState<string | null>(null)   // linking mode
  const [showRecenter, setShowRecenter] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef(false)

  const hasRC = hasActionableRootCause(nodes)
  const canSave = nodes.length > 0 && hasRC && !inputtingFor && !linkCandidate && !linkingFromId

  const allGroupIds = collectGroupIds(nodes)

  const rootLayout = buildLayout(null, nodes, PAD, PAD)
  const allItems = flattenLayout(rootLayout)
  const canvasW = Math.max(...allItems.map(i => i.x + i.w / 2)) + PAD
  const canvasH = Math.max(...allItems.map(i => i.y + i.h)) + PAD

  // ── handlers ──
  function openInput(parentId: string | null) {
    setLinkCandidate(null)
    setInputtingFor(parentId === null ? 'root' : parentId)
    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  function confirmInput(parentId: string | null) {
    const text = inputValue.trim()
    if (!text) return

    // Check for exact text match among existing primaries
    const match = nodes.find(n => !n.linkedToId && n.text.trim().toLowerCase() === text.toLowerCase())
    if (match) {
      setLinkCandidate({ parentId, text, matchId: match.id, matchText: match.text })
      setInputtingFor(null)
      setInputValue('')
      return
    }

    addNode(parentId, text)
  }

  function addNode(parentId: string | null, text: string, extra?: Partial<EditorNode>) {
    const parentDepth = parentId === null ? 0 : nodes.find(n => n.id === parentId)!.depth
    setNodes(ns => [...ns, {
      id: newId(),
      text,
      parentId,
      depth: parentDepth + 1,
      status: 'open',
      isActionableRootCause: false,
      ...extra,
    }])
    setInputValue('')
    setInputtingFor(null)
    setLinkCandidate(null)
  }

  function confirmLink(candidate: LinkCandidate) {
    // Assign or reuse groupId
    const existingPrimary = nodes.find(n => n.id === candidate.matchId)!
    const gId = existingPrimary.groupId ?? newGroupId()

    // Ensure primary has groupId
    setNodes(ns => {
      const updated = ns.map(n => n.id === candidate.matchId && !n.groupId ? { ...n, groupId: gId } : n)
      const parentDepth = candidate.parentId === null ? 0 : updated.find(n => n.id === candidate.parentId)!.depth
      return [...updated, {
        id: newId(),
        text: candidate.text,
        parentId: candidate.parentId,
        depth: parentDepth + 1,
        status: 'closed' as const,
        isActionableRootCause: false,
        groupId: gId,
        linkedToId: candidate.matchId,
      }]
    })
    setLinkCandidate(null)
  }

  function toggleRootCause(id: string) {
    const node = nodes.find(n => n.id === id)!

    if (node.isActionableRootCause) {
      setNodes(ns => ns.map(n => n.id === id ? { ...n, isActionableRootCause: false } : n))
      return
    }

    // Block if another node in the same group is already a root cause
    if (node.groupId) {
      const siblings = nodes.filter(n => n.groupId === node.groupId && n.id !== id)
      if (siblings.some(s => s.isActionableRootCause)) { shake(id); return }
    }

    const ancestors = allAncestorIds(id, nodes)
    if ([...ancestors].some(aid => isNodeOrGroupEffectivelyRC(aid, nodes))) {
      shake(id); return
    }

    const descendants = allDescendantIds(id, nodes)
    if ([...descendants].some(did => isNodeOrGroupEffectivelyRC(did, nodes))) {
      shake(id); return
    }

    setNodes(ns => ns.map(n => n.id === id ? { ...n, isActionableRootCause: true } : n))
  }

  function unlinkNode(id: string) {
    setNodes(ns => applyUnlink(id, ns))
    setSelectedNodeId(null)
  }

  function deleteNode(id: string) {
    setNodes(ns => applyDelete(id, ns))
    setSelectedNodeId(null)
  }

  function startLinking(id: string) {
    setLinkingFromId(id)
    setSelectedNodeId(null)
    if (nodes.find(n => n.id === id)?.groupId) {
      setHighlightGroupId(nodes.find(n => n.id === id)!.groupId!)
      setTimeout(() => setHighlightGroupId(null), 600)
    }
  }

  function completeLinking(targetId: string) {
    const fromId = linkingFromId!
    if (fromId === targetId) { setLinkingFromId(null); return }     // cancel: clicked source
    setNodes(ns => applyRelink(fromId, targetId, ns))
    setLinkingFromId(null)
  }

  function handleNodeClick(node: EditorNode) {
    if (linkingFromId) {
      completeLinking(node.id)
      return
    }
    // Toggle the inline options panel
    if (node.groupId && selectedNodeId !== node.id) {
      setHighlightGroupId(node.groupId)
      setTimeout(() => setHighlightGroupId(null), 1500)
    }
    setSelectedNodeId(prev => prev === node.id ? null : node.id)
  }

  function shake(id: string) {
    setShakingId(id)
    setTimeout(() => setShakingId(null), 400)
  }

  // ── horizontal centering ──
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Wait one frame so the browser has measured the container width
    const raf = requestAnimationFrame(() => {
      if (el.clientWidth > 0) {
        isProgrammaticScroll.current = true
        el.scrollLeft = Math.max(0, (canvasW - el.clientWidth) / 2)
      }
      setShowRecenter(false)
    })
    return () => cancelAnimationFrame(raf)
  }, [canvasW])

  function handleScroll() {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false
      return
    }
    const el = scrollRef.current
    if (!el) return
    const centreX = Math.max(0, (canvasW - el.clientWidth) / 2)
    setShowRecenter(Math.abs(el.scrollLeft - centreX) > 20)
  }

  function recentre() {
    const el = scrollRef.current
    if (!el) return
    isProgrammaticScroll.current = true
    el.scrollTo({ left: Math.max(0, (canvasW - el.clientWidth) / 2), behavior: 'smooth' })
    setShowRecenter(false)
  }

  // ── render ──
  return (
    <div className="flex flex-col gap-4">
      {/* Scroll container with horizontal centring */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-visible"
        >
          <div style={{ minWidth: canvasW, display: 'flex', justifyContent: 'center' }}>
        <div className="relative" style={{ width: canvasW, height: canvasH }}>

          <svg className="absolute inset-0 pointer-events-none" width={canvasW} height={canvasH}>
            <Connectors item={rootLayout} />
          </svg>

          {/* Problem node */}
          <div
            style={{ left: rootLayout.x - NODE_W / 2, top: rootLayout.y, width: NODE_W, height: NODE_H }}
            className="absolute rounded-xl bg-indigo-600 text-white px-3 py-2 flex items-center justify-center shadow-md"
          >
            <p className="text-xs font-semibold text-center line-clamp-3 leading-snug">{description}</p>
          </div>

          {/* Linking-mode banner */}
          {linkingFromId && (
            <div
              style={{ left: 0, top: 0, width: canvasW }}
              className="absolute flex items-center justify-between gap-3 px-4 py-2 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-700 z-10"
            >
              <span>↔ Click any primary cause to link — or click the source node to cancel</span>
              <button
                onClick={() => setLinkingFromId(null)}
                className="text-violet-400 hover:text-violet-600 font-medium"
              >
                Esc
              </button>
            </div>
          )}

          {/* Cause nodes */}
          {allItems.filter(i => !i.isAction && i.id !== 'root').map(item => {
            const node = nodes.find(n => n.id === item.id)!
            const isRC = node.isActionableRootCause
            const isSecondary = !!node.linkedToId
            const isLeaf = !isSecondary && nodes.filter(n => n.parentId === item.id).length === 0
            const isShaking = shakingId === item.id
            const isHighlighted = !!node.groupId && highlightGroupId === node.groupId
            const isSelected = selectedNodeId === node.id
            const isLinkingSource = linkingFromId === node.id
            const isValidLinkTarget = !!linkingFromId && !node.linkedToId && node.id !== linkingFromId

            const colour = node.groupId ? groupColour(node.groupId, allGroupIds) : null
            const borderCls = isRC ? 'border-amber-400'
              : isSelected ? 'border-indigo-400'
              : colour ? colour.border : isLeaf ? 'border-gray-200' : 'border-gray-200'
            const bgCls = isRC ? 'bg-amber-50'
              : isSelected ? 'bg-indigo-50'
              : colour ? colour.bg : isLeaf ? 'bg-gray-50' : 'bg-white'
            const textCls = isRC ? 'text-amber-800 font-semibold'
              : colour ? colour.text : isLeaf ? 'text-gray-400' : 'text-gray-700'

            // Can this node be marked RC from the panel?
            const canMarkRC = !isRC && (() => {
              if (node.groupId) {
                const siblings = nodes.filter(n => n.groupId === node.groupId && n.id !== node.id)
                if (siblings.some(s => s.isActionableRootCause)) return false
              }
              const ancestors = allAncestorIds(node.id, nodes)
              if ([...ancestors].some(aid => isNodeOrGroupEffectivelyRC(aid, nodes))) return false
              const descendants = allDescendantIds(node.id, nodes)
              if ([...descendants].some(did => isNodeOrGroupEffectivelyRC(did, nodes))) return false
              return true
            })()

            return (
              <div
                key={item.id}
                onClick={() => handleNodeClick(node)}
                style={{ left: item.x - NODE_W / 2, top: item.y, width: NODE_W, height: NODE_H }}
                className={`absolute rounded-xl px-2 py-2 flex flex-col items-center justify-center border-2 cursor-pointer select-none transition-all shadow-sm
                  ${isShaking ? 'animate-[shake_0.35s_ease]' : ''}
                  ${isHighlighted ? 'ring-2 ring-offset-1 ring-indigo-400 animate-pulse' : ''}
                  ${isLinkingSource ? 'ring-2 ring-violet-400 animate-pulse' : ''}
                  ${isValidLinkTarget ? 'ring-2 ring-violet-200 hover:ring-violet-400' : ''}
                  ${isSelected ? `${bgCls} ${borderCls}` : `${bgCls} ${borderCls} hover:brightness-95`}`}
              >
                {isSelected ? (
                  /* ── Unified options panel ── */
                  <div className="flex flex-col items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                    {/* Row 1: RC toggle */}
                    {isRC ? (
                      <button
                        onClick={() => { toggleRootCause(node.id); setSelectedNodeId(null) }}
                        className="w-full py-0.5 text-[10px] font-semibold text-amber-600 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
                      >
                        ✕ Root Cause
                      </button>
                    ) : canMarkRC ? (
                      <button
                        onClick={() => { toggleRootCause(node.id); setSelectedNodeId(null) }}
                        className="w-full py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors"
                      >
                        ★ Root Cause
                      </button>
                    ) : null}
                    {/* Row 2: Link / Unlink */}
                    {isSecondary ? (
                      <button
                        onClick={() => unlinkNode(node.id)}
                        className="w-full py-0.5 text-[10px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-300 rounded-md transition-colors"
                      >
                        ↔ Unlink
                      </button>
                    ) : (
                      <button
                        onClick={() => startLinking(node.id)}
                        className="w-full py-0.5 text-[10px] font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-300 rounded-md transition-colors"
                      >
                        ↔ Link
                      </button>
                    )}
                    {/* Row 3: Delete + Close */}
                    <div className="flex gap-1 w-full">
                      <button
                        onClick={() => deleteNode(node.id)}
                        className="flex-1 py-0.5 text-[10px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-md transition-colors"
                      >
                        🗑 Delete
                      </button>
                      <button
                        onClick={() => setSelectedNodeId(null)}
                        className="px-2 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded-md transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal display ── */
                  <>
                    <p className={`text-xs text-center line-clamp-2 leading-snug ${textCls}`}>
                      {node.text}
                    </p>
                    {isRC && (
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                        Root Cause
                      </span>
                    )}
                    {isSecondary && !isRC && (
                      <span className={`mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${colour ? `${colour.text} bg-white/60` : 'text-gray-500'}`}>
                        ↔ linked
                      </span>
                    )}
                  </>
                )}
              </div>
            )
          })}

          {/* Action slots */}
          {allItems.filter(i => i.isAction).map(item => {
            const rawParent = item.id.replace('action:', '')
            const parentId: string | null = rawParent === 'root' ? null : rawParent
            const slotKey = parentId ?? 'root'
            const isInputting = inputtingFor === slotKey
            const isLinkPrompt = linkCandidate !== null &&
              (linkCandidate.parentId === parentId || (linkCandidate.parentId === null && parentId === null))

            return (
              <div
                key={item.id}
                style={{ left: item.x - NODE_W / 2, top: item.y, width: NODE_W, height: ACTION_H }}
                className="absolute flex items-center justify-center"
              >
                {isLinkPrompt ? (
                  <div className="flex flex-col gap-1.5 w-full">
                    <p className="text-[10px] text-gray-500 text-center truncate">
                      Matches "{linkCandidate!.matchText}"
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => confirmLink(linkCandidate!)}
                        className="flex-1 px-2 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-semibold rounded-lg transition-colors"
                      >
                        ↔ Link
                      </button>
                      <button
                        onClick={() => addNode(parentId, linkCandidate!.text)}
                        className="flex-1 px-2 py-1 border border-gray-300 hover:bg-gray-50 text-gray-600 text-[10px] font-medium rounded-lg transition-colors"
                      >
                        Add as new
                      </button>
                    </div>
                  </div>
                ) : isInputting ? (
                  <div className="flex flex-col w-full gap-1">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmInput(parentId)
                        if (e.key === 'Escape') { setInputtingFor(null); setInputValue('') }
                      }}
                      placeholder="Because…"
                      className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => confirmInput(parentId)}
                        disabled={!inputValue.trim()}
                        className="flex-1 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setInputtingFor(null); setInputValue('') }}
                        className="px-2 py-1 border border-gray-300 hover:bg-gray-50 text-gray-500 text-xs font-medium rounded-lg transition-colors"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openInput(parentId)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                    >
                      + Add
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
          </div>{/* flex-centering inner wrapper */}
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
      </div>{/* relative wrapper */}

      {/* Save */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {canSave
            ? 'Ready to save.'
            : nodes.length === 0
              ? 'Add at least one cause to save.'
              : 'Mark at least one actionable root cause to save.'}
        </p>
        <button
          onClick={() => onSave(nodes)}
          disabled={!canSave}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          Save Problem
        </button>
      </div>
    </div>
  )
}
