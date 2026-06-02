# Tasks: UI based cause adder (#2)

## Task 1: CauseTreeEditor — live tree with Add / Skip interaction

**Description**
Create src/components/CauseTreeEditor.tsx. Manages an EditorNode[] flat list. Renders the
problem node at the top and all cause nodes using the layout algorithm adapted from
ProblemTree.tsx. Below each open node, renders an Add / Skip action area (or inline input
when the user has clicked Add). Clicking Add shows an input; confirming creates a new child
open node. Clicking Skip closes the node. Level-5 nodes show no action area. SVG connector
lines connect parent to children. Canvas resizes as nodes grow.

**Acceptance Criteria**
- [ ] Problem node renders at top-centre in indigo
- [ ] Open nodes show Add / Skip below them
- [ ] Clicking Add shows an inline input field below the node
- [ ] Confirming the input creates a child open node in the tree
- [ ] Multiple children can be added to the same parent before clicking Skip
- [ ] Clicking Skip closes the node; no-children nodes render as greyed leaf
- [ ] Level-5 nodes have no action area
- [ ] SVG connectors render correctly as tree grows
- [ ] Canvas resizes as nodes are added

**Files Likely Affected**
- src/components/CauseTreeEditor.tsx — new

**Dependencies**
- None

**Estimated Complexity:** L

---

## Task 2: Root cause toggling with path constraint

**Description**
Add root cause toggle to CauseTreeEditor. Clicking any cause node toggles
isActionableRootCause. Before marking: check no ancestor is already a root cause, check no
descendant is already a root cause. If blocked, show a brief visual indicator. Marked nodes
get amber border + "Root Cause" badge.

**Acceptance Criteria**
- [ ] Clicking a non-root-cause node marks it amber with "Root Cause" badge
- [ ] Clicking an already-marked node unmarks it (always allowed)
- [ ] Clicking a node whose ancestor is already root cause is blocked (visual feedback)
- [ ] Clicking a node whose descendant is already root cause is blocked (visual feedback)
- [ ] Multiple root causes allowed across different paths
- [ ] Root cause state preserved as more nodes are added

**Files Likely Affected**
- src/components/CauseTreeEditor.tsx — extend

**Dependencies**
- Depends on Task 1

**Estimated Complexity:** S

---

## Task 3: Wire CauseTreeEditor into AddProblem and clean up

**Description**
Replace whyCauses + selectRootCauses phases in AddProblem.tsx with CauseTreeEditor. Save
button inside CauseTreeEditor enabled when all nodes are closed. On save, build CauseNode
tree, call saveProblem, navigate home. Delete WhyStep.tsx and RootCauseSelector.tsx.

**Acceptance Criteria**
- [ ] After describing a problem and clicking Start, CauseTreeEditor renders
- [ ] Save disabled while any node is open
- [ ] Save activates when all nodes closed (including zero-cause case)
- [ ] Save writes full Problem to localStorage and navigates home
- [ ] Problem appears in Home list after save
- [ ] WhyStep.tsx and RootCauseSelector.tsx deleted
- [ ] Build passes, all 6 tests pass

**Files Likely Affected**
- src/pages/AddProblem.tsx — simplify
- src/components/WhyStep.tsx — delete
- src/components/RootCauseSelector.tsx — delete

**Dependencies**
- Depends on Tasks 1, 2

**Estimated Complexity:** S
