# Context Summary: Issue #9 — add cause and edit

## Issue
- **State:** open

## What the issue asks for
1. Cancel button for input in action slot
2. Save enabled with >=1 cause node (no input/link in progress)
3. Edit button in ProblemDetail → navigates to editor with existing data
4. Edit mode for AddProblem: pre-load description + cause tree, updateProblem on save

## Affected files
- src/components/CauseTreeEditor.tsx (cancel btn + canSave)
- src/store/problems.ts (updateProblem)
- src/lib/causeTreeToEditorNodes.ts (new conversion helper)
- src/pages/AddProblem.tsx (existingProblem prop, edit mode)
- src/pages/ProblemDetail.tsx (Edit button + onEdit callback)
- src/App.tsx (edit view + editingProblemId state)
