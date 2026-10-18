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

## Phase 8C status (2026-10-16)

Done: accessible read-only ten-frame pictures tied to the two make-ten hints; the server now discloses a hint's step numbers only with that hint; one bounded, server-controlled warm-up (take-away within ten) offered once when the policy asks for prerequisite practice; Playwright no longer silently reuses a running server.

Still open (all draft): **external educator review** (checklist in docs/CURRICULUM.md); whether the warm-up should be S03 (policy's choice) or part-whole (S02); persistence/authentication before any pilot. Phase 8D not started.

## Phase 8D status (2026-10-16)

Done: review-and-readiness milestone, no new features. Added [EDUCATOR-REVIEW-PACKET.md](EDUCATOR-REVIEW-PACKET.md) (actual 13 − 5 journey, Hint 1 / warm-up / ten-frame concerns, review questions, blank private review record), [ACCESSIBILITY-AUDIT.md](ACCESSIBILITY-AUDIT.md) (axe-core + scripted Chromium checks, contrast table, findings), [DEMO-SAFETY-REVIEW.md](DEMO-SAFETY-REVIEW.md), [MVP-READINESS.md](MVP-READINESS.md), an adult-discovery addendum in [YC-VALIDATION-PLAN.md](YC-VALIDATION-PLAN.md), and runbook notes. Five demonstrated accessibility defects fixed with regression tests: 320 px reflow of the mission and of the adult summary, pile items overflowing their panel at 640–720 px (200% zoom), focus lost after Start / Start over, and the hint's "outlined" cue exposed to assistive technology. No mathematics, tutoring-policy, API, scoring or assessment changes.

Still open: **external educator review** (real-world gate; self-review does not count), the three pedagogical concerns (Hint 1 disclosure, warm-up choice, ten-frame representation), screen-reader and real-device testing (not tested), open accessibility items A11Y-06…10, adult discovery, and everything behind the child-pilot blockers (consent/legal, authentication, persistence, security review). No video was recorded or published.

## Phase 8E status (2026-10-17)

Done: A11Y-07 fixed. After a wrong answer, keyboard focus moves once to a labelled feedback region (neutral, Hint 1, Hint 2) so it is scrolled into view on phones; not a live region, so no double announcement. No policy, wording, scoring or API change. New regression suite `tests/e2e/feedback-visibility.spec.ts` (22 tests, 320–1440 px, both worlds, reduced motion) plus unit tests. Educator packet gained a reproduction guide, a plain-words statement of the construction-vs-ten-frame mismatch and a blank decision table (section 6A). Accessibility audit has a dated verification section.

Still open: external educator review (nothing approved); the five pedagogical decisions (Hint 1 disclosure, ten-frame vs the learner's taps, warm-up choice, declining the warm-up, age fit); screen-reader and real-device testing (not done); A11Y-11 (sideways scroll at 200% text) fixed in Phase 8F, Chromium only.


## Phase 8F status (2026-10-17)

Done: A11Y-11 fixed (CSS only). Cause was the mission grid's implicit column growing to the non-wrapping resource rows at large text, not the SVG art; also fixed homepage wordmark, long headings and button labels at 320 px. New `tests/e2e/text-scaling.spec.ts` (25 tests; 11 fail on the 8E code). Evidence in `docs/ACCESSIBILITY-AUDIT.md`.

Still open: external educator review (nothing approved) and its five pedagogical decisions; screen-reader, real-zoom, Safari/Firefox and physical-device testing (none done).

## Five-day MVP sprint (2026-10-17 to 2026-10-21)

Plan: [MVP-5-DAY-PLAN.md](MVP-5-DAY-PLAN.md). Issues: https://github.com/imjarvissingh/Primer/issues (#1 to #30, milestones Day 1 to Day 5).

**Milestone 1 (Day 1) status**, on branch `milestone1/connected-journey`, draft PR #31 (CI green on the PR; not merged, not deployed): welcome and interest selection connected to home, to the two real missions, to the check and to the summary (#1, #2); e2e start-limit exhaustion fixed by serial test runs, with no production override (#3, #30); focus after in-app navigation fixed (#29). Awaiting founder review.

**Not done:** Cricket (#7), Basketball (#8), Soccer (#9) are preview only. Prototype evaluation (#4), educator review (#20), deployment (#26).

**Blocked on external review:** #16, #17, #19, #20, #22 (suggestions).

**Next (Day 2) top priorities:** #6 shared theme contract, #7 Cricket, #5 session lifecycle, #11 Surprise me, #4 prototype decision.

## Milestone 2 (Oct 17, 2026): five playable worlds
Branch `milestone2/five-worlds` (draft PR; not merged). Done and verified locally: three new worlds on the shared engine (#6, #7, #8, #9), Surprise me (#11), previews use the mission story (#10), hint framing, replay and switching tests. Open: premium art and animation (#12, #13), educator review (#16 to #20), accessibility pass (#24, #29, #32), deployment (#26). Day 3 priorities: visual identity and guide characters (#12), tactile animation with reduced-motion equivalents (#13), parent copy (#21), accessibility (#24).

## Milestone 3 (Oct 17, 2026): real-browser audit, countable worlds
Branch `milestone3/countable-worlds` (draft PR; not merged). Audit: [AUDIT-M3.md](AUDIT-M3.md). Done and tested: countable drawn objects and themed trays (#12, #18), reacting guides (#12), tactile CSS motion (#13), finished world on screen, parent explanation (#21), keyboard focus follows moved objects. Open: premium art pipeline (#12), educator review (#16 to #20), screen-reader and device testing (#24, #29, #32), prototype reuse (#4), session lifecycle audit (#5), deployment (#26). Not started: next milestone.

## Milestone 4 (Oct 17, 2026): game art, motion, parent polish
Branch `milestone4/game-art` (draft PR; not merged). Done and tested: layered scenes, phone composition (#35, partly), flying objects and celebration timing (#13), richer guides (#12), unified welcome art, summary polish (#22 polish only), assets-independent rendering. Open: real art pass (#12), scene still not full-screen on phones (#35), educator review (#16 to #20), screen-reader and device testing (#24, #29, #32), sound (#14), deployment (#26). Final stabilization milestone priorities: full device and browser pass, accessibility fixes from real assistive technology, YC recording, deployment decision.

## RC1 (Oct 17, 2026): stabilization and deployment readiness
Branch `rc1/stabilization` (draft PR; not merged, not deployed). Report: [RC1.md](RC1.md); hosting plan: [DEPLOYMENT.md](DEPLOYMENT.md). Done: real-browser audit of all five worlds, compact answer grid with unchanged answer set, honest warm-up "Not now" label, hardening headers, `/api/health`, demo script, route checklist, recording plan. Open: educator review (#16 to #20), screen-reader and device testing (#24, #29, #32), scene size and art (#35, #12), hosting authorization (#26), CSP, YC founder items and recordings (#27, #28). Not started: next milestone.

## Cricket vertical slice (Oct 17, 2026, issue #38)
Branch `feature/cricket-academy-vertical-slice` (draft PR; not merged, not deployed). Done and tested: animated skippable intro (#13), scoreboard, rack-of-ten view, drawn target places, finale from the learner's real selection, draft make-ten lab (#16/#17 stay open and gated), cricket e2e and unit suites. Open: educator review (#16 to #20), original art pass (#12, #15), phone scene size (#35), screen-reader and device testing (#24), YC recording (#28). Not started: other worlds on this mechanic.

## Learning Experience 2.1 (Oct 18, 2026): Cricket make-ten lab
Branch `feature/cricket-make-ten-lab-2-1`, stacked on PR #39's head (draft PR; not merged, not deployed). Done and tested: preliminary AI-assisted audit of the 13 − 5 lesson (packet §6C.2), five-step draft lab where the learner names the extras, the part still needed and the remainder, an unguided 11 − 4 try, Back/Start again, keyboard focus, reduced motion, presentation-neutral model. Open: **qualified educator review** (§6C.7 questions, #16–#20), real VoiceOver and device testing (#24), merge of PR #39 (founder action), adult usability sessions with real participants (script in `docs/DEMO-RUNBOOK.md`), any reuse in other worlds or the tutor (needs approval).

## Learning Experience 2.2 (Oct 18, 2026): lab integration, mobile layout, interaction, review package
PR #41 was rebased onto `main` after PR #39's squash merge (one lab commit; verified diff of lab files and docs only) and retargeted; still a DRAFT, not merged, not deployed. Done: empty step-4 status card removed (live region is now hidden; counts sit in panel titles); board pinned above the question when it leaves room, tested at 320×568, 390×664 and 390×844; 44 px phone objects and "3 | 2" nets as wrapping groups; Cricket palette applied to the lab page; step 3 no longer states the number; counting marks; support after repeated wrong numbers; one travel system for taps, Back and Start again; rapid-tap and Back-focus defects fixed; educator kit (`docs/LAB-REVIEW-KIT.md`) and adult usability protocol (`docs/DEMO-RUNBOOK.md`); regenerated screenshots; cross-browser and accessibility notes in `docs/ACCESSIBILITY-AUDIT.md`. Open: **qualified educator review** (kit; #16–#20), real screen-reader and physical-device testing (#24), adult usability sessions, #35 (scene composition in the five worlds, not the lab), and any reuse in other worlds or the tutor (needs approval). Not started: other worlds, new topics, anything in the tutor.
