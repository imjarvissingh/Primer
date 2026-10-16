# Primer — MVP Readiness Matrix (Phase 8D)

Date: 2026-10-16. Base commit `78575b5` plus the Phase 8D commit. Status key — **Verified**: checked by automated tests or direct inspection in this audit. **Provisional**: implemented and plausible, awaiting expert or user validation. **Blocked**: cannot proceed until a named prerequisite exists. **Not tested**: not examined.

**The categories below are deliberately separate.** The product is suitable for an _adult-operated, synthetic-data demonstration_ and is _blocked for any real-child use_. A passing automated suite is evidence that the software behaves as specified, not that it teaches or is accessible, safe or compliant.

## Matrix

| Area                                    | Status                              | Basis and limits                                                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional prototype                    | **Verified**                        | 470 unit/component/server tests and 101 Playwright tests pass on a fresh build; both themes, hints, warm-up, check and summary run end to end (this audit's scripted journeys plus the suite). Chromium only.                            |
| Mathematics correctness                 | **Verified** (arithmetic) / **Provisional** (presentation) | The one evaluator and the banks produce 13−5=8, 10−6=4 and the four independent answers; the hint numbers (3 and 2) and ten-frame cells are consistent with them (unit tests, inspection). Whether the pictures and wording teach correctly is educator territory. |
| Tutoring policy implementation          | **Verified** (as specified) / **Provisional** (as pedagogy) | Code matches `docs/CURRICULUM.md` and the Phase 8C table: neutral → Hint 1 → Hint 2 → one warm-up offer → return; after return the ladder replays and the fourth wrong answer ends the mission. Observed deviations from the written intent are listed below. |
| External educator review                | **Blocked** (real-world gate)       | No reviewer has been identified or engaged. The packet `docs/EDUCATOR-REVIEW-PACKET.md` is ready. Self-review does not count.                                                                                                             |
| Accessibility                           | **Provisional**                     | axe-core: 0 violations in ~100+ states; contrast, keyboard, reflow and text-spacing checks done in Chromium; five defects fixed. **Screen readers, other browsers and real devices: Not tested.** No conformance claim (`docs/ACCESSIBILITY-AUDIT.md`). |
| Independent assessment (isolation)      | **Verified**                        | No hints/ten-frames/warm-up (API rejects them), disjoint item bank, one scored answer per item, identical acknowledgement for right and wrong, server-side scoring (code reading, tests, live probes).                                    |
| Evidence interpretation                 | **Verified** (implementation) / **Provisional** (labels) | Summary shows asked, answered, correct, skipped, not reached, skills sampled; "Mastery: not awarded"; practice excluded. No thresholds exist. Parent-facing wording is not yet checked with parents or educators.                         |
| Synthetic demo security                 | **Provisional**                     | Controls observed (`docs/DEMO-SAFETY-REVIEW.md`); no authentication, no CSP/frame protection, per-process limits, capability URL. Not a security review.                                                                               |
| Real-child privacy and consent          | **Blocked**                         | No consent flow, parental authority, data inventory, retention or deletion, legal review. Not COPPA-compliant and not claimed to be.                                                                                                      |
| Production authentication               | **Blocked**                         | None exists; parent accounts and per-account authorization are unbuilt.                                                                                                                                                                  |
| Persistent storage                      | **Blocked**                         | Deliberately none; in-memory sessions only.                                                                                                                                                                                               |
| Reliability                             | **Provisional**                     | Clean fresh-server runs; sessions lost on restart/30-minute expiry with explicit recovery messages; single process only; no monitoring.                                                                                                  |
| Hosting suitability                     | **Not tested**                      | Only local production builds were run. In-memory stores and limiters are unsuitable for multi-instance or serverless hosting.                                                                                                             |
| Customer discovery                      | **Not tested**                      | No interviews have been done. `docs/YC-VALIDATION-PLAN.md` (with the Phase 8D addendum) describes adult-only discovery.                                                                                                                   |
| Child pilot readiness                   | **Blocked**                         | Requires educator approval, consent/legal, authentication, storage, security review, independent accessibility evaluation, pilot protocol (`docs/DEMO-SAFETY-REVIEW.md` section 7).                                                      |
| YC product-demo readiness (adult-operated, synthetic) | **Verified** for the rehearsed path; **Provisional** overall | The runbook path runs reliably on a fresh server (below). Educator concerns A–C are open and visible in the demo; say so on camera. No video was recorded or uploaded. |

## Demo rehearsal result (2026-10-16)

Scripted, on a fresh production build, at 390 px (mission) and across viewports: homepage → Block Builder → place 5 blocks → wrong answer 1 (neutral) → Hint 1 → Hint 2 → warm-up offer → warm-up (10 − 6, answer 4) → back at the mission → solve (8) → Space Construction (same journey, separate session) → independent check (11, 12, 8, 8) → adult summary (4 questions, 4 answered, 4 correct, 0 skipped, 0 not reached; "Mastery: not awarded"). No runtime exceptions, no broken navigation, no clipping at 320–1440 px after the fixes, no answer keys in client output, no cookies or storage, no external requests. The practice sessions and the check are **separate server sessions**; theme switching starts a new session and persists no learner account, and the summary contains nothing from practice. Recording readiness: the runbook's startup, route order and session-reset steps work; summary URLs contain the session id and must be cropped; keep a second recording take as backup.

## Observed deviations and open design questions (none changed in this phase)

1. **Hints versus the learner's own action** — the learner has already tapped 5 blocks before Hint 1; the hints say "take 3 first" / "You took 3" and outline blocks 11–13 regardless of what was tapped (and the outline remains in Hint 2). Educator packet §5.
2. **Hint 1 may disclose the key strategy step early** (packet §3) and **warm-up 10 − 6 may not address the barrier** (packet §4).
3. **"Not now" on the warm-up ends the mission** with "This one was a big challenge…" instead of returning to the question; the offer text says "Then you come back to…" only for the accept path.
4. **Hint count after the warm-up is not cumulative.** `returnToMission` restores the earlier hint count (2), but the replayed Hint 1 sets it to 1. Harmless today because practice records no evidence and nothing displays or stores it; revisit if practice outcomes are ever stored. The code comment "Earlier hints stay counted" overstates this.
5. **Hint panel position on phones** — below the answer picker, off-screen (ACCESSIBILITY-AUDIT A11Y-07).
6. **Security headers** — no CSP / frame protection site-wide (`DEMO-SAFETY-REVIEW.md` §4).

## Verified in this phase vs not

Verified: tests and audit statuses above; CI passed for the Phase 8C commit (run 38907701023); production dependency audit 0 vulnerabilities. Not verified: anything labelled Provisional, Blocked or Not tested.

## Remaining blockers and next gates

1. A qualified educator reviews the packet and decides concerns A–C (a real person; not self-review).
2. Independent screen-reader and real-device accessibility testing.
3. Adult discovery interviews (no children).
4. Only after those, and legal/consent/authentication/storage/security work, consider any child pilot.
