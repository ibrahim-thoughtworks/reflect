# Plan: bug 1 (#4)

## Objective
Fix the root-cause toggle constraint so that a child of a grouped parent is blocked when
any member of the parent's group is already a root cause — not just the parent node itself.

## Approach

Add isNodeOrGroupEffectivelyRC(nodeId, nodes) helper. Replace the ancestor and descendant
checks in toggleRootCause to use this helper instead of checking only the node's own flag.

## Affected Areas

| Area | File | Change |
|------|------|--------|
| Root-cause constraint | src/components/CauseTreeEditor.tsx | Add helper, update two checks |
| Tests | src/store/problems.test.ts | Add regression test |

## Assumptions
1. [ASSUMPTION] Fix applies only to CauseTreeEditor — ProblemTree is read-only.
2. [ASSUMPTION] Descendant check is already correct but gets same helper for symmetry.
