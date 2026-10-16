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
  missions.ts                     allowlist: "subtract-practice" -> fixed item GP-07 (13 - 5, guided-practice bank)
  validate.ts                     bounded, strict parsing of untrusted request bodies
  sessions.ts                     short-lived in-memory sessions
  service.ts                      evaluateResponse + tutoring step -> controlled feedback
src/app/api/practice/mission/     the only Route Handler (POST)
src/components/practice/          client UI (see Phase 4)
```

### Client / server boundary
- **Server owns** the validated problem (with its answer key), scoring, and every tutoring transition (Phase 2 `startItem`/`step`).
- **Client owns** only presentation: which screen, which blocks are on the bridge, the picked number, the latest feedback.
- Client code imports nothing from `@/domain` or `@/server` at runtime (enforced by `tests/unit/boundary.test.ts`). The challenge numbers (13 and 5) reach the client because they are the question; `maxAnswer` is sent too so the client needs no domain constant. Blocks drawn = `challenge.start`; the story text uses `challenge.takeAway`.
- Responses are a closed set: `correct`, `neutral-feedback`, `hint` (controlled hint id, 1-based number, make-ten step numbers), `easier-practice`, `offer-skip`, `ask-again`, `skipped`, `ended`. They never contain an answer field, problem object, skill, bank, review status or other item. Hint text and cues are client-side draft presentations keyed by hint id; their numbers come from the server's `strategy`, not constants.
- The missing "easier practice" (prerequisite) activity is not built: that policy action ends the mission with an honest message.

### Session state and request validation
- `POST /api/practice/mission` with `start | attempt | skip | stop`. Bodies are capped at 1 KB (checked on `content-length` and while reading), must be `application/json`, and must have exactly the expected keys. Unknown missions (including `IN-01`, `GP-07`, any item id), extra fields such as a client `expectedAnswer`, bad session ids and non-integer `seq` get 400/413/415.
- The learner's `answer` is passed untouched to `evaluateResponse`; strings, decimals, negatives, out-of-range, null and missing are *invalid* and never scored.
- **Session choice:** an in-memory `Map` of opaque UUID -> `{tutor state, seq, expiry}` in the Node process. Chosen over a signed-token cookie because the server then, not the client, is the authority on attempt and hint counts (a signed token can be replayed to rewind hints), and over a database/Redis as unjustified for one demo. Sessions expire 30 minutes after last use; at most 500 are kept (oldest evicted).
- `seq` counts accepted events. A request that quotes any other value gets 409 `stale` and changes nothing, which makes double-clicks and replays harmless. Events after a finished item get 409 `session-closed`. The client also blocks a second request while one is in flight, and ignores replies for an abandoned session.
- Restart is a new session; it never mutates curriculum data and records no evidence.

### Demo limitations (not production claims)
- Unauthenticated and open: anyone who can reach the server can create sessions and probe the API. A caller can still discover the answer by trying all 21 numbers; sessions only bound how many scored attempts the tutor allows. This is guided practice, **not** assessment.
- State is per process: a restart, redeploy, serverless cold start or multiple instances lose sessions (the client restarts cleanly). A page refresh also starts a new session. Not suitable for multi-instance hosting as-is.
- No rate limiting or CSRF protection beyond input validation (no cookies or accounts exist to abuse). Nothing is stored beyond the in-memory session; learner responses are not logged.
- "Practice complete" is never mastery or evidence, and nothing here feeds `evidence`.

## Implementation status (Phase 4, 2026-10-16): shared mission engine, two themes
Block Builder (`/block-builder`, "The Broken Bridge") and Space Construction (`/space-construction`, "The Space Station Mission") are one mission engine with two presentations. Both are **draft demonstrations**, unreviewed by an educator.

```
src/themes/index.ts               ThemeConfig contract + the two themes (frozen, string-only data, no imports)
src/components/practice/
  PracticeMission.tsx             THE state machine: intro -> play -> outcome, session, requests, double-submit guard
  ConstructionField.tsx           supply / construction area; every item is a button in exactly one place
  AnswerPicker.tsx, FeedbackPanel.tsx, MissionOutcome.tsx, hints.ts   shared; themes supply nouns only
  MissionPage.tsx                 page frame (server component)
  scenes/BridgeScene.tsx, scenes/SpaceScene.tsx   the only theme-specific components (decorative SVG)
src/app/block-builder/page.tsx, src/app/space-construction/page.tsx   ~10 lines each: theme + scene
```
Dependency path, unchanged by theming: page -> `PracticeMission` -> `fetch` -> `/api/practice/mission` -> `parseRequest` -> `handlePracticeRequest` -> `getMission` (GP-07) + `evaluateResponse` + tutoring `step`.

### What a theme is, and is not
A theme is presentation: display and mission names, story and intro wording, one vocabulary (item noun, supply/construction headings and places), outcome wording, a CSS class that sets color variables and item shape (squares vs circles), and a scene. The story uses only the placeholders `{start}` and `{takeAway}`, filled from the server's challenge, so a theme contains **no numbers** (tested). It has no answer, problem parameter, score, tutoring or assessment field (tested by scanning every key and value), and it is **never sent to the server**: requests contain no theme field, and the API rejects theme names as missions and extra fields. Both themes therefore get identical scoring, tutoring and session behaviour by construction; a test plays the same learner actions in both and asserts byte-identical requests, and another asserts identical server replies to identical answer sequences.

### Hints
One shared template per hint id (`presentHint`); the server supplies the id and the make-ten step numbers, a theme supplies only nouns. Tests assert, for every id in the S04 ladder, that both themes give the same numbers and highlighted items and the same sentence once nouns are neutralised, and that no hint states the final answer.

### Construction readiness (story/picture consistency)
The story says 5 items are used. The answer picker therefore stays locked until exactly `takeAway` items are in the construction area, with a plain message ("Put 2 more blocks on the bridge to continue", "That is more than 5. Put 1 back"). Stop and Start over stay available. This is a presentation gate only: the server neither knows nor checks it, scoring is unchanged, and a hand-made request can still submit an answer. Identical in both themes (one component).

### Accessibility notes
Item labels use the theme's noun and place ("Module 3, in the supply. Press to put it on the station."), so a screen reader never hears "block" in the space theme. Focus rings use a theme variable (yellow on the dark space panel for contrast). Used items differ from supply items by position and a striped pattern, not color alone; hint cues are dashed outlines. Motion is opt-in (`prefers-reduced-motion`) and tested in a real browser.

### Navigation and sessions
Each page creates its own server session on Start; sessions are never shared between themes. Next's Cache Components may keep a previously visited route's UI state alive in the background when navigating client-side, so returning to an earlier mission can show where you left off (its server session is unaffected, and expires after 30 minutes). Nothing is persisted.

## Implementation status (Phase 5, 2026-10-16): independent check and evidence summary
Demonstration journey: guided practice (`/block-builder`, `/space-construction`) -> independent check (`/assessment`) -> adult summary (`/demo-progress?session=<id>`). All three are **draft, synthetic-data demonstrations**.

```
src/lib/assessment-protocol.ts    wire types only
src/server/ttl-store.ts           shared TTL/cap session store (practice and assessment each own an instance)
src/server/http.ts                bounded request-body reader (shared)
src/server/assessment/
  items.ts                        independent bank, fixed order; answer-free question projection
  validate.ts                     exact-key request parsing (start|answer|skip|stop|summary)
  sessions.ts                     AssessmentSession: items, index, tutor state, seq, first outcome per item
  service.ts                      evaluateResponse + tutoring step (phase "independent")
  summary.ts                      EvidenceRecords -> interpretSkillEvidence -> adult summary
src/app/api/assessment/route.ts   the only assessment endpoint (POST)
src/components/assessment/        AssessmentCheck, ProgressSummary (client), api.ts
```

### Check rules
- **Items:** the four draft items of the independent bank, in bank order (S03, S03, S04, S04). No client input names, reorders or skips ahead to an item; `start` accepts no fields. Guided-practice, baseline and delayed items are never read.
- **One question at a time.** The reply carries only the displayed numbers (`position`, `total`, `start`, `takeAway`, `maxAnswer`): no item id, skill, bank, version or answer.
- **Neutral replies.** The tutoring policy's independent phase returns the same acknowledgement for right and wrong answers; the HTTP reply has an identical shape and content (tested byte for byte). No hints, no prerequisite remediation, no per-item correctness.
- **One scored answer per item.** The first valid answer is recorded and the item advances. A replay quotes a stale `seq` and gets 409; events after the end get 409. An unreadable answer (string, decimal, negative, out of range, null, missing) is not scored, records nothing, and asks again on the same item. A skip records "skipped", which is not evidence. Stop ends the check; unfinished items are "not reached".
- **Sessions** are in memory with the practice limits (30 minute sliding TTL, 500 cap), a separate store from practice, no persistence, single instance only.
- **A retake** is a new `start`, hence a new session; it cannot add evidence to an earlier one.

### Evidence and provenance
The server builds `EvidenceRecord`s only from answers it evaluated: phase `independent`, `hintsUsed` 0, the problem's own curriculum and content versions, order, time. They go through the Phase 2 `interpretSkillEvidence` under `DRAFT_EVIDENCE_POLICY`, which cannot award mastery. The summary is available only after the check ends and is built from the session, never from browser-supplied numbers; there is no endpoint that accepts scores. The summary shows counts, a per-question outcome (after the check, so no live feedback leaks), skills sampled with the label "Needs more evidence" or "Not yet assessed", `mastery.awarded: false`, and provenance (draft content, version labels, zero hints). It never contains an answer, item id or bank metadata.

### Practice and check are deliberately not linked
Nothing ties a practice session to a check, so no practice claim ("used no hints", "completed Block Builder") is, or could be, treated as evidence. The practice completion screen only links to the check as ordinary navigation.

### Demo limitations (not production claims)
- Unauthenticated: anyone can start sessions and read a summary whose opaque session id they hold (the id is in the URL, so treat it like a short-lived capability; it is not a login). Do not describe this as secure, cheat-proof or suitable for high-stakes testing or real children.
- A user can learn answers by running many fresh sessions, or by finishing a check and reading its summary's right/not-correct column. No rate limiting beyond input validation and the session cap.
- Learner answers are not logged. Sessions vanish on restart; the summary then says so.
- Four questions on one occasion is not enough evidence for any mastery claim; the draft policy would not make one regardless.

## Implementation status (Phase 6, 2026-10-16): demo stabilisation

### Session lifecycle
- Unchanged architecture: in-memory `TtlStore`, 30-minute sliding TTL, 500-session cap, one store per flow. A hosted deployment with several instances (or serverless) would lose or split sessions; that is a known demo limit, not a bug to fix before persistence/identity exist.
- A lost, expired or out-of-step session is never reconstructed. Practice and check both return to the introduction with an explanatory message; the summary says the check cannot be found. Server errors (5xx) are treated as retryable, not as a lost session.
- Next keeps a client-navigated-away page mounted but hidden (Activity), preserving React state. `PracticeMission` and `AssessmentCheck` reset in an effect cleanup when hidden, so returning via a link always opens at the introduction instead of a stale, possibly dead session. Refresh does the same by construction.
- "Start over" creates a new session. The abandoned one stays until TTL; it is unreachable from the UI.

### Hardening
- `/demo-progress` is served with `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store` and matching page metadata; all routes send `X-Content-Type-Options: nosniff`. API replies were already `no-store`.
- Session starts are capped per flow at 120/minute per server process (`src/server/rate-limit.ts`), so a flood cannot churn the 500-slot store and evict live sessions. It reads no IP, header or identifier, and is not effective across multiple instances. Running sessions are never throttled. Over the cap, the API returns 429 `rate-limited`.
- CSRF: assessed, no change. There are no cookies or ambient credentials; the APIs require `application/json` (not a CORS-simple type) and send no CORS headers, so a cross-site page cannot make a credentialed state change. A CSRF token would add nothing.
- The session id in the summary URL is an unguessable capability (UUID v4), not authentication. Anyone holding the URL can see that one synthetic summary until it expires.

## Implementation status (Phase 8A, 2026-10-16): visual identity
Presentation only; the domain, server, protocol, tutoring and assessment code are untouched.
- `src/app/globals.css`: brand tokens, theme classes (`theme-bridge`, `theme-space`), `calm-panel`, shared controls, manipulatives, motion.
- `src/components/brand/`: `Wordmark` and `SiteHeader` (all pages except Home, which has its own hero).
- `src/components/practice/scenes/`: decorative SVG per theme; `ExperienceCard` reuses them on the home page.
- Decorative SVG is `aria-hidden`; every meaning it carries (goal, counts) also exists as text.
