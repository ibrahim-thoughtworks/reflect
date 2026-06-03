# Context Summary: Issue #12 — mark solution complexity

## Issue
- **State:** open

## What the issue asks for
After saving solutions, navigate to a drag-and-drop quadrant matrix where users place
all solution stickies. Quadrant labels: Quick Win (top-left), Major Project (top-right),
Fill-in (bottom-left), Thankless (bottom-right). Sticky colour derived from quadrant.

## Flow
Save Solutions → Complexity Matrix (edit) → Save → Detail view (read-only matrix shown)

## Key decisions (confirmed by user)
1. Navigation after save: detail view
2. Save disabled until all stickies are placed
3. Detail view: read-only; edit mode: fully draggable (side panel + within matrix)
4. Unplaced stickies: right side panel initially

## Data model
Solution type changes from string to object:
  type Solution = { text: string; matrixX?: number; matrixY?: number }
  CauseNode.solutions?: Solution[]
  matrixX/Y: 0-1 normalised (undefined = unplaced)

## Quadrant colours
  Top-left  x<0.5, y<0.5  Quick Win      → yellow/gold
  Top-right x>=0.5,y<0.5  Major Project  → silver/gray
  Bot-left  x<0.5, y>=0.5 Fill-in        → green
  Bot-right x>=0.5,y>=0.5 Thankless      → white

## Affected files
- src/types.ts (new Solution type)
- src/pages/SolveProblem.tsx (migrate string[] → Solution[])
- src/pages/ComplexityMatrix.tsx (new — drag-and-drop editor)
- src/components/ComplexityMatrixView.tsx (new — read-only for detail)
- src/pages/ProblemDetail.tsx (show matrix view)
- src/App.tsx (add matrix view, wire navigation)
