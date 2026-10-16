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

## Environment notes (Phase 1.5)
Playwright browsers are cached in `~/Library/Caches/ms-playwright`; each Playwright upgrade needs `npx playwright install chromium` again and leaves old revisions behind. Keep at least 10 GB free on the development Mac: `node_modules`, builds and browser downloads fail with ENOSPC otherwise. Safe regenerable caches to clear when space is low: `.next`, `~/.npm/_npx`, Homebrew (`brew cleanup`), Xcode DerivedData.


## Implementation status (Phase 2, 2026-10-16): domain engine
`src/domain/` is plain TypeScript with no React, Next.js, browser, database or network dependency. Dependencies only point downward, enforced by `tests/unit/domain/architecture.test.ts`:

```
shared  <-  curriculum  <-  math  <-  assessment
                 ^            ^
                 |            +----  tutoring
                 +-----------------  evidence
```

| Module | Purpose |
| --- | --- |
| `shared` | `ValidationIssue`/`ValidationResult` and `deepFreeze`. |
| `curriculum` | Versioned S01–S05 definitions, typed edges, graph validation, lookups. |
| `math` | Five problem types, `validateProblem` (branded `ValidatedProblem`), pure `evaluateResponse`. |
| `assessment` | Four draft banks, duplicate/equivalence checks, answer-free `LearnerItemView` projection. |
| `tutoring` | Pure `startItem`/`step` policy returning controlled actions and hint ids. |
| `evidence` | `EvidenceRecord`, conservative `interpretSkillEvidence`, draft vs approved policy. |

Themes are not part of the domain. A problem has no theme field (unknown fields are rejected), so a future theme pack can change only presentation.

### Required server-side boundary (Phase 3 onward)
Keeping answer keys out of the domain's learner-facing types does **not** by itself keep them out of the browser. `ValidatedProblem` and `EvaluationResult` contain the answer. When this code is connected to Next.js:
- Import `@/domain/assessment` banks, `@/domain/math` evaluation and `@/domain/evidence` only from server code (Route Handlers, Server Actions, server-only modules). Add `import "server-only"` wrappers at that point.
- Never pass a `ValidatedProblem`, `QuestionBank` or `EvaluationResult` to a Client Component or serialize it into a response. Send only `toLearnerView(...)` output and the tutoring action.
- Evaluate on the server; the client submits a bare number and receives only the tutoring action (for assessments, always the neutral acknowledgement).
- Do not log learner responses.
