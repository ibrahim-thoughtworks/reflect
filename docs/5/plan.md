# Plan: bug 2 (#5)

## Objective
Give the cause-editor and detail-view near-fullscreen real estate. A fixed inset-4
(16 px) gap on all sides keeps the container visually floating.

## Approach

### AddProblem causes phase
Replace centered-card wrapper with fixed inset-4 container. Header strip at top,
CauseTreeEditor in flex-1 overflow-auto area below. Describe phase unchanged.

### ProblemDetail
Replace min-h-screen layout with fixed inset-4 flex-col. Header stays top, main
becomes flex-1 overflow-auto so tree scrolls inside the fixed box.

### Background
Both pages sit inside App.tsx. fixed inset-4 floats above the gray background,
creating the narrow border visual.

## Affected Areas
- src/pages/AddProblem.tsx — causes-phase wrapper
- src/pages/ProblemDetail.tsx — page wrapper + main

## Assumptions
1. [ASSUMPTION] inset-4 (16 px) satisfies "little bit small gap in every side".
2. [ASSUMPTION] Describe phase stays as centered card.
3. [ASSUMPTION] No changes to CauseTreeEditor or ProblemTree needed.

## Status: Completed
Implemented in 1 task. All 14 tests passing. Final commit: 81ae655.
