# Context Summary: Issue #11 — Solve problem

## Issue
- **State:** open

## Flow
Add/Edit causes → Save Problem → Solve Problem window → Save Solutions → Home

## Data model
CauseNode gains: solutions?: string[]

## Solve window
Lists all isActionableRootCause nodes from flattened tree. Each shows its text,
existing solutions (with remove), and an input to add new solutions.
Save Solutions → updateProblem → home.

## Navigation wiring
AddProblem: onDone → onSave(id: string)
App: add 'solve' view + solvingProblemId

## Affected files
- src/types.ts
- src/pages/SolveProblem.tsx (new)
- src/pages/AddProblem.tsx
- src/App.tsx
- src/store/problems.test.ts (new round-trip test)
