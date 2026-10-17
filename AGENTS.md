<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Primer: instructions for AI coding agents

These rules do not prevent mistakes. They make mistakes easier to see: every claim should be backed by a command you ran, a test, or a file you read. If you are unsure, say so.

## 1. Mission and constraints

Primer is an early-stage, interest-personalized math game for US children aged 6 to 9. It is currently an **adult-operated demonstration with synthetic data only**. It is not validated with children, not approved by an educator, and not cleared for real-child use.

## 2. Authoritative files (read before changing anything)

`docs/00-INDEX.md` (map), `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/CURRICULUM.md`, `docs/SAFETY.md`, `docs/DECISIONS.md` (approved decisions), `docs/TASKS.md` (current priorities and issue links), `docs/MVP-5-DAY-PLAN.md` (sprint scope and cut rules), `docs/DEMO-RUNBOOK.md`, `docs/EDUCATOR-REVIEW-PACKET.md`, `docs/ACCESSIBILITY-AUDIT.md`. Code and verified behavior outrank docs for what works today. Educational content is provisional until a qualified educator reviews it. If a document is missing or stale, report that; do not invent its content.

## 3. Repository overview

- `src/domain/` pure curriculum, math evaluator, tutoring policy, assessment, evidence. Holds answer keys; never imported by client code.
- `src/server/` session stores, services, validation, rate limit (in memory, single instance).
- `src/app/api/` practice (`/api/practice/mission`) and assessment (`/api/assessment`) route handlers.
- `src/themes/` presentation-only mission themes. `src/interests/` presentation-only welcome registry.
- `src/components/` UI. `src/lib/` client-safe protocol types and the ten-frame helper.
- Routes: `/`, `/welcome`, `/cricket`, `/block-builder`, `/space-construction`, `/basketball`, `/soccer`, `/assessment`, `/demo-progress?session=...`. `/prototype/...` exists only on a separate prototype branch.
- Next.js here is **not** the version you know. Read `node_modules/next/dist/docs/` before changing framework-level code.

## 4. Commands

`npm ci`, `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run test:e2e` (builds, then Playwright on the production build, one worker on purpose; set `PRIMER_E2E_PORT` if 3100 is busy). Never add a way to raise the session-start cap for tests; reduce concurrency instead. `npm run validate` runs everything. In a git worktree run `npm ci` there; Turbopack does not follow a symlinked `node_modules`.

## 5. Git safety

Never discard, reset, clean, rebase, force-push or overwrite existing work. Inspect `git status`, `git branch -vv`, `git worktree list` first. Work on a dedicated branch or worktree. Do not push, open PRs, merge or deploy without explicit founder approval. Never commit secrets, `.env*`, `node_modules`, archives, or screenshots containing personal information. Commit trailers come from the session's attribution reminder.

## 6. Issues and pull requests

Work from a GitHub issue (https://github.com/imjarvissingh/Primer/issues). Link issues in the PR; do not use closing keywords unless the founder has reviewed the result. A PR lists changed behavior, tests run with real results, remaining risks, and real browser screenshots for visual changes. Do not mark CI as passing unless the relevant run says so.

## 7. Scope control

Build the smallest complete vertical slice. A working feature with modest art beats a beautiful fake. Do not start the next milestone without being asked. Respect the cut rules in `docs/MVP-5-DAY-PLAN.md`. Do not add dependencies, a 3D engine, accounts, storage, analytics or live child-facing AI.

## 8. Shared math-engine invariants

All themes share one evaluator, one tutoring policy and one assessment. A theme or interest may change only story, nouns, colors, art, character and animation. It must never change arithmetic, scoring, tutoring, assessment rules or mastery evidence, and must not be sent to the server. The first challenge is 13 - 5 = 8: 13 starting, 5 used, 8 remaining. Never print or animate the remainder before the learner answers, and keep the remaining objects countable without visual-only tricks.

## 9. Server-authoritative sessions and scoring

Scoring, hint authorization, attempt counts and evidence are decided on the server in short-lived in-memory sessions. The client holds no forgeable tutor state and never receives answer keys, item ids or bank names (see `tests/unit/boundary.test.ts` and `tests/e2e/helpers.ts`). Do not rebuild a session from client-held answers.

## 10. Guided practice versus independent assessment

Practice may give hints and writes no evidence. The independent check gives no hints and no right or wrong feedback, and is the only source of evidence. Never link their state, never reuse hint code on the assessment path, and never present guided success as independent.

## 11. Synthetic-data restrictions

No real child names, ages, addresses, birthdays, free text or behavioral profiles. No accounts, cookies, local storage, analytics or persistence. The adult summary (`/demo-progress`) is reachable only with a short-lived opaque session id, with no-store and noindex preserved. Never present synthetic results as real learning outcomes. No mastery badges, scores, streaks or efficacy claims. Release gates are in `docs/SAFETY.md`.

## 12. Accessibility standards

Real buttons and links with meaningful names; visible focus; 44 px touch targets; keyboard operation; 320 to 1440 px with no horizontal scroll, including 200% text; motion only inside `prefers-reduced-motion: no-preference`; no information carried only by color or animation. Screen readers, Safari, Firefox and physical devices are not yet tested; say so.

## 13. Definition of done

A feature is done only when its controls work end to end against the real server, errors and dead ends are handled, tests cover it, docs and the issue are updated, and you ran the running app. A static preview is not a playable game.

## 14. Honest reporting

Report test results exactly as run (counts, failures, what was not run). Do not call a failure a flake without baseline evidence. Do not weaken or delete a test to make a suite green.

## 15. Uncertainty and founder decisions

State uncertainty instead of inventing facts, traction, interviews, educator endorsements or learning gains. Preserve decisions recorded in `docs/DECISIONS.md`. Stop and ask before large changes, product or visual decisions, or anything outward-facing.

## Startup checklist (mandatory)

1. Read this file. 2. Inspect Git state (status, branches, worktrees). 3. Read the relevant issue. 4. Read the authoritative docs. 5. Inspect current code. 6. Identify risks and dependencies. 7. Implement the smallest complete vertical slice. 8. Run the appropriate tests. 9. Update affected docs. 10. Report exactly what changed and what remains incomplete.

## Handoff checklist (mandatory)

- Branch, worktree and commit hashes; what is pushed and what is not.
- Issues touched, with links, and their honest status.
- Tests run with real results; tests not run and why.
- Docs updated (`docs/TASKS.md`, `docs/DECISIONS.md` as needed).
- Known defects, risks, blockers, and anything simulated.
- What the founder must decide or review next.

## Adding or changing a themed world

A world is a `ThemeConfig` (strings only), a CSS palette class, a scene in `src/components/practice/scenes/`, a route page, and an entry in `src/interests`. Do not add a theme field to any API or tutoring code. Scenes must not draw the supply in a countable way or print the remainder. Hint wording may describe a strategy picture but must never say what the learner did ("you took"). Keep the cross-theme invariance test over all themes passing.

## Countable objects and guides

Resources are individually drawn, separate buttons that mirror the session's own selection; never draw the remaining set inside a scene or container that could disagree with the session, never print a numeral on an object, and never state the remainder in text, names or descriptions before the learner answers. Guide lines are fixed authored strings keyed to real events (welcome, working, again, done): no generated dialogue, no praise or judgment after a wrong answer, no claims about ability. Keep motion in `prefers-reduced-motion: no-preference` and test final states, not timing.

## Scenes and motion

Scenes live in `src/components/practice/scenes/`, are decorative and aria-hidden, and must keep the goal pad in the centre band (x 110..490 of a 600 x 340 viewBox, `slice` on phones). They draw only the places to fill, never resource-like loose objects, never numerals. Celebration is tied to `data-solved` (server-confirmed), never to a filled picture. Animation is decorative: state must be final before it starts, it must never block input, and it must be skipped or static under `prefers-reduced-motion`. Tests wait for finite animations only (ambient scenery loops by design). Do not claim art is premium; record what an art pass still needs.
