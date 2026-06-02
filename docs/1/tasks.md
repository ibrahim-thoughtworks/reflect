# Tasks: add problems (#1)

## Task 1: Bootstrap Vite + React + TypeScript + Tailwind project ✓

**Status:** Committed

---

## Task 2: Types and localStorage data layer (REVISED)

**Description**
Define `CauseNode` (recursive tree node) and `Problem` types. `CauseNode` replaces the
former `WhyAnswer` — a node has text, an actionable-root-cause flag, and an array of
child `CauseNode`s. `Problem` has `causes: CauseNode[]` instead of `whys: WhyAnswer[]`.
Store module stays the same: `getProblems()` and `saveProblem()`.

**Acceptance Criteria**
- [ ] `src/types.ts` exports `CauseNode` and `Problem` matching the revised data model
- [ ] `src/store/problems.ts` exports `getProblems()`, `saveProblem(p: Problem)`
- [ ] `getProblems()` returns `[]` when localStorage is empty
- [ ] `saveProblem()` appends without overwriting
- [ ] Round-trip test: save a problem with a nested CauseNode tree, re-read, values match

**Files Likely Affected**
- `src/types.ts`
- `src/store/problems.ts`
- `src/store/problems.test.ts`
- `src/pages/Home.tsx` (rootCauseCount helper updated)

**Dependencies**
- Depends on Task 1

**Estimated Complexity:** S

---

## Task 3: App shell with view-state navigation ✓

**Status:** Committed

---

## Task 4: Home screen — problem list ✓

**Status:** Committed (rootCauseCount helper updated in Task 2 revision)

---

## Task 5: Add Problem wizard — problem input and tree-based 5 Whys flow (REVISED)

**Description**
Full DFS wizard. AddProblem manages three phases: describe (step 0), whyCauses (DFS
traversal), selectRootCauses (Task 6). Internally uses a flat WizardNode list + pending
stack for DFS. WhyStep shows a breadcrumb (path from problem to current node), a prompt
("Why did X happen?" / "Any other cause for X?"), textarea, Next and Skip/Done buttons.
Max depth 5 levels.

**Acceptance Criteria**
- [ ] Step 0: textarea for problem; "Start 5 Whys" disabled until non-empty
- [ ] WhyStep shows breadcrumb of current path
- [ ] First cause for a node: prompt "Why did [X] happen?", Skip button labelled "Skip"
- [ ] Subsequent causes: prompt "Any other cause for [X]?", skip button labelled "Done"
- [ ] Next disabled when textarea is empty
- [ ] Skip on first cause: node becomes leaf; wizard advances to next pending node
- [ ] Skip/Done after ≥1 cause: DFS into first child; then siblings in order
- [ ] Level-5 nodes are added to tree but wizard does not ask about them
- [ ] After all nodes visited, transitions to root cause selection (Task 6 placeholder)

**Files Likely Affected**
- `src/pages/AddProblem.tsx`
- `src/components/WhyStep.tsx`

**Dependencies**
- Depends on Tasks 2, 3

**Estimated Complexity:** M

---

## Task 6: Root cause selection and save

**Description**
RootCauseSelector shows all cause nodes (indented by depth). User checks any as actionable
root causes. "Save Problem" reconstructs the CauseNode tree, marks selections, writes to
localStorage, and navigates home.

**Acceptance Criteria**
- [ ] All cause nodes shown, indented by depth level
- [ ] Each node is checkable; default unchecked
- [ ] "Save Problem" builds CauseNode tree with isActionableRootCause set per selection
- [ ] Saves full Problem to localStorage via saveProblem
- [ ] Navigates home; new problem visible in list

**Files Likely Affected**
- `src/components/RootCauseSelector.tsx` — new
- `src/pages/AddProblem.tsx` — integrate RootCauseSelector as final phase

**Dependencies**
- Depends on Tasks 2, 5

**Estimated Complexity:** S

---

## Task 7: Problem detail — SVG tree view

**Description**
ProblemDetail page + ProblemTree SVG component. Renders the problem as root node at
top-centre. Each CauseNode renders below its parent; siblings are laid out horizontally.
Vertical connector lines link parent to children. Leaf nodes that are actionable root
causes have amber border + "Root Cause" badge. Back button returns home.

**Acceptance Criteria**
- [ ] Problem description node at top-centre
- [ ] Cause nodes branch below their parent, connected by lines
- [ ] Multiple children at the same level are laid out side by side
- [ ] Actionable root cause nodes: amber border + badge
- [ ] Regular nodes: white/neutral
- [ ] Back button navigates home
- [ ] Readable on 1280 px wide screen

**Files Likely Affected**
- `src/pages/ProblemDetail.tsx`
- `src/components/ProblemTree.tsx`

**Dependencies**
- Depends on Tasks 2, 3, 4

**Estimated Complexity:** L
