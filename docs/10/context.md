# Context Summary: Issue #10 — remove skip in editor window

## Issue
- **State:** open

## What the issue asks for
Remove the "Skip" button from CauseTreeEditor. Every path always stays open (Add button
always available on leaf nodes). Save is always enabled once there is at least 1 cause.
Editor only — detail view unchanged.

## Changes
1. Remove Skip button from action slots
2. Remove problemOpen state, skipNode function, setProblemOpen calls
3. subtreeW/buildLayout: remove problemOpen param (root always open)
4. isLeaf visual: node with no real children (not dependent on status)
5. causeTreeToEditorNodes: load nodes as open instead of closed
6. canSave: already correct from #9 (nodes.length > 0 + no mid-op)
7. Update hint text

## Affected files
- src/components/CauseTreeEditor.tsx
- src/lib/causeTreeToEditorNodes.ts
