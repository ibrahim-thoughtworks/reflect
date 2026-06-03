# Plan: delete node and re-link (#8)

## Objective
Add delete, re-link and unified inline-panel to CauseTreeEditor.

## State
Replace unlinkingId with:
  selectedNodeId: string | null  — which node's panel is open
  linkingFromId:  string | null  — which node awaits a link target

## Inline panel options
Mark/Unmark RC, Link (primary only), Unlink (secondary only), Delete, Close

## Linking mode
Banner: "Click any primary cause to link to it". Clicking valid target completes link.
Clicking source or Esc cancels.

## applyDelete(id, nodes)
1. Direct children → re-parented to id's parent, depth -1 across subtree
2. Secondary copies (linkedToId = id) → converted to independent open nodes
3. Primary groupId cleanup when no secondaries remain
4. RC flag cleared on deleted node and promoted children
5. Node removed

## applyRelink(sourceId, targetId, nodes)
1. Guard: sourceId===targetId or target is secondary → no-op
2. Source's real children → promoted to source's parent
3. Assign/reuse target's groupId
4. Source: linkedToId=targetId, groupId, status:closed, isActionableRootCause:false
5. Target: gains groupId if not already set

## Affected Areas
- src/components/CauseTreeEditor.tsx
- src/components/CauseTreeEditor.test.ts

## Assumptions
1. [ASSUMPTION] Editor only — no ProblemTree changes.
2. [ASSUMPTION] Clicking source in linking mode cancels.
3. [ASSUMPTION] Cannot link to a secondary target.
4. [ASSUMPTION] Promoted children have RC cleared.

## Status: Completed
Implemented in 2 tasks. All 31 tests passing. Final commit: 11f91f6.
