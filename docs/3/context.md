# Context Summary: Issue #3 — connect with the problem

## Issue
- **State:** open

## What the issue asks for
When adding causes, if the user types a cause that exactly matches an existing cause already
in the tree, the system detects it and prompts "Link to [existing node]?". If confirmed, the
new node becomes a secondary instance that shares the same logical cause. The two instances
get a unique group colour; clicking either highlights the other. Secondary nodes inherit the
primary's children (can't define their own). The root cause constraint extends across shared
nodes: if E is a descendant of B via any path, then B and all other ancestors of E (including
D which also points to B) cannot be root causes. Applies to both CauseTreeEditor (add flow)
and ProblemTree (detail view).

## ASCII diagram from issue
        A
        |
  B     C     D
  |     |     |
  E     F     B   ← B appears twice; D→B is secondary; B→E is already defined

## Codebase findings
| Area | Detail |
|------|--------|
| Types | src/types.ts — CauseNode needs groupId?, linkedToId? |
| Editor internal type | EditorNode in CauseTreeEditor.tsx needs same two fields |
| Editor | src/components/CauseTreeEditor.tsx — input confirm, node rendering, root-cause toggle all need updating |
| Detail view | src/components/ProblemTree.tsx — node rendering and root-cause display need group colour + highlight |
| Store | src/store/problems.ts — no logic change; extra fields pass through |
| Tests | 6 Vitest tests in src/store/problems.test.ts |

## Key design decisions (from user)
| # | Question | Answer |
|---|----------|--------|
| 1 | How to link? | Auto-detect exact text match → inline prompt |
| 2 | Navigate to other instance | Highlight (pulse/glow) the other instance |
| 3 | Which screens? | Both CauseTreeEditor and ProblemTree |

## Data model additions
CauseNode and EditorNode both gain:
  groupId?: string      // non-null = node is part of a linked group
  linkedToId?: string   // non-null = secondary node; primary holds real children

Secondary nodes store children: [] in localStorage; effective children looked up from primary.

## Initial observations
- ProblemTree uses recursive node.children — secondary nodes need effectiveChildren(node, flat)
- Group colour palette: 6-8 distinct colours, assigned by group index; separate from amber and indigo
- Root-cause constraint must traverse ALL parent paths of all group members
