# Context Summary: Issue #8 — delete node and re-link

## Issue
- **State:** open

## What the issue asks for
Three new capabilities in the editor only (CauseTreeEditor):
1. Unified inline panel — clicking a node shows options instead of triggering an action directly
2. Delete — node removed; real children promoted; secondary copies converted to open nodes
3. Re-link — click "Link" → linking mode → click target primary → link created

## Options per node type
| Option | Primary | Secondary |
|--------|---------|-----------|
| Mark/unmark root cause | ✓ | ✓ |
| Link | ✓ | — |
| Unlink | — | ✓ |
| Delete | ✓ | ✓ |

## Delete cascade
- Real children: parentId → grandparent; depth decremented across sub-tree
- Secondary copies: converted to independent open nodes (like applyUnlink)
- Primary groupId cleanup: removed if no secondaries remain

## Re-link
- Source: gains groupId + linkedToId, status closed, isActionableRootCause false
- Source's real children: promoted to source's parent first
- Target: gains groupId if not already set
- Constraints: can't link to self; can't link to a secondary target

## State changes
- Replace unlinkingId with selectedNodeId (unified panel) + linkingFromId (linking mode)

## Affected files
- src/components/CauseTreeEditor.tsx
- src/components/CauseTreeEditor.test.ts
