# Context Summary: Issue #1 — add problems

## Issue
- **State:** open
- **Labels:** (none)
- **Milestone:** (none)

## What the issue asks for
Build a frontend-only "reflect" application where users can add problems and work through the **5 Whys** technique to discover root causes. After completing the 5 Whys flow, the user selects actionable root causes. Problems and their 5 Why answers are persisted locally. The main screen lists all problems, and clicking one reveals the problem + root causes as a tree (with actionable root causes highlighted).

## Linked issues
(none)

## Images
(none)

## Codebase findings
| Area           | Detail |
|----------------|--------|
| Repo structure | Greenfield — only README.md, .git/, .claude/ exist; no source files |
| Relevant files | None yet |
| Test framework | None configured yet |
| Tech stack     | React + Vite + TypeScript (chosen by user) |
| Relevant docs  | None |

## Acceptance Criteria (from issue)
- Only frontend — no backend
- User can add a problem when the "add problem" button is clicked
- The program asks "why?" and the user answers (5 Whys technique)
- If the user cannot answer a "why", there is a skip button
- User can select actionable root causes after the 5 Whys flow
- Problems and 5 Why answers are stored (localStorage)
- User can see added problems on the main screen
- Clicking a problem shows it and its root causes as a tree; actionable root causes are highlighted

## Initial observations
- Greenfield project — we bootstrap a Vite + React + TypeScript project from scratch.
- No backend; persistence via localStorage.
- The 5 Whys flow is an iterative loop (up to 5 "why" questions); each step has a skip option.
- Tree view for root causes requires recursive rendering; actionable items need visual differentiation.
- State management: React Context or Zustand are reasonable choices for cross-component state.
