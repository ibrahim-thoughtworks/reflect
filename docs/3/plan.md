# Plan: connect with the problem (#3)

## Objective
Allow the same cause to appear in multiple branches of a tree without re-entering its
sub-causes. When a user types a cause that exactly matches an existing node, they are offered
a link. Linked instances share a group colour, highlight each other on click, and share
root-cause constraints across all paths. Works in both CauseTreeEditor and ProblemTree.

## Scope

### In Scope
- groupId / linkedToId fields added to CauseNode (persisted) and EditorNode (in-editor)
- Group colour palette utility (6 colours, assigned by insertion order of groupIds)
- CauseTreeEditor: exact text match → inline link prompt; secondary nodes inherit primary's
  sub-causes, show group colour, no Add/Skip
- CauseTreeEditor: click grouped node → highlight (pulse) all other instances; root-cause
  constraint extended across all group members' ancestor/descendant paths
- ProblemTree: secondary nodes rendered with primary's children; group colour; click to highlight

### Out of Scope
- Linking across different problems
- Editing linked group text
- Circular reference prevention beyond max-depth

## Data model additions

CauseNode and EditorNode both gain:
  groupId?: string      // shared by all instances in a linked group
  linkedToId?: string   // set on secondary; primary holds real children[]

Secondary nodes store children: [] in localStorage; effective children looked up from primary.

## Group colour palette

Six distinct colours assigned by group insertion order. Amber (root cause) takes priority.

## Link detection (CauseTreeEditor)

1. User confirms input text T
2. Find first existing primary node (no linkedToId) with matching text (case-insensitive trim)
3. If found: show inline "Link to [X]?" / "Add as new" prompt
4. Link: assign groupId to both, set linkedToId on new node, status: closed immediately
5. Add as new: normal independent node

## Secondary node behaviour

- effectiveChildren: for secondary, use primary's children for layout and display
- No Add/Skip shown; always closed
- Group colour border + "↔ linked" badge

## Root-cause constraint (extended)

Ancestor and descendant checks traverse all group members (primary + secondaries) to collect
all ancestor/descendant nodes before deciding whether to block a toggle.

## ProblemTree

effectiveChildren(node, flat) replaces node.children in layout and rendering.
Highlight state: useState<string|null> for active groupId; pulse ring on matching nodes.

## Affected Areas

| Area | Files | Change Type |
|------|-------|-------------|
| Types | src/types.ts | Modify |
| Group colour util | src/lib/groupColours.ts | Add |
| Editor | src/components/CauseTreeEditor.tsx | Modify |
| Detail tree | src/components/ProblemTree.tsx | Modify |
| Wizard | src/pages/AddProblem.tsx | Modify (buildCauseTree) |

## Assumptions
1. [ASSUMPTION] Text match is case-insensitive, trimmed.
2. [ASSUMPTION] Only primary nodes (no linkedToId) are candidates for matching.
3. [ASSUMPTION] Amber (root cause) takes visual priority over group colour.
4. [ASSUMPTION] Highlight pulse clears automatically after 1.5 s.
5. [ASSUMPTION] groupId is a short random string.

## Status: Completed
Implemented in 4 tasks. All 7 tests passing. Final commit: d5dfbc7.
