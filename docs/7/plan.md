# Plan: bug — center nodes (#7)

## Objective
Tree starts horizontally centred on open; floating re-centre button appears after scroll.

## Approach

### Centering wrapper
Wrap the canvas div in:
  <div style={{ minWidth: canvasW, display: 'flex', justifyContent: 'center' }}>
    <div className="relative" style={{ width: canvasW, height: canvasH }}>
      ...

When canvasW < containerW → CSS centres the canvas. When canvasW > containerW → canvas
fills its wrapper, and scrollLeft handles centering.

### Auto-centre on open / resize
useRef on the overflow-auto container. useEffect([canvasW]) sets:
  el.scrollLeft = Math.max(0, (canvasW - el.clientWidth) / 2)

### Re-centre button
onScroll computes centreX = max(0, (canvasW - el.clientWidth) / 2) and sets
showRecenter = |scrollLeft - centreX| > 20.
Button is absolute-positioned in a relative wrapper ABOVE the scroll div.

## Affected Areas
- src/components/CauseTreeEditor.tsx
- src/components/ProblemTree.tsx

## Assumptions
1. [ASSUMPTION] Y-axis scroll is untouched.
2. [ASSUMPTION] Re-centre threshold of 20 px prevents flickering.
3. [ASSUMPTION] No shared hook needed — logic is small enough to duplicate.
