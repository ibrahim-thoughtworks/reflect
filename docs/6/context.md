# Context Summary: Issue #6 — delink grouped problem

## Issue
- **State:** open

## What the issue asks for
Clicking a secondary (↔ linked) node shows an inline "Unlink?" prompt. Confirming makes
the secondary an independent open node (Add/Skip reappears). Root cause marks on the
unlinked node are cleared; primary loses groupId if no secondaries remain.

## Behaviour to add
- Click secondary node → show inline unlink prompt (not root-cause toggle)
- Confirm Unlink → clear linkedToId, groupId, isActionableRootCause; set status: open
- Cancel → dismiss, stay linked

## Affected files
- src/components/CauseTreeEditor.tsx (new unlinkingId state + unlink logic)
- src/components/CauseTreeEditor.test.ts (new unit test)
