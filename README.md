# Primer

Primer is an early-stage, interest-personalized mathematics game for US children ages 6–9. It aims to turn a child's interest into a learning adventure while measuring mathematical understanding, not just engagement.

Two themed experiences share one curriculum and one learning engine:

- **Block Builder** — bridges, building blocks and a builder guide.
- **Space Construction** — a space station, modules and a space guide.

## Current stage

**Early development, with a draft demo.** The repository contains the planning documents, a deterministic curriculum/math/tutoring engine (`src/domain`), one guided subtraction mission in two themes (Block Builder _The Broken Bridge_ and Space Construction _The Space Station Mission_, 13 − 5), a short independent check, and an adult-facing synthetic evidence summary. The missions and check are **draft demonstrations**: its content and hints have not been reviewed by an educator, and it is not a tested learning product. There are no accounts, database or data collection, and no learning results exist.

## Try the demo

```bash
npm install
npm run dev          # then open http://localhost:3000/block-builder
                     # or http://localhost:3000/space-construction
```

Tap the 5 blocks (or modules) to put them on the bridge (or station), pick how many are left in the pile (or supply), and press "Check my answer". The answer buttons unlock once exactly 5 are placed. Answers are scored by the server (`/api/practice/mission`), which keeps short-lived in-memory sessions, so the demo needs `next dev` or `next start` (not a static export) and runs as a single instance. See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for the client/server boundary and limitations.

### Look and feel (Phase 8A)

Primer has an original visual identity: a warm cream/navy/teal system, a wordmark, and two distinct worlds (a sunny bridge-building scene and a space-station scene) on the same mission engine. The independent check is deliberately plainer. It uses system fonts, inline SVG and CSS only, honours reduced-motion settings, and adds no dependencies or data collection.

### Independent check and demo summary

`/assessment` is a short independent check (four draft questions, no hints, no right-or-wrong feedback, skippable). When it ends, "Summary for a grown-up" opens `/demo-progress?session=...`, which shows what the server recorded for that check: counts, each question's outcome, skills sampled and where the data came from. It says plainly that mastery is not awarded and that the data is synthetic. Opening `/demo-progress` with no session shows only guidance. Both are unauthenticated, in-memory, single-instance demos; see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

**Sessions and recovery.** Sessions live in server memory for 30 minutes after last use. Refreshing a page, restarting the server or waiting too long ends a session; the page then says so and offers a fresh start. It never resumes or rebuilds results from the browser. "Start over" always begins a new session. Hosted multi-instance deployments cannot rely on this in-memory store.

**Recording the demo:** follow [docs/DEMO-RUNBOOK.md](docs/DEMO-RUNBOOK.md).

## Getting started

Prerequisites: Node.js 20.9 or newer (developed on 24.16) and npm. Git is needed to clone.

```bash
npm install                      # install dependencies from package-lock.json
npx playwright install chromium  # one-time download for browser tests
npm run dev                      # development server at http://localhost:3000
```

| Command                | What it does                                           |
| ---------------------- | ------------------------------------------------------ |
| `npm run build`        | Production build                                       |
| `npm start`            | Serve the production build (run `build` first)         |
| `npm run typecheck`    | TypeScript strict type check                           |
| `npm run lint`         | ESLint                                                 |
| `npm run format:check` | Check Prettier formatting (`npm run format` fixes it)  |
| `npm test`             | Unit tests (Vitest + React Testing Library)            |
| `npm run test:e2e`     | Production build, then Playwright Chromium smoke tests |
| `npm run validate`     | All of the above checks in sequence                    |

Continuous integration (`.github/workflows/ci.yml`) runs the same checks on every push to `main` and on pull requests, plus a production-dependency audit and a gitleaks secret scan. There is no automatic deployment.

### Stack

Next.js 16.4.2 (App Router), React 19.3, TypeScript 5.9 (strict), Tailwind CSS 4.3, ESLint 9, Prettier 3.9, Vitest 5, React Testing Library, Playwright 1.64 (Chromium).

## Documentation

All planning documents live in [`docs/`](docs/00-INDEX.md):

| Document                                | Contents                                       |
| --------------------------------------- | ---------------------------------------------- |
| [00-INDEX.md](docs/00-INDEX.md)         | Project overview and milestones                |
| [PRODUCT.md](docs/PRODUCT.md)           | MVP product requirements                       |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Planned technical architecture                 |
| [CURRICULUM.md](docs/CURRICULUM.md)     | Skills, assessment banks, tutoring states      |
| [SAFETY.md](docs/SAFETY.md)             | Child-safety and privacy release gates         |
| [DECISIONS.md](docs/DECISIONS.md)       | Decisions made, open questions, deferred items |
| [EVALUATION.md](docs/EVALUATION.md)     | Hypotheses and pilot evaluation plan           |
| [TASKS.md](docs/TASKS.md)               | Solo-founder schedule                          |

## Safety-first approach

Primer is intended for children, so safety and privacy gate every release. Before any live child use, the plan requires COPPA-specific legal review, verified parental consent, minimal data collection, deletion processes, educator review of the curriculum, and security review. See [SAFETY.md](docs/SAFETY.md). Demos use fictional data only, and synthetic data is never presented as real learner outcomes.
