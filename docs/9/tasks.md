# Tasks: add cause and edit (#9)

## Task 1: Cancel button + relaxed canSave in CauseTreeEditor

**Acceptance Criteria**
- [ ] Clicking Cancel in the input form clears input and hides the form
- [ ] canSave = nodes.length > 0 && no mid-operation (no inputtingFor, linkCandidate, linkingFromId)
- [ ] Save enabled with one closed cause even if problemOpen is true
- [ ] Build passes, all 31 tests pass

**Files** — src/components/CauseTreeEditor.tsx
**Complexity:** S

---

## Task 2: Store updateProblem + conversion helper + edit wiring

**Description**
Add updateProblem to store. Create causeTreeToEditorNodes helper. Update AddProblem
to accept existingProblem prop (pre-load description + nodes, call updateProblem on save).
Add Edit button to ProblemDetail. Update App.tsx for edit navigation.

**Acceptance Criteria**
- [ ] updateProblem replaces problem in localStorage by id
- [ ] causeTreeToEditorNodes produces correct flat EditorNode[] from CauseNode tree
- [ ] AddProblem with existingProblem: starts in causes phase, pre-fills description+nodes
- [ ] Saving in edit mode updates the existing problem (same id, same createdAt)
- [ ] ProblemDetail has Edit button; clicking navigates to edit mode
- [ ] Returning from edit shows updated problem in detail view and home list
- [ ] Build passes, all tests pass

**Files**
- src/store/problems.ts
- src/lib/causeTreeToEditorNodes.ts (new)
- src/pages/AddProblem.tsx
- src/pages/ProblemDetail.tsx
- src/App.tsx

**Complexity:** M
