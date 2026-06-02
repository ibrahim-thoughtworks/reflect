# Tasks: bug 1 (#4)

## Task 1: Fix group-aware ancestor check in toggleRootCause

**Description**
Add isNodeOrGroupEffectivelyRC helper and use it in both ancestor and descendant checks
inside toggleRootCause in CauseTreeEditor.tsx. Add a regression test.

**Acceptance Criteria**
- [ ] isNodeOrGroupEffectivelyRC returns true if the node itself OR any group sibling is RC
- [ ] Ancestor check uses the new helper
- [ ] Descendant check uses the new helper
- [ ] F cannot be marked RC when its parent C-primary is in a group where C-secondary is RC
- [ ] All 7 existing tests pass + new regression test passes

**Files**
- src/components/CauseTreeEditor.tsx
- src/store/problems.test.ts

**Dependencies** — None
**Complexity:** S
