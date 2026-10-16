# Primer — Solo Founder Tasks

8 focused hours/day. Primary coding agent implements, secondary agent reviews when appropriate. Inspect -> plan -> small change -> tests -> review -> commit.

Oct 16 scope; 17 setup/CI (application foundation and CI configured 2026-10-16); 18 curriculum; 19 evaluator; 20 tutor policy; 21 building canvas; 22 full mission; 23 hints; 24 assessment; 25 Space theme; 26 progress; 27 device QA; 28 regression/security; 29 demo freeze; 30–Nov 1 YC content; Nov 2 deadline buffer.

Nov 3 defects; 4 authentication; 5 access isolation; 6 legal/consent/vendor assessment; 7 persistence; 8 deletion/report; 9 accessibility; 10 educator review; 11 security; 12 rehearsal; 13 pilot only if fully approved; 14 evaluate; 15 release decision.

If behind: simplify art/theme depth, not mathematical correctness, assessment separation, privacy or safety.

## Phase 2 status (2026-10-16)
Done: curriculum graph and validation, five problem types with validated evaluator, four draft banks with integrity checks and answer-free projection, tutoring policy, evidence contracts with a conservative (draft) mastery policy, architecture tests.

Remaining before any child pilot: educator review of skills, edges, banks and hint content; educator-approved mastery thresholds; Phase 3 Block Builder mission (must follow the server-side boundary in ARCHITECTURE.md); selection/ordering of items and learner-exposure tracking (needs persistence, deliberately not built).

## Phase 3 status (2026-10-16)
Done: Block Builder "The Broken Bridge" at `/block-builder` (server-authoritative scoring and tutoring, tap/keyboard blocks, hints, completion/stop/skip/restart, unit/component/browser tests, answer-isolation checks). It is a draft demonstration, not educator-approved.

Not done / next: Phase 4 Space Construction on the shared engine; the prerequisite ("easier practice") activity; educator review of the item, hints and wording; real persistence and authentication before any child pilot.

## Phase 4 status (2026-10-16)
Done: shared mission engine with two themes (Block Builder, Space Construction), theme contract and tests, themed hint wording with equivalence tests, construction-readiness gate, both journeys covered in Playwright (desktop/tablet/small mobile, keyboard, reduced motion, double submit, answer isolation).

Still open: educator review of the item, hints and theme wording (including "modules" for the space theme); the prerequisite "easier practice" activity; persistence/authentication before any pilot; Phase 5 (independent assessment and parent-facing evidence demo).

## Phase 5 status (2026-10-16)
Done: independent check at `/assessment` (independent bank, one question at a time, neutral replies, one scored answer per item, skip and stop), server-derived evidence through the Phase 2 interpreter, adult demo summary at `/demo-progress`, unit/server/component/browser tests including answer-isolation checks.

Still open: educator review of the independent items and all wording; approved mastery thresholds (none exist, so none is awarded); delayed check and persistence (need identity, consent and storage); rate limiting and authentication before any real use; Phase 6 demo stabilisation.
