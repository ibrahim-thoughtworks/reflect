# Plan: Solve problem (#11)

## Objective
After every Save Problem (new or edit), show a Solve Problem window where users can
add multiple actionable solutions to each marked root cause. Saving solutions
persists them and returns to Home.

## Data model
Add solutions?: string[] to CauseNode. Only set when isActionableRootCause: true
but allowed on any node structurally. Persisted via updateProblem.

## SolveProblem page (src/pages/SolveProblem.tsx)
- Reads problem by id from localStorage
- Flattens CauseNode tree to collect all isActionableRootCause nodes
- Local state: Map<causeId, string[]> for current solutions (pre-filled)
- Per root cause: amber badge with cause text, solution list with ✕ remove,
  text input + Add button (Enter or click)
- Save Solutions → rebuild causes tree with solutions → updateProblem → onDone()
- If no root causes: message + Skip button → onDone()
- Header: "Solutions" title + problem description

## Helper: updateCauseNodeSolutions
Pure recursive function:
  updateCauseNodeSolutions(causes, id, solutions) → CauseNode[]
Finds the node by id anywhere in the tree and sets its solutions field.

## Navigation wiring
AddProblem: replace onDone prop with onSave(id: string).
  - saveProblem returns the new id
  - updateProblem uses existingProblem.id
  - call onSave(id) in both cases

App.tsx:
  - Add 'solve' view and solvingProblemId: string | null state
  - goSolve(id) → sets view='solve', solvingProblemId=id
  - Pass onSave={goSolve} to AddProblem (both add and edit modes)
  - Render SolveProblem when view==='solve' && solvingProblemId

## Assumptions
1. [ASSUMPTION] Solutions are shown in order added; no reordering.
2. [ASSUMPTION] "Save Solutions" always saves (even if solutions list unchanged).
3. [ASSUMPTION] No per-solution editing — only add/remove.
4. [ASSUMPTION] Solve window accessible only after Save (not as a standalone button).

## Status: Completed
Implemented in 1 task. All 33 tests passing. Final commit: 0f989cb.
