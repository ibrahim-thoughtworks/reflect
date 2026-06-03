# Tasks: mark solution complexity (#12)

## Task 1: Types + SolveProblem migration (string[] → Solution[])

**Acceptance Criteria**
- [ ] Solution type exported from types.ts
- [ ] CauseNode.solutions?: Solution[]
- [ ] SolveProblem works with Solution[] (add/remove text, preserves matrixX/Y)
- [ ] saveSolutions calls onNext(id) → navigate to matrix
- [ ] All 33 tests pass

**Files**
- src/types.ts
- src/pages/SolveProblem.tsx
- src/store/problems.test.ts (update fixture)

**Complexity:** S

---

## Task 2: ComplexityMatrix drag-and-drop editor + ComplexityMatrixView + wiring

**Description**
New ComplexityMatrix.tsx page with pointer-event drag. Read-only
ComplexityMatrixView.tsx component. ProblemDetail shows matrix when solutions
have positions. App.tsx adds matrix view.

**Acceptance Criteria**
- [ ] Right side panel lists all unplaced stickies
- [ ] Stickies can be dragged from side panel into matrix
- [ ] Placed stickies can be dragged to reposition within matrix
- [ ] Sticky colour changes based on quadrant (gold/silver/green/white)
- [ ] Save disabled until all stickies are placed
- [ ] Save → updateProblem with matrixX/Y → navigate to detail
- [ ] Detail view shows read-only matrix when solutions have positions
- [ ] Build passes, all tests pass

**Files**
- src/pages/ComplexityMatrix.tsx (new)
- src/components/ComplexityMatrixView.tsx (new)
- src/pages/ProblemDetail.tsx
- src/App.tsx

**Complexity:** L
