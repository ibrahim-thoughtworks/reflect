# REFLECT Project Context

## Purpose
Reflect is a small React + TypeScript application built with Vite. It helps users capture a problem, map causes, add solutions for root causes, place solutions into a complexity matrix, and review the result.

## Current working flow
1. **Home** (`src/pages/Home.tsx`) lists saved problems and allows creating a new problem.
2. **AddProblem** (`src/pages/AddProblem.tsx`) captures the problem description and cause tree.
   - Supports editing an existing problem while preserving previously saved solutions.
3. **SolveProblem** (`src/pages/SolveProblem.tsx`) lets users add solution ideas to actionable root causes.
   - Preserves existing solution `matrixX` / `matrixY` values when solution text matches previous entries.
4. **ComplexityMatrix** (`src/pages/ComplexityMatrix.tsx`) is the drag-and-drop place where solutions are positioned in a 2x2 matrix.
   - Once all solutions are placed, the matrix is saved back into the problem.
5. **ProblemDetail** (`src/pages/ProblemDetail.tsx`) shows the saved problem tree and the read-only complexity matrix.

## Key files
- `src/App.tsx` — application view routing state and glue for home/add/edit/solve/matrix/detail screens.
- `src/types.ts` — shared domain model types: `Problem`, `CauseNode`, `Solution`.
- `src/store/problems.ts` — localStorage persistence for problems.
- `src/pages/AddProblem.tsx` — problem and cause tree creation/editing.
- `src/pages/SolveProblem.tsx` — adding solutions for root causes.
- `src/pages/ComplexityMatrix.tsx` — placing solutions in the matrix and saving positions.
- `src/components/ComplexityMatrixView.tsx` — read-only matrix view used in problem detail.
- `src/components/ProblemTree.tsx` — visual problem/cause tree rendering.
- `src/components/CauseTreeEditor.tsx` — cause tree editor UI used by `AddProblem`.

## Data model
- `Problem`: `id`, `description`, `causes`, `createdAt`
- `CauseNode`: `id`, `text`, `isActionableRootCause`, `children`, optional `groupId`, optional `linkedToId`, optional `solutions`
- `Solution`: `text`, optional `matrixX`, optional `matrixY`

## Persistence
- Problems are stored in `localStorage` under key `reflect_problems`.
- `saveProblem()` appends a new record.
- `updateProblem()` replaces an existing record by `id`.

## Recent fix
- Solution names were not always preserved when editing and re-opening a problem.
- The current code now preserves `Solution.text` through the edit flow, and ensures matrix stickies show the solution text in both the editor and detail views.

## Project setup
```bash
npm install
npm run dev
```

## Build and test
```bash
npm run build
npm test -- --run
```

## Notes for next time
- The app is single-page state-driven in `src/App.tsx`; next view state is controlled by `setView` and `setSelectedId`.
- Problems are loaded fresh from `localStorage` whenever a view renders, except when navigating from edit mode where the current problem is passed through.
- If you need to debug solution preservation, start in `src/pages/SolveProblem.tsx` and `src/pages/ComplexityMatrix.tsx`.
- If root cause editing seems off, verify `src/pages/AddProblem.tsx` and `src/lib/causeTreeToEditorNodes.ts`.

## Helpful commands
- `npm run dev` — start the app locally
- `npm run build` — production build
- `npm test -- --run` — run tests
- `npm run lint` — run ESLint

## Important working assumptions
- A problem must have at least one cause saved before it can be persisted.
- Only actionable root causes (`isActionableRootCause`) can receive solutions.
- Solutions without `matrixX`/`matrixY` are considered unplaced.
- Problem editing should preserve existing solutions when the cause tree is rebuilt.

## Directory layout
- `src/pages/` — main screens
- `src/components/` — shared UI components
- `src/store/` — persistence layer
- `src/lib/` — utilities
- `docs/` — planning and task docs

## Current development state
- App UI is working for add problem, edit problem, add solutions, place solutions in matrix, and view saved detail.
- The matrix view now shows solution text on the draggable sticky elements.
- The storage behavior and round-trip persistence are covered by existing `src/store/problems.test.ts` tests.
