# Context Summary: Issue #7 — bug (center nodes)

## Issue
- **State:** open

## What the issue asks for
Tree centred horizontally on open. Re-centre button appears after user scrolls away.
X-axis only; Y-axis unaffected.

## Root cause
Canvas rendered flush-left inside overflow-auto container. Layout already centres the
problem node within the canvas; the canvas just needs to be centred in the container.

## Approach
- Flex justify-center wrapper with minWidth: canvasW → centres narrow canvases via CSS
- useEffect: scrollLeft = (canvasW − containerW) / 2 on mount and canvasW change
- onScroll: show floating ⊕ Centre button when deviation > 20 px
- Button positioned absolute above the scroll div, always visible

## Affected files
- src/components/CauseTreeEditor.tsx
- src/components/ProblemTree.tsx
