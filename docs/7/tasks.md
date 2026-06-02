# Tasks: bug — center nodes (#7)

## Task 1: Horizontal centering and re-centre button in CauseTreeEditor and ProblemTree

**Acceptance Criteria**
- [ ] Editor tree is horizontally centred when the causes phase opens
- [ ] Detail tree is horizontally centred when ProblemDetail opens
- [ ] Narrow trees (canvasW < containerW) centred via CSS
- [ ] Wide trees (canvasW > containerW) centred via scrollLeft on mount
- [ ] Scrolling away reveals a ⊕ Centre button
- [ ] Clicking Centre snaps back to centre (smooth scroll)
- [ ] Button disappears when already centred
- [ ] Y-axis scroll unaffected
- [ ] Build passes, all 20 tests pass

**Files**
- src/components/CauseTreeEditor.tsx
- src/components/ProblemTree.tsx

**Complexity:** S
