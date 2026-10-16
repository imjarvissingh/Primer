# Primer — Architecture

Modular TypeScript monolith: Next.js, React/SVG tap-first game UI, versioned curriculum data, deterministic math evaluator, tutor policy, assessment isolation, learner evidence, parent auth/privacy and theme packs. PostgreSQL when persistent child records are justified and approved.

## Module dependency graph
Curriculum -> evaluator and tutoring policy -> shared game -> theme packs -> assessment -> progress reporting. Parent auth/consent/security is parallel and required for child pilot.

## Core contracts
Themes can modify art and approved narrative wording but cannot change mathematical answers. Assessment answers remain server-authoritative. Assisted practice never proves unaided mastery. Attempts are idempotent and reference item/content versions. Parent isolation enforced server-side.

## Validation
TypeScript strict, lint, Vitest, Playwright, build, dependency and secret scanning, GitHub Actions. One AI coding agent edits at a time.
