# Context Summary: Issue #5 — bug 2

## Issue
- **State:** open

## What the issue asks for
Both the cause-editor (AddProblem causes phase) and the detail view (ProblemDetail) should
expand to near-fullscreen — maximum viewport area with a small uniform gap (~16 px) on every
side — so users see more of the tree without excessive scrolling.

## Current behaviour
- AddProblem causes phase: white card centered on gray bg, max-w-4xl. Wide trees require
  horizontal scrolling even on large screens.
- ProblemDetail: full-height page but tree sits inside px-6 py-8 padding.

## Acceptance criteria
- Window takes maximum viewport with small uniform gap on all sides.
- Applies to both editor (causes phase) and detail view.
- Describe phase can stay as a centered card.

## Approach
- AddProblem causes phase: fixed inset-4 overlay, overflow-auto
- ProblemDetail: fixed inset-4 flex flex-col, tree scrolls inside
- Describe phase: unchanged

## Affected files
- src/pages/AddProblem.tsx
- src/pages/ProblemDetail.tsx
