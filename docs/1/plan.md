# Plan: add problems (#1)

## Objective
Build a greenfield React + Vite + TypeScript "Reflect" app. Users add a problem, walk through
a tree-structured 5 Whys flow (each node can have multiple causes), then select any nodes as
actionable root causes. All data is persisted in localStorage. The main screen lists problems;
clicking one shows a graphical top-down tree with the problem at root, causes branching below,
and actionable root causes highlighted.

## Scope

### In Scope
- Vite + React + TypeScript project bootstrap with Tailwind CSS
- Main screen: problem list + "Add Problem" button
- Add Problem wizard: problem description input, then tree-based 5 Whys DFS flow
- Root cause selection: all cause nodes shown; user picks any as actionable
- localStorage persistence (problems + full cause tree + root cause selections)
- Problem detail view: graphical SVG tree — problem at top, cause nodes below with connector
  lines, actionable root cause nodes highlighted (amber border + badge)

### Out of Scope
- Backend / API / auth
- Edit or delete existing problems
- Export / share

## Approach

Bootstrap a Vite React TS project at the repo root. Use Tailwind CSS. Simple view-state
switch in App.tsx for three views: Home, AddProblem, ProblemDetail.

### Data model (stored in localStorage as JSON)

```ts
type CauseNode = {
  id: string
  text: string
  isActionableRootCause: boolean
  children: CauseNode[]           // recursive — a node can have multiple children
}

type Problem = {
  id: string
  description: string
  causes: CauseNode[]             // root-level causes (level 1)
  createdAt: number
}
```

Each problem has a tree of causes up to 5 levels deep. A node can have any number of
children at the next level.

### Add Problem Wizard

Three phases:

**Phase 1 — Describe:** free-text input → "Start 5 Whys"

**Phase 2 — Tree-based 5 Whys (DFS traversal):**

The wizard visits each node depth-first. For every node visited it asks "Why did [node]
happen?" The user adds causes one at a time (Next after each). When done with a node's
causes the user clicks Skip/Done, and the wizard auto-advances to the next unfinished
node in DFS order.

- A breadcrumb shows the path from the problem to the current node (e.g.
  `Problem → lazy to read → no interest → [entering here]`).
- Skip on the *first* cause of a node: node becomes a leaf (no causes).
- Skip/Done after entering ≥1 cause: finished collecting causes for this node; wizard
  dives depth-first into the first child.
- Maximum depth: 5 levels. Level-5 nodes are always leaves (wizard does not ask about them).

DFS traversal uses a pending stack. When the user finishes a node (Skip/Done), all
children of that node whose depth < 5 are pushed to the front of the stack in reverse
order so the first child is visited next.

**Phase 3 — Select root causes:**
All cause nodes are shown (indented by depth). User checks any as actionable root causes.
"Save Problem" writes the full tree to localStorage and returns home.

### Problem detail tree (SVG)
Problem node at top-centre. Cause nodes below, connected by vertical lines. Nodes branch
when a parent has multiple children. Leaf nodes that are actionable root causes get an
amber border and "Root Cause" badge.

## Affected Areas

| Area | Files / Modules | Change Type |
|------|----------------|-------------|
| Project root | `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` | Add (bootstrap) |
| App shell | `src/main.tsx`, `src/App.tsx` | Add |
| Data layer | `src/store/problems.ts` (localStorage CRUD) | Add |
| Types | `src/types.ts` | Add |
| Home screen | `src/pages/Home.tsx` | Add |
| Add Problem wizard | `src/pages/AddProblem.tsx`, `src/components/WhyStep.tsx`, `src/components/RootCauseSelector.tsx` | Add |
| Problem detail | `src/pages/ProblemDetail.tsx`, `src/components/ProblemTree.tsx` | Add |

## Assumptions
1. [ASSUMPTION] Tailwind CSS v3 for styling.
2. [ASSUMPTION] Simple view-state switch in App.tsx (no React Router).
3. [ASSUMPTION] SVG-based tree for detail view (reliable cross-browser connector lines).
4. [ASSUMPTION] No edit/delete in this story.
5. [ASSUMPTION] localStorage is sufficient for persistence.
6. [ASSUMPTION] Wizard internally uses a flat node list for React state; tree is
   reconstructed at save time.

## Open Questions (resolved)
| # | Question | Answer |
|---|----------|--------|
| 1 | Which nodes can be actionable root causes? | Any node at any level |
| 2 | Can user exit 5 Whys early? | No — only Skip (= no more causes for this node) |
| 3 | CSS framework? | Tailwind CSS |
| 4 | Tree shape? | Graphical SVG tree, branching, problem at top, connector lines |
| 5 | Multiple causes per node? | Yes — one at a time via Next; done via Skip/Done |
| 6 | DFS or BFS traversal? | DFS — complete one branch fully before moving to siblings |

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| SVG layout complex for branching tree | Compute x positions recursively using subtree width |
| DFS traversal state complex in React | Use flat pending-stack approach; push children on skip |
| localStorage size limits | Text-only data; 5 MB limit is sufficient |
