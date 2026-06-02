# Context Summary: Issue #2 — UI based cause adder

## Issue
- **State:** open
- **Labels:** (none)

## What the issue asks for
Replace the current sequential wizard (breadcrumb + text prompt per node) with a **live
interactive tree** during the cause-adding flow. The user sees the full growing tree at all
times. Each un-resolved node shows **Add / Skip** buttons below it. Clicking Add opens an
inline input directly below that node in the tree. Clicking Skip closes that branch (no more
children). Any cause node can be clicked to toggle it as an actionable root cause — with the
constraint that a path (root → leaf) may only have one root cause: if a child is already
marked, its ancestors on that path cannot be marked, and vice versa. A Save button activates
once every node has been resolved (skipped or had children added and then skipped).

## Linked issues
| # | Title | Relationship |
|---|-------|-------------|
| 1 | add problems | Parent — this story replaces the whyCauses + selectRootCauses phases |

## Codebase findings
| Area | Detail |
|------|--------|
| Tech stack | React 19 + Vite + TypeScript + Tailwind CSS v3 |
| Entry point | src/pages/AddProblem.tsx — describe phase stays; whyCauses + selectRootCauses replaced |
| Tree renderer | src/components/ProblemTree.tsx — layout algorithm reusable |
| Types | src/types.ts — CauseNode, Problem unchanged |
| Store | src/store/problems.ts — unchanged |
| Tests | Vitest + jsdom, 6 tests in src/store/problems.test.ts |

## Key design decisions (confirmed by user)
| # | Question | Answer |
|---|----------|--------|
| 1 | Multiple root causes? | Yes — but at most one per path (root→leaf) |
| 2 | Add input placement | Inline below the node in the tree |
| 3 | Root cause marking | Click any node to toggle; path constraint enforced |
| 4 | Save trigger | Save button, activates when every path is filled |

## Node lifecycle
- **open**: node exists, Add / Skip buttons visible below it
- **inputting**: inline input open to type a child cause
- **closed**: user clicked Skip — no more children on this branch

## Initial observations
- The layout engine in ProblemTree.tsx (subtreeW, buildLayout, Connectors) can be adapted
  for the interactive editor with minimal changes.
- "Inline below the node" means Add/Skip/input occupy vertical space in the tree canvas at
  the node's child position — the layout must allocate space for them.
- Root-cause path constraint requires ancestor + descendant checks on toggle.
- The describe phase (step 0) of AddProblem.tsx is unchanged.
- WhyStep.tsx, RootCauseSelector.tsx, and the pendingStack logic become obsolete.
