# Plan: UI based cause adder (#2)

## Objective
Build a live interactive tree editor for the cause-adding flow. Users see the full tree
growing in real time as they add causes. Every unresolved leaf shows Add / Skip in the tree.
Root causes are toggled by clicking nodes directly. The describe step and save-to-localStorage
logic remain unchanged; only the middle and final phases of AddProblem.tsx are replaced.

## Scope

### In Scope
- New `CauseTreeEditor` component — manages editor node state, renders live tree with layout
  engine, inline Add/Skip/input affordances, root cause toggling, Save button
- Adapt layout algorithm from ProblemTree.tsx for interactive use (allocates space for
  Add/Skip areas below open nodes)
- Root cause toggle with path constraint (no ancestor + descendant on same path both marked)
- Save button activates when all nodes are closed (no open nodes remain)
- Wire into AddProblem.tsx: describe phase → CauseTreeEditor → saveProblem → home
- Remove WhyStep.tsx, RootCauseSelector.tsx, and the pendingStack wizard logic

### Out of Scope
- Max-depth (5-level) enforcement — kept from issue #1
- Editing or deleting already-added causes
- Backend / auth

## Approach

### Data model (internal to CauseTreeEditor)

```ts
type EditorNode = {
  id: string
  text: string
  parentId: string | null
  depth: number            // 1 = direct child of problem
  status: 'open' | 'closed'
  isActionableRootCause: boolean
}
```

A node is open from creation until the user clicks Skip below it. An open node renders
Add / Skip below its tree position. A closed node with no children is a permanent leaf.

### Layout

Adapt ProblemTree.tsx layout. Treat each open node as having one extra virtual
"action slot" child of fixed size. This positions Add/Skip/input at the correct coordinates.

### Root cause toggle (path constraint)

On click of a cause node:
1. If already root cause → unmark (always allowed)
2. Else if any ancestor is root cause → block
3. Else if any descendant is root cause → block
4. Otherwise → mark as root cause

### Save activation

`allClosed = nodes.every(n => n.status === 'closed')`
Save enabled when allClosed (can be zero nodes if user skipped immediately).

## Affected Areas

| Area | Files | Change Type |
|------|-------|-------------|
| New component | src/components/CauseTreeEditor.tsx | Add |
| Wizard | src/pages/AddProblem.tsx | Modify (simplify) |
| Obsolete | src/components/WhyStep.tsx, src/components/RootCauseSelector.tsx | Delete |

## Assumptions
1. [ASSUMPTION] Max depth of 5 still applies; level-5 nodes show no Add/Skip.
2. [ASSUMPTION] Problem node is not clickable for root cause — only cause nodes are.
3. [ASSUMPTION] Editing/deleting causes is out of scope.
4. [ASSUMPTION] Skipping all causes → empty tree → save still enabled.
