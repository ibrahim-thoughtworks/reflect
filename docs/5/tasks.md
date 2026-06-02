# Tasks: bug 2 (#5)

## Task 1: Near-fullscreen layout for editor and detail view

**Description**
Update AddProblem causes-phase wrapper to fixed inset-4 with flex column layout.
Update ProblemDetail wrapper to fixed inset-4 with flex column layout and flex-1 overflow-auto main.

**Acceptance Criteria**
- [ ] AddProblem causes phase fills viewport minus 16 px each side
- [ ] AddProblem describe phase unchanged (centered small card)
- [ ] ProblemDetail fills viewport minus 16 px each side
- [ ] Tree scrolls inside the fixed container, not the page
- [ ] Back / Cancel / Save buttons remain visible without scrolling
- [ ] Build passes, all 14 tests pass

**Files**
- src/pages/AddProblem.tsx
- src/pages/ProblemDetail.tsx

**Dependencies** — None
**Complexity:** S
