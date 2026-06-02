# Plan: add problems (#1)

## Objective
Build a greenfield React + Vite + TypeScript "Reflect" app. Users add a problem, step through five "why?" prompts (skippable but mandatory to the end), then select any answers as actionable root causes. All data is persisted in localStorage. The main screen lists problems; clicking one renders a graphical top-down tree — problem at the root, each "why" answer as a child node, with connecting lines and actionable root causes visually highlighted.

## Scope

### In Scope
- Vite + React + TypeScript project bootstrap with Tailwind CSS
- Main screen: problem list + "Add Problem" button
- Add Problem modal/page: free-text problem input
- 5 Whys flow (5 sequential steps, each skippable, none escapable)
- Root cause selection screen: all 5 answers shown as checkboxes; user picks any as actionable
- localStorage persistence (problems, why answers, selected root causes)
- Problem detail view: graphical SVG/CSS tree — problem node at top, why-answer nodes below, connector lines between levels, actionable root cause nodes highlighted in a distinct colour

### Out of Scope
- Backend / API / auth
- Edit or delete existing problems
- Export / share

## Approach

Bootstrap a Vite React TS project at the repo root. Use Tailwind CSS for styling (installed via npm). Structure the app as a single-page app with simple view-state switching for three views: **Home**, **Add Problem Wizard**, and **Problem Detail**.

**Data model** (stored in localStorage as JSON):
```ts
type WhyAnswer = { text: string; skipped: boolean; isActionableRootCause: boolean }
type Problem   = { id: string; description: string; whys: WhyAnswer[]; createdAt: number }
```

**Add Problem Wizard** — three phases:
1. *Enter problem*: text input → "Start 5 Whys"
2. *5 Whys loop* (steps 1–5): show current why level, text area + "Next" + "Skip" buttons. Progress indicator (e.g., "Why 2 of 5"). Step 5 auto-advances to phase 3.
3. *Select root causes*: show all non-skipped answers as checkboxes. User picks any. "Save Problem" commits to localStorage and returns home.

**Problem Detail tree**: SVG-based tree. Problem node sits at the top-centre. Each why answer hangs below its parent with a vertical connector line. Answered nodes are white/neutral; skipped nodes are grey/muted; actionable root cause nodes are highlighted (amber border + badge).

**State management**: React Context + useReducer for in-session wizard state; localStorage read/write utility for persistence.

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
2. [ASSUMPTION] Simple view-state switch in `App.tsx` (no React Router) — keeps the bootstrap lightweight.
3. [ASSUMPTION] SVG-based tree for the detail view (reliable cross-browser connector lines).
4. [ASSUMPTION] No edit/delete of problems in this story.
5. [ASSUMPTION] localStorage is sufficient for persistence.

## Open Questions (resolved)
| # | Question | Answer |
|---|----------|--------|
| 1 | Which why answers can be actionable root causes? | Any level, user selects via checkboxes |
| 2 | Can user exit the 5 Whys early? | No — only skip per step |
| 3 | CSS framework? | Tailwind CSS (any CSS acceptable) |
| 4 | Tree shape? | Graphical SVG tree, problem at top, causes below with connector lines |

## Risks & Mitigations
| Risk | Mitigation |
|------|-----------|
| SVG tree layout gets complex for 5 levels | Keep it a linear vertical chain (each node centred); no branching needed since 5 Whys is always a single chain |
| localStorage size limits | Problems are text-only; 5 MB limit is more than sufficient |
