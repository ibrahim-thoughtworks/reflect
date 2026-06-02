import { describe, it, expect } from 'vitest'
import { isNodeOrGroupEffectivelyRC, allAncestorIds } from './CauseTreeEditor'
import type { EditorNode } from './CauseTreeEditor'

// Helper to build minimal EditorNode objects.
function node(
  id: string,
  parentId: string | null,
  depth: number,
  isActionableRootCause = false,
  groupId?: string,
  linkedToId?: string,
): EditorNode {
  return { id, text: id, parentId, depth, status: 'closed', isActionableRootCause, groupId, linkedToId }
}

// ─── isNodeOrGroupEffectivelyRC ─────────────────────────────────────────────

describe('isNodeOrGroupEffectivelyRC', () => {
  it('returns false for unknown id', () => {
    expect(isNodeOrGroupEffectivelyRC('x', [])).toBe(false)
  })

  it('returns true when node itself is RC', () => {
    const nodes = [node('A', null, 1, true)]
    expect(isNodeOrGroupEffectivelyRC('A', nodes)).toBe(true)
  })

  it('returns false when node is not RC and has no group', () => {
    const nodes = [node('A', null, 1, false)]
    expect(isNodeOrGroupEffectivelyRC('A', nodes)).toBe(false)
  })

  it('returns true when a group sibling is RC (the bug scenario)', () => {
    // C-primary: not RC, but in group-c
    // C-secondary: RC, same group-c
    const nodes = [
      node('c-primary',   null,       1, false, 'group-c'),
      node('c-secondary', 'd',        1, true,  'group-c', 'c-primary'),
    ]
    // c-primary itself is not RC, but its group sibling c-secondary IS
    expect(isNodeOrGroupEffectivelyRC('c-primary', nodes)).toBe(true)
  })

  it('returns false when node has group but no group member is RC', () => {
    const nodes = [
      node('c-primary',   null, 1, false, 'group-c'),
      node('c-secondary', 'd',  1, false, 'group-c', 'c-primary'),
    ]
    expect(isNodeOrGroupEffectivelyRC('c-primary', nodes)).toBe(false)
  })
})

// ─── ancestor check with grouped parent ─────────────────────────────────────

describe('bug #4 regression: grouped-parent ancestor check', () => {
  // Tree from the issue:
  //   A
  //   ├── B → E
  //   ├── C-primary → F
  //   └── D → C-secondary (root cause, linked to C-primary)
  it('blocks F when C-secondary (group sibling of F\'s parent C-primary) is RC', () => {
    const nodes: EditorNode[] = [
      node('A',           null,        0),
      node('B',           'A',         1),
      node('E',           'B',         2),
      node('c-primary',   'A',         1, false, 'group-c'),
      node('F',           'c-primary', 2),
      node('D',           'A',         1),
      node('c-secondary', 'D',         2, true,  'group-c', 'c-primary'),
    ]

    // F's ancestors include c-primary.
    const ancestors = allAncestorIds('F', nodes)
    expect(ancestors.has('c-primary')).toBe(true)

    // c-primary is effectively RC because c-secondary (group sibling) is RC.
    expect(isNodeOrGroupEffectivelyRC('c-primary', nodes)).toBe(true)

    // Combined: at least one ancestor of F is effectively RC → F should be blocked.
    const blocked = [...ancestors].some(aid => isNodeOrGroupEffectivelyRC(aid, nodes))
    expect(blocked).toBe(true)
  })

  it('does NOT block F when no group member of C-primary is RC', () => {
    const nodes: EditorNode[] = [
      node('A',           null,        0),
      node('c-primary',   'A',         1, false, 'group-c'),
      node('F',           'c-primary', 2),
      node('D',           'A',         1),
      node('c-secondary', 'D',         2, false, 'group-c', 'c-primary'), // not RC
    ]

    const ancestors = allAncestorIds('F', nodes)
    const blocked = [...ancestors].some(aid => isNodeOrGroupEffectivelyRC(aid, nodes))
    expect(blocked).toBe(false)
  })
})
