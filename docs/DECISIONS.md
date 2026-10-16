# Primer — Decisions 2026-10-16

US first; math first; Block Builder and Space Construction; shared theme-neutral curriculum and evaluator; original characters; React/SVG first, no complex game engine; deterministic hints; synthetic demo before child pilot; solo founder with coding agents; no coding prompt until requested.

Open: legal consent approach, US educator reviewer, parent recruitment, final providers, actual skill-difficulty equivalence.

Deferred: voice, limitless generative content, 3D, user-uploaded copyrighted characters, multiplayer, payments, sophisticated knowledge-tracing infrastructure.

## Phase 1 implementation decisions (2026-10-16)
npm as package manager. System font stack instead of Google-hosted fonts (no external requests). Prettier for formatting, with eslint-config-prettier. Playwright tests the production build, not the dev server. Next.js scaffold defaults `cacheComponents` and `partialPrefetching` kept as generated. CI runs `npm audit --omit=dev` and gitleaks; dev-only audit findings in the ESLint toolchain are tracked, not force-fixed.

## Phase 1.5 maintenance (2026-10-16)
**Accepted risk — braces (GHSA-vfj7-8cjw-p6xm, high, CVSS 7.5).** Chain: eslint-config-next 16.4.2 → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3. The advisory lists no patched version (braces 3.0.3 is the latest release), so `npm audit` still reports 5 high findings and they are **unresolved**. Impact is a denial of service (stack exhaustion crashing the Node process) from deeply nested brace patterns; it is dev-only (`npm audit --omit=dev` reports 0), and lint patterns come from this repository, not untrusted input. The audit's suggested fix downgrades to Next 14 and was rejected. Follow-up: re-run `npm audit` monthly and after any `eslint-config-next` update. CI audits production dependencies only, so this known dev finding does not block builds.

**CI hardening.** `actions/checkout` and `actions/setup-node` are pinned to full commit SHAs (the commits behind their v4 tags). The gitleaks tarball is verified against a pinned SHA-256 before use; bump version and hash together. Pins do not update themselves, so review them periodically.

