# Primer — Decisions 2026-10-16

US first; math first; Block Builder and Space Construction; shared theme-neutral curriculum and evaluator; original characters; React/SVG first, no complex game engine; deterministic hints; synthetic demo before child pilot; solo founder with coding agents; no coding prompt until requested.

Open: legal consent approach, US educator reviewer, parent recruitment, final providers, actual skill-difficulty equivalence.

Deferred: voice, limitless generative content, 3D, user-uploaded copyrighted characters, multiplayer, payments, sophisticated knowledge-tracing infrastructure.

## Phase 1 implementation decisions (2026-10-16)
npm as package manager. System font stack instead of Google-hosted fonts (no external requests). Prettier for formatting, with eslint-config-prettier. Playwright tests the production build, not the dev server. Next.js scaffold defaults `cacheComponents` and `partialPrefetching` kept as generated. CI runs `npm audit --omit=dev` and gitleaks; dev-only audit findings in the ESLint toolchain are tracked, not force-fixed.

