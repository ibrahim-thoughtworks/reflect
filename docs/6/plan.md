# Plan: delink grouped problem (#6)

## Objective
Let users remove a link from a secondary node via an inline "Unlink?" prompt.

## Approach

### New state
unlinkingId: string | null — tracks which secondary node is showing the unlink prompt.

### Click behaviour
handleNodeClick: if node is secondary, toggle unlinkingId (set or clear). Non-secondary
nodes keep existing root-cause toggle + highlight behaviour.

### Inline prompt
When unlinkingId === node.id, render "Remove link?" label + Unlink (rose) + Keep (neutral)
inside the node box instead of the normal content.

### unlinkNode logic
- Target: clear linkedToId, groupId, isActionableRootCause; set status: open
- Primary: remove groupId if no other secondaries remain in the group

### Root cause cleanup
Clear isActionableRootCause on unlinked node only. Primary sub-tree unaffected.

## Affected Areas
- src/components/CauseTreeEditor.tsx
- src/components/CauseTreeEditor.test.ts

## Assumptions
1. [ASSUMPTION] Clicking secondary always shows unlink prompt, not root-cause toggle.
2. [ASSUMPTION] After unlinking, node becomes open (Add/Skip reappears).
3. [ASSUMPTION] Primary groupId removed only when last secondary is removed.
