# Tasks: connect with the problem (#3)

## Task 1: Types, group colour utility, and buildCauseTree update

**Description**
Add groupId? and linkedToId? to CauseNode in src/types.ts. Create src/lib/groupColours.ts
with 6-colour palette and groupColour(id, allIds) lookup. Update buildCauseTree in
AddProblem.tsx to copy groupId/linkedToId; secondary nodes get children: []. Add round-trip
test for a problem with a secondary node.

**Acceptance Criteria**
- [ ] CauseNode exports groupId?: string and linkedToId?: string
- [ ] groupColours.ts exports GROUP_COLOURS array and groupColour() function
- [ ] buildCauseTree preserves groupId/linkedToId; secondary nodes get children: []
- [ ] All existing 6 tests pass; new round-trip test for secondary node passes

**Files**
- src/types.ts
- src/lib/groupColours.ts (new)
- src/pages/AddProblem.tsx
- src/store/problems.test.ts

**Dependencies** — None
**Complexity:** S

---

## Task 2: Link detection and secondary node behaviour in CauseTreeEditor

**Description**
Extend EditorNode with groupId?/linkedToId?. In confirmInput, check for exact
case-insensitive text match among existing primaries. If found, show "Link to [X]?" /
"Add as new" prompt. On Link: assign shared groupId to both, mark new as secondary
(linkedToId, status: closed). Update subtreeW/buildLayout to use effectiveChildren for
secondaries. Secondary nodes render with group colour, "↔" badge, no Add/Skip slot.

**Acceptance Criteria**
- [ ] EditorNode has groupId? and linkedToId?
- [ ] Matching text triggers link prompt in action slot
- [ ] Link: both nodes get groupId; new gets linkedToId and is closed
- [ ] Add as new: independent node, no groupId
- [ ] Secondary node renders with group colour and ↔ badge
- [ ] Secondary's effective children (primary's) appear in layout
- [ ] No Add/Skip below secondary
- [ ] Build and tests pass

**Files** — src/components/CauseTreeEditor.tsx
**Dependencies** — Task 1
**Complexity:** M

---

## Task 3: Highlight navigation and extended root-cause constraint in CauseTreeEditor

**Description**
Add highlightGroupId state. Clicking a grouped node highlights all others in the group
with a pulsing ring for 1.5 s. Extend root-cause toggle to collect ancestors/descendants
across ALL group members before blocking.

**Acceptance Criteria**
- [ ] Clicking grouped node pulses all others in group for 1.5 s
- [ ] Root-cause block fires when ancestor of ANY group member is root cause
- [ ] Root-cause block fires when descendant of ANY group member is root cause
- [ ] Unmark always works

**Files** — src/components/CauseTreeEditor.tsx
**Dependencies** — Task 2
**Complexity:** S

---

## Task 4: ProblemTree — linked node rendering and highlight navigation

**Description**
Add flattenCauseTree and effectiveChildren helpers. Replace node.children with
effectiveChildren(node, flat) in subtreeW/buildLayout/rendering. Apply group colours.
Add highlightGroupId state; clicking grouped node pulses others for 1.5 s.

**Acceptance Criteria**
- [ ] Secondary nodes show primary's children in correct layout position
- [ ] Grouped nodes render with group colour (border + bg)
- [ ] Amber overrides group colour when both apply
- [ ] Clicking grouped node highlights others with pulse ring for 1.5 s
- [ ] Build and all 6 tests pass

**Files** — src/components/ProblemTree.tsx
**Dependencies** — Task 1
**Complexity:** S
