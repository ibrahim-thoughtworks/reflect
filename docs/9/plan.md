# Plan: add cause and edit (#9)

## Objective
Four focused improvements: cancel button for cause input, relaxed save condition,
edit button in detail view, and full edit mode for AddProblem.

## Changes

### 1. Cancel button in CauseTreeEditor action slot
In the isInputting branch of the action slot, add a Cancel button that calls:
  setInputtingFor(null); setInputValue('')

### 2. Relaxed canSave
Replace:
  const canSave = !problemOpen && nodes.every(n => n.status === 'closed')
With:
  const canSave = nodes.length > 0 && !inputtingFor && !linkCandidate && !linkingFromId

At least one cause exists and no operation is mid-way.

### 3. updateProblem in store
export function updateProblem(id: string, updated: Problem): void {
  const list = getProblems()
  const idx = list.findIndex(p => p.id === id)
  if (idx !== -1) {
    list[idx] = updated
    localStorage.setItem('reflect_problems', JSON.stringify(list))
  }
}

### 4. causeTreeToEditorNodes conversion helper
src/lib/causeTreeToEditorNodes.ts:
  Recursively flattens CauseNode[] into EditorNode[] with correct parentId,
  depth, status: 'closed', and all groupId/linkedToId fields copied through.
  problemOpen is set to true so users can add more root-level causes.

### 5. AddProblem edit mode
Props change:
  type Props = { onDone: () => void; onCancel: () => void; existingProblem?: Problem }

On mount with existingProblem:
- description = existingProblem.description
- phase = 'causes'
- nodes = causeTreeToEditorNodes(existingProblem.causes)
- problemOpen = true (allow adding more causes)

On save with existingProblem: call updateProblem(existingProblem.id, ...) instead of
saveProblem. createdAt is preserved.

### 6. ProblemDetail Edit button
Add onEdit: (id: string) => void to Props.
Add an "Edit" button in the header next to Back.

### 7. App.tsx edit navigation
Add view state 'edit' and editingProblemId: string | null.
goEdit(id) sets view='edit', editingProblemId=id.
Render: if view==='edit' && editingProblemId → <AddProblem existingProblem=... onDone=goHome onCancel=goHome />
Pass onEdit={goEdit} to ProblemDetail.

## Affected Areas
- src/components/CauseTreeEditor.tsx
- src/store/problems.ts
- src/lib/causeTreeToEditorNodes.ts (new)
- src/pages/AddProblem.tsx
- src/pages/ProblemDetail.tsx
- src/App.tsx

## Assumptions
1. [ASSUMPTION] Edit starts in causes phase (description shown but could also be edited
   if user goes back to describe manually — AddProblem already handles phase switching).
2. [ASSUMPTION] createdAt is preserved on update; only description and causes change.
3. [ASSUMPTION] problemOpen=true on edit load so users can add more root-level causes.

## Status: Completed
Implemented in 2 tasks. All 31 tests passing. Final commit: a6a6ae6.
