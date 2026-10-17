# Primer — Hosted demonstration: deployment plan (RC1)

**Status: prepared, not deployed.** Nothing here has been purchased, configured or published. Hosting, payment, DNS and a public URL need the founder's separate authorization. The hosted app is an **adult-operated demonstration with synthetic data only**; real-child access stays disabled (see [SAFETY.md](SAFETY.md)).

## Hard constraint: one long-lived Node process

Practice sessions, assessment sessions and the start limiters (120 starts per minute per process, one fixed-window limiter each for practice and for the check) live in the memory of one server process (`src/server/ttl-store.ts`, `rate-limit.ts`). Therefore:

- **Run exactly one instance.** With two or more, a learner's next request can reach a process that never saw their session ("session lost"), and the start limit becomes per instance.
- **Do not use serverless or per-request hosting** (functions that spin up per request or scale to zero between calls): each cold instance starts with empty sessions. A platform that "scales to zero" must be set to always-on with a minimum and maximum of one instance.
- **Restarts and deploys end every session.** Sessions also expire 30 minutes after last use, and each store holds at most 500 sessions. The app already shows a plain "start again" message for a lost session; nothing is persisted and nothing can be recovered. Do not deploy or restart during a recording or live demo.
- Making this multi-instance needs a documented persistence redesign (shared store, shared limiter) and a separate decision. Not part of RC1.

## Recommendation

A single always-on container or VM running `next start`, on any host that can: run Node 20.9 or newer (CI uses 24), keep one instance warm, terminate HTTPS for you, and probe `/api/health`. Typical candidates are Fly.io, Render and Railway (one always-on service) or a small VM with a reverse proxy. **No prices are given here: none were verified.** Check the provider's current pricing page before choosing, and pick the smallest always-on size. Memory need is small (at most 1,000 short sessions of a few kilobytes each plus Next.js itself); measure on the chosen host rather than trusting this estimate.

Avoid for the hosted demo: Vercel/Netlify-style serverless functions (session loss, above).

## Setup (when the founder authorizes it)

1. Build: `npm ci && npm run build`
2. Start: `npm run start -- --port "$PORT"` (one process; Next listens on all interfaces by default).
3. Health check: `GET /api/health` returns `{"ok":true}` with `Cache-Control: no-store`. It exposes no counts, versions or configuration.
4. HTTPS: terminate TLS at the platform or proxy. The app sets no HSTS header of its own; enable HSTS at the proxy only once the final hostname is fixed.
5. Environment variables: **none are required.** No secrets, API keys, database URLs or analytics exist in the app. Do not add any to the repository. (`PRIMER_E2E_PORT` and `PRIMER_E2E_REUSE` affect only the Playwright tests.)
6. Logging: the app writes no application logs of its own and records no learner data. Platform request logs may include URLs; the summary URL carries a short-lived session id, so do not share those logs publicly.

## Response headers (verified locally on the production build)

Every route: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, a restrictive `Permissions-Policy`, `X-Robots-Tag: noindex, nofollow`, no `X-Powered-By`. API replies and `/demo-progress`: `Cache-Control: no-store`; `/demo-progress` also `Referrer-Policy: no-referrer`. **No Content-Security-Policy is set**: Next.js inline scripts need a nonce-based policy that has not been built or tested. That is a known gap, not a claim of coverage. The rule is global in `next.config.ts`; `tests/e2e/release-candidate.spec.ts` asserts it on every page route, `/api/health` and the practice API.

## Dependencies

`npm audit --omit=dev`: 0 vulnerabilities (2026-10-17). `npm audit` (all): 5 high, all in the lint toolchain (`braces` via `eslint-config-next` → `fast-glob`); not shipped to production. The offered automatic fix downgrades `eslint-config-next` to 14.x, a breaking change, so it was not applied. Revisit when an upstream release fixes it.

## Verify the hosted app (after any future deploy)

1. `GET /api/health` → 200 `{"ok":true}`.
2. `curl -sI <url>/` shows the headers above.
3. Run the route checklist in [RC1.md](RC1.md) once on the hosted URL, on a phone and a laptop, with a fresh session.
4. Confirm `<url>/demo-progress` without a valid `?session=` shows the "may have expired" message, not data.
5. Confirm only one instance is running in the platform dashboard.

## Rollback

Redeploy the previous commit (the platform's "previous release" or `git checkout <tag>` then rebuild). This ends all sessions; that is expected. To take the demo offline, stop the service; there is no data to clean up or export.

## Not done

No hosting account, DNS, certificate, public URL, uptime monitoring, CSP, shared session store or load test exists. Single-instance capacity beyond a handful of adult-operated sessions is unmeasured.
