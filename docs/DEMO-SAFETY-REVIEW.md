# Primer — Synthetic Demo Safety and Privacy Review (Phase 8D)

Date: 2026-10-16. Code reviewed: `78575b5` plus the Phase 8D accessibility fixes (no server, scoring, policy, API or schema changes). Method: reading the code, running the production build, scripted requests against the live server, and the existing test suite. **This is an engineering self-review. It is not a legal review, a COPPA assessment, a penetration test, a security certification or a child-safety approval. Nothing here may be quoted as compliance.**

## 1. Bottom line

The build is a **public-safe, adult-operated, synthetic-data demonstration.** It must not be used with real children, real child data, or in any setting that implies a real learner's result. Nothing in it is authenticated, persisted, consented or independently reviewed.

## 2. Verified controls (observed this phase)

| Property | Evidence |
| --- | --- |
| No real profiles, emails, birth dates, names | No form fields exist besides numeric answer radios; API accepts only `start / attempt / skip / stop / support / answer / summary` with fixed shapes (`validate.ts`). |
| No cookies, local/session storage | Scripted full journey: 0 cookies, empty `localStorage` and `sessionStorage`. `grep` of `src/` finds no `localStorage`, `sessionStorage`, `document.cookie`. |
| No external requests / third-party analytics / fonts | Origins contacted during a full practice + check + summary journey: only the app's own origin. `grep` finds no external URLs in `src/`. |
| No live AI chat | No model call or chat UI exists; every message is controlled wording selected from fixed ids. |
| No answer logging | `src/` has no `console.*` or logging; the server keeps only in-memory session objects. |
| No answer-key exposure | Practice API replies contain only `kind`, `hintId`, `hintNumber`, `steps`, `seq`, `sessionStatus`, `challenge` (public numbers); assessment replies only `ack/status/question`. Existing Playwright tests scan responses and the built client chunks for answer-bank strings (`expectedAnswer`, item ids, `subtract-*`). Arithmetic is computable from the public numbers by anyone; only reserved answers, later hint steps and assessment content are protected. |
| Browser is not authoritative | The server evaluates every answer with the one evaluator; the client sends a number and a sequence value only. A request cannot name an item id (a mission id other than `subtract-practice` is rejected — probed: `GP-05`, `__proto__` → 400). |
| Hint-stage authorization | Probe: wrong answer 2 → `steps: {takeToTen: 3, takeFromTen: null}`; wrong answer 3 → `takeFromTen: 2`. The second step's number is not sent earlier. |
| Replay / staleness | Re-sending an earlier `seq` → 409 `stale`. A second assessment answer with the same `seq` → 409. |
| Warm-up bounded | `support` before an offer → 409; a second `support` after it started → 409; the offer exists once per session. |
| Assessment isolation | Assessment API rejects `hint` and `support` actions (400); summary before the check ends → 409; questions come only from the independent bank; no `correct` field in active-check replies. |
| Mastery | Draft policy has no thresholds; the summary prints "Mastery: not awarded" and states that no educator has approved rules. |
| Privacy headers | `/demo-progress`: `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`; API replies: `Cache-Control: no-store`; all routes: `X-Content-Type-Options: nosniff`. Covered by an existing browser test. |
| Dependencies | `npm audit --omit=dev`: 0 vulnerabilities (2026-10-16). Secret scan of tracked files (key/token/private-key patterns): no matches. No `.env*` files tracked. |

## 3. Session behaviour (code-inspected)

- **Storage:** in-process `Map`, one store each for practice and assessment. Nothing is written to disk or a database.
- **TTL:** 30 minutes after last use (sliding); expired sessions are dropped on access and on the next create.
- **Cap:** 500 sessions per store; the oldest is evicted when full (oldest first, regardless of activity).
- **Start limiter:** 120 starts per 60 s per process per flow, global, identifier-free (probe: 130 starts → 14 refused with 429, then recovers after the window).
- **Replay protection:** each request must quote the current `seq`; stale or duplicate → 409.
- **Expired / unknown session:** the UI shows a plain "no longer available" message and offers a fresh start; results are never rebuilt. The browser logs the expected 404.
- **Restart:** all sessions vanish. **Multiple instances / serverless:** each instance has its own store and limiter, so sessions and limits would behave inconsistently; the demo is single-process only.
- **Summary capability URL:** `/demo-progress?session=<uuid>` — whoever holds the link can read that synthetic summary until the session expires. The id is random (`crypto.randomUUID`), not logged, not sent as a Referer, not cached, not indexed. It is **in the URL** and therefore appears in browser history, screenshots and screen recordings: **crop or avoid showing it.**

## 4. Known limitations (what is not protected)

1. **No authentication or authorization of any kind.** Anyone who can reach the server can start sessions and use the APIs.
2. **Not cheating-proof.** The independent check is four fixed items in a fixed order; their answers are simple arithmetic and the order never changes. Anyone who has seen the demo knows the check.
3. **Not abuse-proof.** The rate limit is global to one process; a single client can fill the 500-slot stores and evict other people's live sessions (practice flow limited to 120 starts per minute).
4. **No site-wide `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, or `Referrer-Policy`** (only the summary page sets the latter). The pages could be framed by another site. For a public host these should be added before wider exposure. No change was made in this phase.
5. **Capability URL in history/recordings** (section 3).
6. **No TLS or host hardening is provided by the repository**; that depends on the host.
7. **No audit trail, incident process, retention policy, deletion process or vendor review** exist.
8. **Practice outcomes are not recorded**, so the demo cannot show how much help a learner used (see `docs/EVALUATION.md`).
9. **Rate-limiter and in-memory store are not suitable for multi-instance hosting.**
10. **Security testing was limited** to code reading, the existing suite and a small set of request probes. No penetration test, fuzzing campaign or third-party review was done.

## 5. Public-demo restrictions

- Adult-operated only; host on a private or access-controlled URL or run locally for recordings.
- Never enter a child's name, age, school, photo, voice or any personal data. The product asks for none; do not add free-text fields.
- Always show or state "Synthetic demonstration data, draft content, no educator review, no mastery awarded."
- Do not present a summary as a real child's result, a diagnosis, evidence of effectiveness or a claim about learning.
- Do not publish or share summary URLs.

## 6. Prohibited use

Use with real children; collection or storage of any child information; marketing the product as COPPA-compliant, secure, private-by-design certified, educator-approved, accessibility-conformant or effective; any pilot recruitment using this build.

## 7. Prerequisites before any real-child pilot (all not started)

Qualified-educator approval of content, hints and wording; approved mastery and delayed-check rules; legal review of COPPA/state student-privacy obligations and a consent design with verified parental authority; parent authentication and per-account authorization; persistent encrypted storage with retention, access and deletion flows; vendor and hosting review (including shared rate limiting and session storage across instances); site-wide security headers and a security review/penetration test; incident-response plan; independent accessibility evaluation with disabled users; a pilot protocol with adult supervision and stop rules. These map to the release blockers in `docs/SAFETY.md`.
