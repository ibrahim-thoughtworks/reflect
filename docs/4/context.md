# Context Summary: Issue #4 — bug 1

## Issue
- **State:** open

## What the issue asks for
Bug fix. When a node's parent belongs to a linked group, and any member of that group is
already an actionable root cause, a child of that parent should be blocked from being marked
as root cause. Currently only the parent node itself is checked — its group siblings are not.

## Diagram from issue
        A
        |
  B     C          D
  |     |          |
  E     F     C (secondary, root cause)

F's parent is C (primary). C-primary and C-secondary are in the same group.
C-secondary is root cause. F should be blocked — but currently is not, because
C-primary.isActionableRootCause = false.

## Root cause
In CauseTreeEditor.tsx → toggleRootCause, ancestor check:
  if ([...ancestors].some(aid => nodes.find(n => n.id === aid)?.isActionableRootCause))
This checks the ancestor's own flag but NOT its group siblings' flags.

## Fix
Add isNodeOrGroupEffectivelyRC(nodeId, nodes) helper. Use it in ancestor check.

## Affected files
- src/components/CauseTreeEditor.tsx (toggleRootCause + new helper)
- src/store/problems.test.ts (new test)
