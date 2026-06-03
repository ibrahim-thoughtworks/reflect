# Tasks: Solve problem (#11)

## Task 1: Types, SolveProblem page, navigation wiring

**Description**
Add solutions?: string[] to CauseNode. Create SolveProblem.tsx. Update AddProblem
to call onSave(id) instead of onDone(). Wire App.tsx to show solve view after save.

**Acceptance Criteria**
- [ ] CauseNode has solutions?: string[]
- [ ] After Save Problem, Solve window opens (new and edit modes)
- [ ] Root cause nodes listed with cause text in amber badge
- [ ] User can add multiple solutions per root cause (Enter or Add button)
- [ ] User can remove individual solutions with ✕
- [ ] Save Solutions persists solutions to localStorage and goes to Home
- [ ] If no root causes: message + Skip → Home
- [ ] Build passes, all 31 tests pass

**Files**
- src/types.ts
- src/pages/SolveProblem.tsx (new)
- src/pages/AddProblem.tsx
- src/App.tsx
- src/store/problems.test.ts

**Complexity:** M
