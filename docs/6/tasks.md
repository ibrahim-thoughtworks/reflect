# Tasks: delink grouped problem (#6)

## Task 1: Inline unlink prompt and unlinkNode logic in CauseTreeEditor

**Description**
Add unlinkingId state. Update handleNodeClick so secondary nodes show the unlink prompt
instead of triggering root-cause toggle. Render "Remove link?" / Unlink / Keep inside the
node when selected. Implement unlinkNode to clear linkedToId, groupId, isActionableRootCause,
set status open, and clean up primary's groupId when no secondaries remain.

**Acceptance Criteria**
- [ ] Clicking a secondary node shows the inline "Remove link?" prompt
- [ ] Clicking the same secondary again (or Keep) dismisses the prompt
- [ ] Unlink: node loses linkedToId, groupId, isActionableRootCause; status becomes open
- [ ] Unlink: Add/Skip slot reappears below the now-open node
- [ ] Unlink: primary loses groupId when no other secondaries remain
- [ ] Unlink: primary retains groupId when other secondaries still exist
- [ ] Non-secondary nodes are unaffected (root-cause toggle still works)
- [ ] All 14 existing tests pass + new unit tests pass

**Files**
- src/components/CauseTreeEditor.tsx
- src/components/CauseTreeEditor.test.ts

**Dependencies** — None
**Complexity:** S
