# Primer — Decisions 2026-10-16

US first; math first; Block Builder and Space Construction; shared theme-neutral curriculum and evaluator; original characters; React/SVG first, no complex game engine; deterministic hints; synthetic demo before child pilot; solo founder with coding agents; no coding prompt until requested.

Open: legal consent approach, US educator reviewer, parent recruitment, final providers, actual skill-difficulty equivalence.

Deferred: voice, limitless generative content, 3D, user-uploaded copyrighted characters, multiplayer, payments, sophisticated knowledge-tracing infrastructure.

## Phase 1 implementation decisions (2026-10-16)
npm as package manager. System font stack instead of Google-hosted fonts (no external requests). Prettier for formatting, with eslint-config-prettier. Playwright tests the production build, not the dev server. Next.js scaffold defaults `cacheComponents` and `partialPrefetching` kept as generated. CI runs `npm audit --omit=dev` and gitleaks; dev-only audit findings in the ESLint toolchain are tracked, not force-fixed.

## Phase 1.5 maintenance (2026-10-16)
**Accepted risk — braces (GHSA-vfj7-8cjw-p6xm, high, CVSS 7.5).** Chain: eslint-config-next 16.4.2 → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3. The advisory lists no patched version (braces 3.0.3 is the latest release), so `npm audit` still reports 5 high findings and they are **unresolved**. Impact is a denial of service (stack exhaustion crashing the Node process) from deeply nested brace patterns; it is dev-only (`npm audit --omit=dev` reports 0), and lint patterns come from this repository, not untrusted input. The audit's suggested fix downgrades to Next 14 and was rejected. Follow-up: re-run `npm audit` monthly and after any `eslint-config-next` update. CI audits production dependencies only, so this known dev finding does not block builds.

**CI hardening.** `actions/checkout` and `actions/setup-node` are pinned to full commit SHAs (the commits behind their v4 tags). The gitleaks tarball is verified against a pinned SHA-256 before use; bump version and hash together. Pins do not update themselves, so review them periodically.


## Phase 2 domain decisions (2026-10-16)
**Design choices**
- S05 is modelled as an `assessment-objective` with an `assesses` list, not a prerequisite, so transfer evidence cannot distort progression.
- Problems carry only an instructional skill (S01–S04). S05 evidence comes from which bank an item sits in (independent, delayed).
- The stored answer key is cross-checked against a recomputation from the parameters; a mismatch rejects the problem. Unknown fields (including any theme field) are rejected.
- Learner responses are never coerced: only a whole-number `number` from 0 to 20 is scorable.
- Hints are not part of banks. Only tutoring holds hint ladders (controlled ids), so assessment items cannot carry hints.
- Assessment feedback is one identical neutral action for right and wrong answers; unreadable answers are re-asked and not scored.
- Exact duplicates across banks are errors; equivalent number facts are warnings.
- Whether work was independent is derived (assessment phase and zero hints), never stored. Repeated attempts at the same assessment item count once. Skips are not evidence.
- Mastery is behind an explicit policy type. The only existing policy is the draft one, which cannot award mastery.
- No dependency was added. Plain TypeScript validation replaced a schema library to keep the surface small.

**Implementation assumptions awaiting educator review** (not approved decisions): the prerequisite edges, bank contents, hint wording ids, the practice sequence (neutral feedback, hint 1, hint 2, prerequisite fallback or skip offer, stop after 5 wrong), and the 3-unreadable-answers skip offer.

## Phase 3 decisions (2026-10-16)
- **Server-authoritative demo session in memory.** Opaque UUID, 30-minute sliding TTL, 500-session cap, `seq` for stale/duplicate rejection. Rejected: client-held tutor state (forgeable hint/attempt counts), signed cookie/token (replayable, needs a secret), database/Redis (not justified for one demo). Cost: no persistence, single instance only; documented in ARCHITECTURE.md.
- **Mission name, not item id.** The API accepts only `broken-bridge`, which the server maps to guided-practice item `GP-07`. Assessment items cannot be named.
- **Route Handler, not Server Action.** A plain JSON endpoint is easier to unit test, inspect and bound.
- **Shown quantity vs answer.** The pile always has `start` blocks; the live count shown is blocks *on the bridge* only. The remaining number is never printed, so the learner counts it.
- **Tap/click first.** Blocks are native buttons; no drag-and-drop. Answers are a 0-20 radio group, not free text.
- **Hint wording is client-side draft presentation** keyed by the server's hint id; make-ten numbers come from the evaluator's strategy.
- **No `easier-practice` activity.** The policy's prerequisite fallback ends the mission with an honest message because new curriculum content is out of scope.
- `server-only` is used without installing the package (Next resolves it); Vitest stubs it. No dependencies were added.

## Phase 4 decisions (2026-10-16)
- **Theme is presentation-only and never sent to the server.** Rejected: a `theme` request field (adds an allowlist and a place for theme to leak into logic) and a second route (duplicate code). Consequence: the server cannot tell the themes apart, which is the intended proof that they share one engine.
- **Neutral mission id and path.** `broken-bridge` / `/api/practice/bridge` became `subtract-practice` / `/api/practice/mission` because the server mission is not bridge-specific.
- **`ThemeConfig` is string-only, frozen data, no functions.** Story text uses two validated placeholders; hints use a typed vocabulary instead of string replacement over whole sentences. Validated by `tests/unit/themes.test.ts`.
- **Readiness gate in the UI, not the server.** The picker unlocks only when the built quantity matches the story. Scoring rules unchanged.
- **Colors via CSS variables on a theme class**, not per-theme components; only the two scenes differ in markup.
- **Defect fixed:** `.gitignore`'s Python-template `lib/` rule hid `src/lib/practice-protocol.ts`, so Phase 3 commit `395727f` failed CI typecheck until `68eefb2`. `!src/lib/` now un-ignores it. Lesson: after committing, check CI or typecheck a clean clone, not just the working tree.

## Phase 5 decisions (2026-10-16)
- **Separate assessment endpoint, shared machinery.** `/api/assessment` has its own parser, state and service, but reuses `TtlStore`, the bounded body reader, `evaluateResponse` and tutoring `step` (independent phase). Rejected: adding an `assessment` mode to the practice API, which would put hint and feedback code on the same path as scored independent work.
- **Neutral replies by construction:** the reply never contains a correctness field during the check, so no UI can leak it.
- **Unreadable answers do not consume the scored try** (practice and assessment already treat them as "ask again"); a skip is recorded but is not evidence.
- **Summary keyed by an opaque session id in the URL**, not browser storage, so it survives refresh and cannot be forged: the browser sends an id, never a number. No fixture or sample profile exists; with no session the page shows only guidance.
- **No link between practice and check state.** Rejected: carrying a practice session id into the check, which would need a server-verified link and an identity concept we do not have.
- **Version labels are shown to adults as provenance**, so they are no longer in the browser-exposure token list; answer keys, item ids and bank names still are.
- **Descriptive labels only:** "Correct in this short check", "Needs more evidence", "Not yet assessed". No percentage-as-mastery, trend or prediction.
