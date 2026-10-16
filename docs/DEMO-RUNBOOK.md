# Primer — Demo Runbook (Phase 6)

How to run and record the product demo reliably. Everything here uses normal product behavior: there is no demo mode, no answer override and no fixture data.

**Synthetic-data disclosure.** Every number on the adult summary comes from a made-up demo session. No real child's information is collected or shown. All questions, hints and wording are drafts not reviewed by an educator, and no mastery is awarded (no educator has approved mastery rules). Say this on camera. The product walkthrough is a separate deliverable from the founder video.

## Prepare

1. `git status` clean, on `main`; `npm ci`.
2. `npm run build && npm start -- --port 3000` (a production build is steadier than `npm run dev` for recording; dev hot-reload can drop sessions).
3. Free disk space and a quiet browser profile (no extensions that inject UI). Window about 1280×800; also try 390×844 for a phone segment.
4. Restart the server immediately before recording. Sessions live in memory for 30 minutes after last use and vanish on restart.

## Route sequence (about 75–90 seconds of screen time)

| #   | Route                                | Do                                                                                                 | Expect                                                                                                 |
| --- | ------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | `/`                                  | Show the two worlds and the independent check card                                                 | Draft/unreviewed notice visible                                                                        |
| 2   | `/block-builder`                     | **Start building**, tap blocks 1–5                                                                 | Each tap fills one bridge slot; counter reads "Blocks on the bridge: 5"; answer buttons unlock                                         |
| 3   |                                      | Pick **9**, **Check my answer**                                                                    | Calm "Not quite yet…" message, then a hint after more tries                                            |
| 4   |                                      | Pick **8**, **Check my answer**                                                                    | "The bridge is fixed!", with a note that this is practice with help, not a test                        |
| 5   | `/space-construction` (outcome link) | **Start the mission**, same steps                                                                  | Different look, same math; a new, separate practice session                                           |
| 6   | `/assessment` (outcome link)         | **Start**, answer 11, 12, 8, 8                                                                     | "Your answer is saved." after each; no right/wrong, no hints                                           |
| 7   | `/demo-progress?session=…`           | Open **Summary for a grown-up (demo)**                                                             | Counts 4 / 4 / 4 / 0 / 0, per-question table, "Mastery: not awarded", synthetic-data note              |

Do not show or share the summary URL after recording: the session id in it is the only access control. Crop it out of any screen capture you publish.

## Restart and recovery

| Situation                                      | What happens                                                                         | What to do                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------- |
| Want to redo a mission                         | **Start over** (during play or on the finish screen) opens a new session             | Press it                                      |
| Want to redo the check                         | **Start over** (during the check or on the last screen)                              | Press it                                      |
| Refresh mid-mission or mid-check               | Returns to the introduction; the old server session is abandoned, not resumed        | Press Start                                   |
| Leave a page and come back through a link      | Opens at the introduction, never a half-played state                                 | Press Start                                   |
| Server restarted or 30 minutes passed          | "That check/practice is no longer available…"; summary says it cannot be found       | Start a new one. Results are never rebuilt    |
| Summary link with missing or invalid session   | "No completed check to show", with a link to start a new check                       | Take the check first                          |
| Brief network or server error                  | "We could not reach the activity…"; the question and the pick stay                   | Press the same button again                   |
| "Lots of people are trying this right now"     | Start limiter tripped (120 starts a minute per flow, per server process)             | Wait a minute                                 |

Abandoned sessions stay in memory until their 30-minute expiry (or until the 500-session cap evicts the oldest). That is harmless for a demo and is not a data store.

## Recording checklist

- [ ] Fresh production server, fresh browser tab, no saved summary URL on screen.
- [ ] Practice (steps 2–5) shown as guided practice with hints; check (6) shown as independent.
- [ ] Say: "Practice sessions and the check are separate; this demo does not link them."
- [ ] Say: "Demo data, draft content, no educator review, no mastery awarded."
- [ ] Do not speed up or cut the child-facing interaction in a way that implies it is faster than it is.
- [ ] Do not claim traction, interviews, outcomes or validation.
- [ ] Backup: if anything misbehaves, restart the server and re-record using the same steps; do not edit scores.

## Before you record: automated check

`npm run validate` (typecheck, lint, format, unit tests, build + Playwright). The `recording path` browser tests walk steps 1–7 on small-mobile, tablet and desktop sizes.

## Guided-practice walkthrough update and clean verification (Phase 8C)

In a mission, answer wrongly four times: wrong 1 gives a neutral note; hint 1 and hint 2 show a ten-frame; the fourth offers a short warm-up ("Try the warm-up" / "Not now" / "Stop for now"). After the warm-up (answer 4) you return to 13 − 5 (answer 8).

**Clean browser verification of the current code:** `PRIMER_E2E_PORT=3217 npm run test:e2e` (builds, then starts a fresh server). Playwright will not reuse a running server unless you set `PRIMER_E2E_REUSE=1`; if the port is busy it fails loudly. Do not trust screenshots unless the server was started from the build you just made.

## Phase 8D audit notes for the recording

- **Fresh build, fresh port.** Rehearsed on a production build; use the same path as above. After accepting the warm-up (10 − 6, answer 4) place 5 blocks again before answering 8.
- **Phone width:** the hint panel sits below the answer picker; scroll down after a wrong answer to show it (ACCESSIBILITY-AUDIT A11Y-07).
- **Say on camera** what the educator packet flags: hints are draft, Hint 1 may disclose too much, the warm-up choice is unreviewed, and the pictures do not follow the learner's own taps.
- **"Not now"** on the warm-up ends the mission with a "try something easier" screen (it does not return to the question). Use "Try the warm-up" for the recorded path.
- **Summary URL** contains the session id: crop it. The browser console shows one expected 404 for an unknown-session summary; it is not an error in the product.
- **Do not start more than 120 sessions a minute** (limiter); restarting the server resets every session and the limiter.
- Practice and the check are separate sessions; theme switching persists no account. Nothing was recorded or uploaded in Phase 8D. Status of every claim: [MVP-READINESS.md](MVP-READINESS.md).
