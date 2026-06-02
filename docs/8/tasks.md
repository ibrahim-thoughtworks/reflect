# Tasks: delete node and re-link (#8)

## Task 1: applyDelete + applyRelink pure helpers and unit tests

**Description**
Export applyDelete(id, nodes) and applyRelink(sourceId, targetId, nodes) as pure
functions alongside applyUnlink. Add unit tests for all scenarios.

**Acceptance Criteria**
- [ ] applyDelete: removes node, promotes real children, converts secondaries to open,
      clears RC on deleted and promoted nodes, cleans up groupId
- [ ] applyRelink: no-op on invalid targets, promotes source children, sets linkedToId +
      groupId on source, adds groupId to target
- [ ] Unit tests cover: basic delete, delete with children, delete with secondaries,
      relink basic, relink with children, relink invalid targets
- [ ] All 20 existing tests pass

**Files**
- src/components/CauseTreeEditor.tsx (export helpers)
- src/components/CauseTreeEditor.test.ts

**Dependencies** — None
**Complexity:** S

---

## Task 2: Unified inline panel + linking mode UI integration

**Description**
Replace unlinkingId + handleNodeClick with selectedNodeId + linkingFromId. Render
unified inline panel with contextual buttons. Add linking-mode banner. Wire applyDelete
and applyRelink into the component.

**Acceptance Criteria**
- [ ] Clicking any node toggles its inline panel (click again or ✕ closes it)
- [ ] Panel shows correct options per node type
- [ ] Clicking Link enters linking mode; banner appears
- [ ] Clicking a valid primary target in linking mode creates the link
- [ ] Clicking source node in linking mode cancels
- [ ] Clicking Delete calls applyDelete and closes panel
- [ ] Clicking Unlink calls applyUnlink and closes panel
- [ ] Root cause mark/unmark still works via panel buttons
- [ ] Build passes, all tests pass

**Files**
- src/components/CauseTreeEditor.tsx

**Dependencies** — Task 1
**Complexity:** M
