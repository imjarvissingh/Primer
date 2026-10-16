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

## Phase 6 status (2026-10-16)
Done: session-loss and error recovery messages, mid-check "Start over", hidden-page state reset, start rate limit, privacy headers and noindex on the summary, skip link, copy fixes, [DEMO-RUNBOOK.md](DEMO-RUNBOOK.md), recording-path and failure-recovery browser tests on three viewports.

Follow-up (not started): Phase 7 YC narrative, demo recording and founder video. Still open from before: educator review, approved mastery rules, persistence/authentication/consent before any real child use, shared-store rate limiting for multi-instance hosting.

## Phase 7 status (2026-10-16)
Done: YC requirements checked against official pages (Winter 2027 batch, Nov 2 8pm PT; founder video rules; application questions are behind login and were not seen), and public-safe drafts: [YC-APPLICATION.md](YC-APPLICATION.md), [YC-DEMO-STORYBOARD.md](YC-DEMO-STORYBOARD.md), [YC-FOUNDER-VIDEO.md](YC-FOUNDER-VIDEO.md), [YC-VALIDATION-PLAN.md](YC-VALIDATION-PLAN.md), [YC-SUBMISSION-CHECKLIST.md](YC-SUBMISSION-CHECKLIST.md). No application code changed.

Founder responsibilities: log in and copy the real questions; supply all personal facts; record the demo and founder video; run parent and educator conversations; write and submit the application privately.

## Phase 8A status (2026-10-16)
Done: original Primer visual identity (wordmark, tokens, shared button/card/notice styles), redesigned home page, richer Block Builder and Space Construction scenes with a visible goal, mission framing (goal line, "on the bridge: N (goal: M)" progress with pips, themed feedback and outcome), calmer assessment with a position bar, clearer adult summary (stat cards, per-question marks, prominent synthetic-data label). No engine, scoring, hint or assessment-logic changes. Visual QA done with Playwright screenshots at 375, 768 and 1440 px (light, plus dark at 768).

Not started: educator review, persistence/authentication/consent.

## Phase 8B status (2026-10-16)
Done: bridge and station scenes show one built slot per placed item (derived from the single selection set), returns empty slots, restart/put-all-back clears them; slot-in motion honoring reduced motion; home card pill alignment; contrast measured (no fixes needed). No math, tutoring, API, schema or assessment changes. Tests: shared-state, slot-mapping, restart and incorrect-answer unit tests, plus per-theme Playwright journey and reduced-motion checks.

Not started: Phase 8C (instructional feedback, make-ten visualization, prerequisite remediation).
