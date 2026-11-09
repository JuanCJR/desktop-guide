# Feature: spanish-code-docs

## Objective

Document the source code with Spanish comments so a non-technical owner can
understand where each part of the app lives and what it does.

## Problem / Why

The owner is not a developer and cannot navigate the codebase. Comments today
are sparse and in English.

## Scope

- Every hand-written source file in `src/` and `scripts/` (tests and generated
  shadcn components in `components/ui/` excluded).
- Update the language rule in `CLAUDE.md` (and `README.md` if it states it):
  code comments now in Spanish; identifiers, UI copy and commits stay English.

## Constraints

- Comments only: no behavior, identifier, or UI-text changes.
- Per file: a header block (what it is, what it does, how it connects).
  Per key section: short comment (`// Aquí arranca la app: ...`). No
  line-by-line noise.
- Plain, neutral Spanish for a non-technical reader.
- `pnpm check` must pass after every task.

## Delivery

Branch `feature/spanish-code-docs` from `develop`; PR against `main`.
Strategy: `exception-ok` (comment-only change; large line count is expected and
not split by size).

## Tasks

- [x] T1 — Update convention in `CLAUDE.md`/`README.md`; document `src/main/`, `src/preload/`, `scripts/`. Route: delegated (writer, 2+ files).
- [x] T2 — Document `src/shared/`. Route: delegated.
- [ ] T3 — Document renderer core: `main.tsx`, `app.tsx`, `index.html`, `styles/`, `lib/`, `hooks/`, `components/` (not `ui/`), `features/content`, `features/editor`, `features/shell`. Route: delegated.
- [ ] T4 — Document renderer feature screens: `features/{admin,article,calendar,directory,enrollment,faq,grades,home,prerequisites}`. Route: delegated.

## Acceptance criteria

- Each in-scope file opens with a Spanish header comment.
- `git diff` shows only comment/doc changes in source files.
- `pnpm check` passes.

## Progress / Evidence

- T1: 16 files (CLAUDE.md rule + `src/main`, `src/preload`, `scripts`). Commit: `3efe694`. Checks: `pnpm typecheck && pnpm lint && pnpm exec prettier --check src scripts CLAUDE.md README.md odd && pnpm test` passed (97 tests); `pnpm check` fails only on untracked `.atl/skill-registry.md` formatting. Comment-only diff verified (no non-comment lines changed). `README.md` does not state the comment-language rule, so it was left unchanged. Note: `scripts/generate-master-key.mjs` still writes an English header into `public-key.ts` when regenerated (template string left untouched to avoid code changes).

- T2: 10 files in `src/shared` (`default-content.ts` gets header + one section marker per screen). Commit: see next entry / git log (`docs(shared): ...`). Checks: same command passed (97 tests); comment-only diff verified.

## Next step

T3.
