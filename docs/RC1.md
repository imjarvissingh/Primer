# Primer — Release Candidate 1 (2026-10-17)

Adult-operated demonstration, synthetic data only. **Not ready for real children.** Not merged, not deployed. Educator review, consent/legal, authentication, persistence and real-device testing are all still outstanding.

## 1. What changed in RC1 (and what deliberately did not)

| Change                                                                                                                                                                                                                                                                                                                 | Issue              | Kind                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------- |
| Answer picker is a compact grid (5 columns on phones, 7 from 640 px) instead of a ragged wrapping strip. All 21 choices (0–20) stay, in order, none highlighted. Phone height about 25% smaller (6 rows → 5). Every target ≥ 44 px at 320 px (a first version gave 40.8 px; a new test caught it and the gap was tightened). | #24, AUDIT-M3 no.8 | Presentation only   |
| The warm-up offer now states plainly: "If you choose Not now, this practice ends. You can start again whenever you like." Behaviour is unchanged.                                                                                                                                                                      | #19 (stays open)   | Honest label only   |
| Hardening headers on every route (`X-Frame-Options`, `Permissions-Policy`, `Referrer-Policy`, noindex), `X-Powered-By` removed, `GET /api/health` liveness probe.                                                                                                                                                      | #26                | Deployment prep     |
| [DEPLOYMENT.md](DEPLOYMENT.md): single-process constraint, setup, rollback, verification. Nothing deployed.                                                                                                                                                                                                            | #26 (stays open)   | Docs                |
| New tests: `tests/e2e/release-candidate.spec.ts`.                                                                                                                                                                                                                                                                      | #24, #26           | Tests               |

Not changed on purpose: hint text and eligibility, attempt counts, the ladder, the warm-up and what declining does, mastery rules, the assessment, scoring, the server, the rate limiters (120 starts per minute per process for each of practice and the check, no override), any API shape.

### Answer-entry design decision

- **Equivalent possibilities, so allowed:** a grid of the same 21 numbers. Same answers possible, same difficulty, same server grading, no new cue.
- **Not done, needs educator review:** a smaller option set (it would cue the answer and change difficulty), a typed numeric field (turns recognition into recall and invents new malformed input), a number line or stepper (a different task). The independent check uses the same picker, so these would also change assessment conditions. Recorded for #17/#20.
- Grading stays on the server; the client has no answer key (`tests/unit/boundary.test.ts`).

## 2. Audit findings (real browsers)

Tools: Claude in Chrome (confirmed working: navigated, screenshotted and read the page) and Playwright (Chromium only). Evidence: `docs/rc1-screens/` (390 px, real production build).

| ID    | Sev | Route / finding                                                                                                                                                                                                                                                                                    | Status                                                                              |
| ----- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| RC-01 | P1  | All five missions: 21 large answer targets filled 6 phone rows with an orphan "20".                                                                                                                                                                                                                | Mitigated (grid). Whether a different control is right is an educator question.      |
| RC-02 | P1  | All five missions: "Not now" on the warm-up ends the mission with "Let's try something a little easier next time". The button implied deferral.                                                                                                                                                    | Label clarified. Behaviour is an educator decision (#19, open).                      |
| RC-03 | P1  | Hint 1 is about 45 words plus a caption. Already says "This is a picture of the idea, not what you moved", so the make-ten picture is already framed as another representation (the critical requirement is met on main). Words and thresholds not changed. Make-ten vs the child's 5 taps: #16.     | Open, educator-blocked (#16, #17).                                                  |
| RC-04 | P2  | Scenes occupy about a third of a phone viewport (#35).                                                                                                                                                                                                                                             | Open; art pass is a separate asset task (#12).                                       |
| RC-05 | —   | Port 3200 on the founder's machine is held by an older server (pid 88550) that 404s the three newest worlds. Not an RC1 defect; RC1 was checked on port 3300. Anyone previewing must use a free port.                                                                                              | Informational. Left running, not killed.                                             |
| RC-06 | —   | Not verifiable by me: real VoiceOver, Safari, Firefox, physical touch devices, real 200% browser zoom.                                                                                                                                                                                             | Unresolved release limitation (#24).                                                 |

Verified in the real server and browser in this pass: wrong answer 1–3 (neutral, Hint 1, Hint 2), offer at wrong answer 4, decline, and a right answer with completion, in all five worlds at 390 px; the independent check and its "All done" state; response headers. The summary page's own content was last reviewed in Milestone 4 and not re-audited visually in RC1 beyond the unchanged automated tests. The parent summary does not show the chosen theme because the server's independent-check session does not retain it; none is invented.

## 3. Accessibility status

Tested automatically: 320/360/390/768/1024/1440 px, 200% text and a wide font at 320 px, reduced motion, keyboard operation, focus movement, 44 px targets, no sideways scroll (Chromium). **No real screen-reader pass was performed** (VoiceOver on macOS was not driven by this assistant). #24, #29 and #32 stay open: external validation is not claimed. Interest-card `aria-describedby` (#32) and heading focus (#29) were not re-verified with assistive technology.

## 4. Demo operator script (about 3 minutes)

Use a fresh single server. Never restart mid-take. Do not show the `?session=` URL.

1. Home → "Choose what your child loves". Say: "This is an adult-operated prototype with synthetic data. It has not been validated with children or reviewed by an educator."
2. Welcome → Choose an interest → Cricket → Start the cricket mission.
3. Cricket: Start practice → tap any 5 balls → pick 9 (wrong, deliberately) → read the neutral reply → pick 9 again → Hint 1 shows → pick 8 → "Practice can begin!".
4. "Change interest" → Building → same 13 − 5 with blocks. Say: "Same engine, same math, same rules; only the story and objects change."
5. Independent check → Start → answer four questions (11, 12, 8, 8). Say: "No hints or right/wrong here; guided help is never counted as independent."
6. Summary (adult) → read the synthetic label and the cautious wording. Do not call anything mastery.
7. Back to Primer home.

Never say: proven, mastery, validated, educator-approved, traction.

## 5. Route checklist (run on any build before recording)

- [ ] `/api/health` → `{"ok":true}`
- [ ] `/`, `/welcome` load; interest cards select; "Surprise me" works
- [ ] `/cricket`, `/block-builder`, `/space-construction`, `/basketball`, `/soccer`: start, tap 5 objects, answer unlocks, wrong answer ladder, correct answer, "Start over"
- [ ] Warm-up: accept (answer 4, then back to 13 − 5) and decline (ends practice, as stated on the offer)
- [ ] Replay after completion starts a fresh session; switching interests starts a separate practice
- [ ] `/assessment`: four questions, no feedback, skip and stop work, "All done" links to summary
- [ ] `/demo-progress?session=bad` shows the expired/unknown message; no data
- [ ] 320 and 390 px: no sideways scroll; reduced motion: nothing animates

Automated equivalent: `npm run validate`.

## 6. Recording plan

Product walkthrough only (separate from the YC founder video, which is the founder talking, no gameplay; see [YC-FOUNDER-VIDEO.md](YC-FOUNDER-VIDEO.md)). Screen-record a fresh server at 1440 × 900 (laptop) plus one 390 px phone-width take; follow section 4; trim any frame showing a session id; keep the synthetic-data banner visible. Blocker status: **none found for a stable recording**, but the founder must do the recording and review it.

Flaws likely visible on camera: scenes are flat vector art, a third of a phone screen (#35, #12); Hint 1 is wordy; the 21-number grid still appears; declining the warm-up ends the mission; no sound; the guide's lines are fixed text.

## 7. YC application readiness (exact state)

Engineering for the demo: ready for founder review. Not in the repo or not done: the founder's own facts and the real portal questions; the founder video; the product recording; any parent or educator conversations; educator review of any math content. No traction, endorsement or learning outcome exists or is claimed. See [YC-SUBMISSION-CHECKLIST.md](YC-SUBMISSION-CHECKLIST.md).

## 8. Release gates still open

Educator review (#16, #17, #19, #20); screen-reader, Safari, Firefox and device testing (#24); consent, legal and privacy review (#23); authentication and persistence; hosting authorization (#26); no CSP; art pass (#12); sound (#14).
