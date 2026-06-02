import { useRef, useState } from 'react'
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
}

// ─── layout ──────────────────────────────────────────────────────────────────
// Secondary nodes (linkedToId set) are always closed leaves in the editor —
// their inherited children are shown only in the detail view.
function subtreeW(parentId: string | null, nodes: EditorNode[], problemOpen: boolean): number {
  const node = parentId ? nodes.find(n => n.id === parentId) : null
  const isSecondary = !!node?.linkedToId
  const isOpen = parentId === null ? problemOpen : (node?.status === 'open' && !isSecondary)
  const depth = node?.depth ?? 0
  const hasSlot = isOpen && depth < MAX_DEPTH

  const children = isSecondary ? [] : nodes.filter(n => n.parentId === parentId)
  const widths = [...children.map(c => subtreeW(c.id, nodes, problemOpen)), ...(hasSlot ? [NODE_W] : [])]
  if (widths.length === 0) return NODE_W
  return widths.reduce((s, w) => s + w, 0) + (widths.length - 1) * H_GAP
}

function buildLayout(
  parentId: string | null,
  nodes: EditorNode[],
  problemOpen: boolean,
  leftX: number,
  topY: number,
): LayoutItem {
  const node = parentId ? nodes.find(n => n.id === parentId) : null
  const isSecondary = !!node?.linkedToId
  const isOpen = parentId === null ? problemOpen : (node?.status === 'open' && !isSecondary)
  const depth = node?.depth ?? 0
  const hasSlot = isOpen && depth < MAX_DEPTH

  const sw = subtreeW(parentId, nodes, problemOpen)
  const centreX = leftX + sw / 2
  const childTopY = topY + NODE_H + V_GAP

  const children = isSecondary ? [] : nodes.filter(n => n.parentId === parentId)
  let curLeft = leftX
  const childLayouts = children.map(c => {
    const cw = subtreeW(c.id, nodes, problemOpen)
    const cl = buildLayout(c.id, nodes, problemOpen, curLeft, childTopY)
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
function allAncestorIds(targetId: string, nodes: EditorNode[]): Set<string> {
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

// ─── component ────────────────────────────────────────────────────────────────
export default function CauseTreeEditor({ description, onSave }: Props) {
  const [nodes, setNodes] = useState<EditorNode[]>([])
  const [problemOpen, setProblemOpen] = useState(true)
  const [inputtingFor, setInputtingFor] = useState<string | null>(null) // 'root' | nodeId | null
  const [inputValue, setInputValue] = useState('')
  const [linkCandidate, setLinkCandidate] = useState<LinkCandidate | null>(null)
  const [shakingId, setShakingId] = useState<string | null>(null)
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const canSave = !problemOpen && nodes.every(n => n.status === 'closed')

  const allGroupIds = collectGroupIds(nodes)

  const rootLayout = buildLayout(null, nodes, problemOpen, PAD, PAD)
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

  function skipNode(parentId: string | null) {
    if (parentId === null) setProblemOpen(false)
    else setNodes(ns => ns.map(n => n.id === parentId ? { ...n, status: 'closed' } : n))
    setInputtingFor(null)
    setInputValue('')
    setLinkCandidate(null)
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
    if ([...ancestors].some(aid => nodes.find(n => n.id === aid)?.isActionableRootCause)) {
      shake(id); return
    }

    const descendants = allDescendantIds(id, nodes)
    if ([...descendants].some(did => nodes.find(n => n.id === did)?.isActionableRootCause)) {
      shake(id); return
    }

    setNodes(ns => ns.map(n => n.id === id ? { ...n, isActionableRootCause: true } : n))
  }

  function handleNodeClick(node: EditorNode) {
    // Highlight other group members
    if (node.groupId) {
      setHighlightGroupId(node.groupId)
      setTimeout(() => setHighlightGroupId(null), 1500)
    }
    toggleRootCause(node.id)
  }

  function shake(id: string) {
    setShakingId(id)
    setTimeout(() => setShakingId(null), 400)
  }

  // ── render ──
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-auto">
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

          {/* Cause nodes */}
          {allItems.filter(i => !i.isAction && i.id !== 'root').map(item => {
            const node = nodes.find(n => n.id === item.id)!
            const isRC = node.isActionableRootCause
            const isSecondary = !!node.linkedToId
            const isLeaf = node.status === 'closed' && !isSecondary && nodes.filter(n => n.parentId === item.id).length === 0
            const isShaking = shakingId === item.id
            const isHighlighted = !!node.groupId && highlightGroupId === node.groupId

            const colour = node.groupId ? groupColour(node.groupId, allGroupIds) : null
            const borderCls = isRC
              ? 'border-amber-400'
              : colour ? colour.border : isLeaf ? 'border-gray-200' : 'border-gray-200'
            const bgCls = isRC
              ? 'bg-amber-50'
              : colour ? colour.bg : isLeaf ? 'bg-gray-50' : 'bg-white'
            const textCls = isRC
              ? 'text-amber-800 font-semibold'
              : colour ? colour.text : isLeaf ? 'text-gray-400' : 'text-gray-700'

            return (
              <div
                key={item.id}
                onClick={() => handleNodeClick(node)}
                style={{ left: item.x - NODE_W / 2, top: item.y, width: NODE_W, height: NODE_H }}
                className={`absolute rounded-xl px-3 py-2 flex flex-col items-center justify-center border-2 cursor-pointer select-none transition-all
                  ${isShaking ? 'animate-[shake_0.35s_ease]' : ''}
                  ${isHighlighted ? 'ring-2 ring-offset-1 ring-indigo-400 animate-pulse' : ''}
                  ${bgCls} ${borderCls} shadow-sm hover:brightness-95`}
              >
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
                  <div className="flex w-full gap-1.5">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmInput(parentId)
                        if (e.key === 'Escape') { setInputtingFor(null); setInputValue('') }
                      }}
                      placeholder="Because…"
                      className="flex-1 min-w-0 border border-indigo-300 rounded-lg px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => confirmInput(parentId)}
                      disabled={!inputValue.trim()}
                      className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openInput(parentId)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => skipNode(parentId)}
                      className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-500 text-xs font-medium rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          {canSave ? 'All paths filled — ready to save.' : 'Fill or skip every branch to enable Save.'}
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
