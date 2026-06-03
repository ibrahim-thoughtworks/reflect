# Plan: mark solution complexity (#12)

## Objective
Drag-and-drop quadrant matrix for placing solution stickies by effort/impact.
Persisted as normalised (x,y) on each Solution. Read-only in detail view,
editable in the edit flow.

## Data model
type Solution = { text: string; matrixX?: number; matrixY?: number }
CauseNode.solutions?: Solution[]  (was string[])

## ComplexityMatrix page (editor)
Layout:
  [  quadrant matrix (centre, flex-1)  ] [ side panel: unplaced stickies ]

Quadrant matrix: 4 labelled quadrants separated by dashed centre lines.
Side panel: right side, lists stickies not yet placed (matrixX undefined).
Save disabled until side panel is empty (all stickies placed).

Drag implementation (pointer events, no library):
- onPointerDown on a sticky: start drag, capture pointer
- Global onPointerMove: update drag ghost position
- onPointerUp: compute drop target position relative to matrix container;
  if inside matrix → set matrixX/Y (normalised); if outside → no-op

In-matrix stickies: draggable to reposition within the matrix.
Side-panel stickies: draggable into the matrix; cannot go back to panel once placed.

Sticky colours (derived from position, applied when placed):
  Quick Win   (x<0.5, y<0.5): bg-yellow-300
  Major Proj  (x≥0.5, y<0.5): bg-gray-300
  Fill-in     (x<0.5, y≥0.5): bg-green-300
  Thankless   (x≥0.5, y≥0.5): bg-white border

## ComplexityMatrixView component (read-only)
Renders the matrix with placed stickies at their (x, y) positions.
No drag events. Used in ProblemDetail.

## SolveProblem changes
Migration: string[] → Solution[] (text only, no matrixX/Y on save).
saveSolutions: call onNext(id) instead of onDone() to navigate to matrix.

## App wiring
Add 'matrix' view. After SolveProblem save → 'matrix'. After matrix save → 'detail'.

## Assumptions
1. [ASSUMPTION] All solutions from all root causes share one matrix.
2. [ASSUMPTION] Sticky size in matrix: 120x72px; in side panel: full width small card.
3. [ASSUMPTION] Matrix container takes remaining viewport space (flex-1).
4. [ASSUMPTION] Cannot remove a placed sticky back to side panel.

## Status: Completed
Implemented in 2 tasks. All 33 tests passing. Final commit: fee853a.
