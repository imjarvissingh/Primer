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

## Implementation status (Phase 3, 2026-10-16): Block Builder "The Broken Bridge"
One playable guided-practice mission at `/block-builder`. **It is a draft demonstration**: its item, hints and wording are unreviewed by an educator, and it is not a secure assessment system.

```
src/lib/practice-protocol.ts      wire types only (no runtime imports): shared by client and server
src/server/practice/              server-only (import "server-only")
  missions.ts                     allowlist: "broken-bridge" -> fixed item GP-07 (13 - 5, guided-practice bank)
  validate.ts                     bounded, strict parsing of untrusted request bodies
  sessions.ts                     short-lived in-memory sessions
  service.ts                      evaluateResponse + tutoring step -> controlled feedback
src/app/api/practice/bridge/      the only Route Handler (POST)
src/components/block-builder/     client UI: BridgeMission, BlockField, AnswerPicker, FeedbackPanel, MissionOutcome, BridgeScene, hints.ts
```

### Client / server boundary
- **Server owns** the validated problem (with its answer key), scoring, and every tutoring transition (Phase 2 `startItem`/`step`).
- **Client owns** only presentation: which screen, which blocks are on the bridge, the picked number, the latest feedback.
- Client code imports nothing from `@/domain` or `@/server` at runtime (enforced by `tests/unit/boundary.test.ts`). The challenge numbers (13 and 5) reach the client because they are the question; `maxAnswer` is sent too so the client needs no domain constant. Blocks drawn = `challenge.start`; the story text uses `challenge.takeAway`.
- Responses are a closed set: `correct`, `neutral-feedback`, `hint` (controlled hint id, 1-based number, make-ten step numbers), `easier-practice`, `offer-skip`, `ask-again`, `skipped`, `ended`. They never contain an answer field, problem object, skill, bank, review status or other item. Hint text and cues are client-side draft presentations keyed by hint id; their numbers come from the server's `strategy`, not constants.
- The missing "easier practice" (prerequisite) activity is not built: that policy action ends the mission with an honest message.

### Session state and request validation
- `POST /api/practice/bridge` with `start | attempt | skip | stop`. Bodies are capped at 1 KB (checked on `content-length` and while reading), must be `application/json`, and must have exactly the expected keys. Unknown missions (including `IN-01`, `GP-07`, any item id), extra fields such as a client `expectedAnswer`, bad session ids and non-integer `seq` get 400/413/415.
- The learner's `answer` is passed untouched to `evaluateResponse`; strings, decimals, negatives, out-of-range, null and missing are *invalid* and never scored.
- **Session choice:** an in-memory `Map` of opaque UUID -> `{tutor state, seq, expiry}` in the Node process. Chosen over a signed-token cookie because the server then, not the client, is the authority on attempt and hint counts (a signed token can be replayed to rewind hints), and over a database/Redis as unjustified for one demo. Sessions expire 30 minutes after last use; at most 500 are kept (oldest evicted).
- `seq` counts accepted events. A request that quotes any other value gets 409 `stale` and changes nothing, which makes double-clicks and replays harmless. Events after a finished item get 409 `session-closed`. The client also blocks a second request while one is in flight, and ignores replies for an abandoned session.
- Restart is a new session; it never mutates curriculum data and records no evidence.

### Demo limitations (not production claims)
- Unauthenticated and open: anyone who can reach the server can create sessions and probe the API. A caller can still discover the answer by trying all 21 numbers; sessions only bound how many scored attempts the tutor allows. This is guided practice, **not** assessment.
- State is per process: a restart, redeploy, serverless cold start or multiple instances lose sessions (the client restarts cleanly). A page refresh also starts a new session. Not suitable for multi-instance hosting as-is.
- No rate limiting or CSRF protection beyond input validation (no cookies or accounts exist to abuse). Nothing is stored beyond the in-memory session; learner responses are not logged.
- "Practice complete" is never mastery or evidence, and nothing here feeds `evidence`.
