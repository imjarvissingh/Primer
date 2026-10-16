# Primer — Architecture

Modular TypeScript monolith: Next.js, React/SVG tap-first game UI, versioned curriculum data, deterministic math evaluator, tutor policy, assessment isolation, learner evidence, parent auth/privacy and theme packs. PostgreSQL when persistent child records are justified and approved.

## Module dependency graph
Curriculum -> evaluator and tutoring policy -> shared game -> theme packs -> assessment -> progress reporting. Parent auth/consent/security is parallel and required for child pilot.

## Core contracts
Themes can modify art and approved narrative wording but cannot change mathematical answers. Assessment answers remain server-authoritative. Assisted practice never proves unaided mastery. Attempts are idempotent and reference item/content versions. Parent isolation enforced server-side.

## Validation
TypeScript strict, lint, Vitest, Playwright, build, dependency and secret scanning, GitHub Actions. One AI coding agent edits at a time.

## Implementation status (Phase 1, 2026-10-16)
Single Next.js 16.4.2 App Router app in the repository root (no nested project), `src/` layout, `@/*` alias to `src/*`. Only `src/app` and `src/components` exist; `domain/`, `themes/` and `lib/` are created when real code needs them. No database, authentication, analytics, external fonts or runtime AI. Tests: Vitest + React Testing Library in `tests/unit`, Playwright Chromium smoke tests in `tests/e2e` against the production build. CI is GitHub Actions (`.github/workflows/ci.yml`). Passing tests are not evidence of COPPA compliance; see SAFETY.md.

