import { describe, it, expect } from 'vitest'
import { isNodeOrGroupEffectivelyRC, allAncestorIds, applyUnlink, applyDelete, applyRelink } from './CauseTreeEditor'
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

// ─── applyUnlink ─────────────────────────────────────────────────────────────

describe('applyUnlink', () => {
  // Base tree: A → C-primary → F; A → D → C-secondary (linked to C-primary)
  const baseNodes = (): EditorNode[] => [
    node('A',           null,        0),
    node('c-primary',   'A',         1, false, 'group-c'),
    node('F',           'c-primary', 2),
    node('D',           'A',         1),
    node('c-secondary', 'D',         2, false, 'group-c', 'c-primary'),
  ]

  it('secondary node loses linkedToId and groupId after unlink', () => {
    const result = applyUnlink('c-secondary', baseNodes())
    const sec = result.find(n => n.id === 'c-secondary')!
    expect(sec.linkedToId).toBeUndefined()
    expect(sec.groupId).toBeUndefined()
  })

  it('secondary node becomes open after unlink', () => {
    const result = applyUnlink('c-secondary', baseNodes())
    expect(result.find(n => n.id === 'c-secondary')!.status).toBe('open')
  })

  it('clears isActionableRootCause on the unlinked node', () => {
    const withRC = baseNodes().map(n =>
      n.id === 'c-secondary' ? { ...n, isActionableRootCause: true } : n,
    )
    const result = applyUnlink('c-secondary', withRC)
    expect(result.find(n => n.id === 'c-secondary')!.isActionableRootCause).toBe(false)
  })

  it('removes groupId from primary when no other secondaries remain', () => {
    const result = applyUnlink('c-secondary', baseNodes())
    expect(result.find(n => n.id === 'c-primary')!.groupId).toBeUndefined()
  })

  it('keeps groupId on primary when another secondary still exists', () => {
    const twoSecondaries = [
      ...baseNodes(),
      node('c-secondary-2', 'A', 1, false, 'group-c', 'c-primary'),
    ]
    const result = applyUnlink('c-secondary', twoSecondaries)
    expect(result.find(n => n.id === 'c-primary')!.groupId).toBe('group-c')
    // The remaining secondary also keeps its groupId
    expect(result.find(n => n.id === 'c-secondary-2')!.groupId).toBe('group-c')
  })

  it('does not affect unrelated nodes', () => {
    const result = applyUnlink('c-secondary', baseNodes())
    const f = result.find(n => n.id === 'F')!
    expect(f.groupId).toBeUndefined()
    expect(f.linkedToId).toBeUndefined()
    expect(f.parentId).toBe('c-primary')
  })
})

// ─── applyDelete ─────────────────────────────────────────────────────────────

describe('applyDelete', () => {
  // Tree: A → B → E; A → C; B has secondary copy B2 (linkedToId: B)
  const baseNodes = (): EditorNode[] => [
    node('A',  null, 0),
    node('B',  'A',  1, false, 'group-b'),
    node('E',  'B',  2),
    node('C',  'A',  1),
    node('B2', 'A',  1, false, 'group-b', 'B'),  // secondary of B
  ]

  it('removes the deleted node', () => {
    const result = applyDelete('B', baseNodes())
    expect(result.find(n => n.id === 'B')).toBeUndefined()
  })

  it('promotes real children to grandparent', () => {
    const result = applyDelete('B', baseNodes())
    const e = result.find(n => n.id === 'E')!
    expect(e.parentId).toBe('A')
    expect(e.depth).toBe(1)
  })

  it('clears RC on promoted children', () => {
    const withRC = baseNodes().map(n => n.id === 'E' ? { ...n, isActionableRootCause: true } : n)
    const result = applyDelete('B', withRC)
    expect(result.find(n => n.id === 'E')!.isActionableRootCause).toBe(false)
  })

  it('converts secondary copies to independent open nodes', () => {
    const result = applyDelete('B', baseNodes())
    const b2 = result.find(n => n.id === 'B2')!
    expect(b2.status).toBe('open')
    expect(b2.linkedToId).toBeUndefined()
    expect(b2.groupId).toBeUndefined()
  })

  it('removes groupId from primary when it has no other secondaries', () => {
    // B is the primary and B2 is the only secondary.
    // When B is deleted, B2 is converted and loses groupId.
    // After deletion B is gone, so no more primary to clean up.
    // Test: delete B2 (secondary) → B (primary) loses groupId since no secondaries remain.
    const result = applyDelete('B2', baseNodes())
    expect(result.find(n => n.id === 'B')!.groupId).toBeUndefined()
  })

  it('leaves unrelated nodes untouched', () => {
    const result = applyDelete('B', baseNodes())
    const c = result.find(n => n.id === 'C')!
    expect(c.parentId).toBe('A')
    expect(c.depth).toBe(1)
  })
})

// ─── applyRelink ─────────────────────────────────────────────────────────────

describe('applyRelink', () => {
  // Tree: A → B → E; A → C (source to relink onto B)
  const baseNodes = (): EditorNode[] => [
    node('A', null, 0),
    node('B', 'A',  1, false, 'group-b'),
    node('E', 'B',  2),
    node('C', 'A',  1),  // C will be relinked to B
  ]

  it('is a no-op when source === target', () => {
    const before = baseNodes()
    expect(applyRelink('C', 'C', before)).toEqual(before)
  })

  it('is a no-op when target is secondary', () => {
    const withSecondary = [
      ...baseNodes(),
      node('B2', 'A', 1, false, 'group-b', 'B'),
    ]
    expect(applyRelink('C', 'B2', withSecondary)).toEqual(withSecondary)
  })

  it('source gains linkedToId, groupId, and becomes closed', () => {
    const result = applyRelink('C', 'B', baseNodes())
    const c = result.find(n => n.id === 'C')!
    expect(c.linkedToId).toBe('B')
    expect(c.groupId).toBe('group-b')  // reuses B's groupId
    expect(c.status).toBe('closed')
    expect(c.isActionableRootCause).toBe(false)
  })

  it('target gains groupId when it does not already have one', () => {
    const nodes = baseNodes().map(n => n.id === 'B' ? { ...n, groupId: undefined } : n) as typeof baseNodes extends () => infer T ? T : never
    const result = applyRelink('C', 'B', nodes as EditorNode[])
    expect(result.find(n => n.id === 'B')!.groupId).toBeDefined()
  })

  it('source children are promoted to source parent', () => {
    const withChild: EditorNode[] = [
      ...baseNodes(),
      node('D', 'C', 2),  // D is a child of C
    ]
    const result = applyRelink('C', 'B', withChild)
    const d = result.find(n => n.id === 'D')!
    expect(d.parentId).toBe('A')  // promoted to A (C's parent)
    expect(d.depth).toBe(1)
    expect(d.isActionableRootCause).toBe(false)
  })
})
