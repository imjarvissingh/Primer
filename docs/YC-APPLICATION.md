# Primer — YC Application Worksheet (public-safe template)

> **Public repository.** This file holds verified facts, draft wording built only from them, and `[FOUNDER: …]` placeholders. **Do not type personal answers, biography, interview notes or unannounced business details here.** Write the real answers in the YC portal or a private document, and paste from there.
> Not submitted. Nothing here is a completed application.

## 1. What was verified, and where (accessed 2026-10-16)

| Item                | Finding                                                                                                                                                                                | Source                                                                                                                                         | Confidence                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Batch               | "accepting applications for the Winter 2027 Batch"                                                                                                                                     | https://www.ycombinator.com/apply                                                                                                              | Official                                                            |
| On-time deadline    | "November 2 at 8pm PT". The official page does not print the year; an aggregator lists November 2, 2026 and decisions by December 11. Treat the year as consistent with this cycle, and **confirm the date inside the portal** | https://www.ycombinator.com/apply; aggregator: https://www.startupgrantsindia.com/y-combinator-winter-2027 (secondary)                        | Official date/time; year and decision date unverified               |
| Late applications   | Read "when we can", no guaranteed decision date                                                                                                                                        | https://www.ycombinator.com/faq                                                                                                                | Official                                                            |
| Founder video       | "1 minute long and … nothing except the founders talking"; all founders appear; introduce yourselves, "explain what you're doing and why"; "Do not recite a written script"; **not** the place for a demo | https://www.ycombinator.com/video/                                                                                                             | Official (page may be older than this cycle)                        |
| Demo video          | "there is a separate place in the application for that". No length or size limit stated on the official pages I could read. A secondhand report mentions a demo under 3 minutes and a 100 MB founder-video limit | https://news.ycombinator.com/item?id=40091622 (secondhand)                                                                                      | **Unverified; check the portal**                                    |
| One application     | One application per batch; co-founders get an email to complete their own profile; material changes after submitting go through an update form; optional Paxel builder report           | https://www.ycombinator.com/faq                                                                                                                | Official                                                            |
| Application form    | `apply.ycombinator.com/home` redirects to a YC login (`account.ycombinator.com`). **The real questions and character limits were not visible without founder login and were not bypassed.** | fetch result                                                                                                                                   | Not accessible                                                      |
| Historic question style | Paul Graham's essay quotes "What is your company going to make?", "something impressive that each founder has built or achieved", and a non-computer "hack" question                     | https://www.ycombinator.com/howtoapply                                                                                                         | Historical; wording may differ today                                |

Target: submit **before** Nov 2 (see [YC-SUBMISSION-CHECKLIST.md](YC-SUBMISSION-CHECKLIST.md)). Only the Nov 2 8pm PT time is official; do not rely on it being the last chance.

## 2. Positioning (drafts from verified product facts only)

Facts behind every line are in [section 3](#3-evidence-inventory). Hypotheses are labelled.

- **One sentence:** Primer is a draft math adventure for ages 6–9, in themes a child chooses, that keeps guided practice separate from an independent check so an adult can see what the child did unaided.
- **Short description:** Primer teaches early subtraction through construction-themed missions (Block Builder, Space Construction) built on one shared deterministic math and tutoring engine. Hints are available only during guided practice. A separate four-question independent check gives no hints or feedback, and an adult summary reports only what was answered independently, with mastery withheld until educators approve the rules. Today it is a working demo with synthetic data; no child has used it.
- **Problem (hypothesis, needs interviews):** Young children disengage from generic math practice, and parents struggle to tell whether a child understood something or was helped to the answer. [FOUNDER: personal insight/experience with this problem — leave blank if none.]
- **Solution:** Interest-themed practice plus a hard separation between assisted and independent evidence (verified in code and tests).
- **Why differentiated (hypothesis):** One engine, many themes; evidence provenance built in from the start; conservative reporting. *Unproven that any of this beats existing products.* Competitor landscape not yet researched (see [YC-VALIDATION-PLAN.md](YC-VALIDATION-PLAN.md)).
- **Why now:** [FOUNDER: your reasoning. Needs external citations (e.g. post-pandemic learning loss data, AI-assisted building lowering cost). **Not written here because I have not sourced any.**]
- **Initial customer (hypothesis):** US parents/guardians of children 6–9, with educator input. Not validated.
- **Business model (hypothesis, founder decision):** [FOUNDER: e.g. parent subscription. Payments are explicitly out of scope today; no willingness to pay has been tested.]
- **Long-term vision:** [FOUNDER: other subjects, grades, themes — the repo scopes the MVP to subtraction within 20 and lists many-subject ambitions only as "Not in MVP".]

**Never write:** proven learning improvement, "mastery", better engagement, parent demand, traction, educator-approved, YC endorsement.

## 3. Evidence inventory

Classes: **R** verified repository fact · **F** founder-reported (needs founder to confirm) · **H** hypothesis · **X** external research needing a citation · **U** unknown, founder input needed.

| Claim                                                                | Class | Evidence / status                                                                                                                                                      |
| -------------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routes `/`, `/block-builder`, `/space-construction`, `/assessment`, `/demo-progress` exist | R     | `src/app/*`; browser tests walk them on three viewport sizes (`tests/e2e/demo-journey.spec.ts`)                                                                          |
| Two themes share one engine and one server mission                   | R     | `src/themes`, `src/components/practice`; server cannot tell themes apart ([DECISIONS.md](DECISIONS.md) Phase 4)                                                         |
| Server-side scoring; client gets no answer keys                      | R     | `src/server`, `tests/e2e/missions.spec.ts` bundle scans, `tests/unit/boundary.test.ts`                                                                                  |
| Independent check: 4 items, no hints, neutral replies, one scored answer per item | R     | `src/server/assessment/service.ts`, `tests/unit/server/assessment.test.ts`                                                                                              |
| Adult summary built from server-recorded answers; never awards mastery | R     | `src/server/assessment/summary.ts`; draft policy cannot return mastery ([CURRICULUM.md](CURRICULUM.md))                                                                  |
| 353 unit/component tests, 60 Playwright tests, 0 production-dependency vulnerabilities, CI green on `3537e91` | R     | Local runs 2026-10-16; GitHub Actions run 38888519524 (success). Re-verify on the final commit before quoting                                                           |
| Built with AI coding assistance by a solo, beginner full-stack founder | F     | Stated by founder in the Phase 7 brief; being honest about this is advisable and not a weakness to hide                                                                  |
| Content reviewed by an educator                                      | R (negative) | **No.** All content is draft and unreviewed ([CURRICULUM.md](CURRICULUM.md))                                                                                  |
| Any child has used Primer                                            | R (negative) | **No.** No pilot; real-child testing is gated by [SAFETY.md](SAFETY.md)                                                                                                |
| Parent interviews, users, traction, revenue, waitlist                | U     | None recorded anywhere in the repo. Do not imply any                                                                                                                    |
| Founder background, education, employment, school/teaching experience | U     | Not in the repo                                                                                                                                                         |
| Team (co-founders), incorporation, location, fundraising             | U     | Not in the repo                                                                                                                                                         |
| Interest-matched themes raise engagement or learning                 | H     | [EVALUATION.md](EVALUATION.md) H1–H2; untested                                                                                                                          |
| Parents value verified evidence                                      | H     | EVALUATION H3; untested                                                                                                                                                 |
| Market size, learning-loss statistics, competitor claims             | X     | Not yet sourced                                                                                                                                                         |

## 4. Question worksheet

The official form could not be viewed without login, so the question wording below is **PROVISIONAL**: reconstructed from historically common YC questions. **Replace each with the exact wording and character limit from the portal when the founder logs in.**

Review status key: ☐ not started · ◐ draft from facts, needs founder · ✔ founder approved.

| # | Provisional question | Verified facts to use | Draft answer (facts only) | Founder input missing | Claims to verify | Length | Status |
| - | -------------------- | --------------------- | ------------------------- | --------------------- | ---------------- | ------ | ------ |
| 1 | What is your company going to make? | Section 2 one-sentence and short description | "Primer is a math adventure for children 6–9, starting with subtraction within 20. A child practises in a theme they pick (building a bridge, assembling a space station) with hints, then does a separate four-question check with no hints. A grown-up sees a summary of only the independent answers. It works today as a demo with synthetic data; we have not tested it with children." | Whether to name a business model; plain-language edits | "children 6–9" is the target, not a user base | 1–3 sentences, plain, matter-of-fact | ◐ |
| 2 | Describe what each founder has built or achieved that is impressive | Only the product itself is documented | [FOUNDER: your own achievement. If Primer is the answer: "Built and tested a working two-theme math product, with server-side scoring and 353+60 automated tests, using AI coding tools, as a first full-stack project." State the AI assistance plainly.] | Everything personal | Do not inflate; no claims about skills not in evidence | 1–2 sentences each | ☐ |
| 3 | Describe a time you hacked a (non-computer) system to your advantage | None | — | Entire answer | — | Short story | ☐ |
| 4 | Why did you pick this idea? Do you have domain expertise? | None | [FOUNDER: real reason; real exposure to children/education/teaching, if any] | Entire answer | Don't invent school/teaching experience | Short paragraph | ☐ |
| 5 | Who are your users, and what do they need? | Target = US parents of ages 6–9 (hypothesis) | "We believe parents of 6–9-year-olds want to know whether practice reflects what the child can do alone. We have not yet interviewed parents." (update after interviews) | Interview results | All demand claims | Short | ◐ |
| 6 | How far along are you? Users, revenue, waitlist | Product state in section 3 | "Working demo; no users, no revenue, no pilot yet." | Anything more | Must be literally true | Short | ◐ |
| 7 | How will you make money? | Hypothesis only | [FOUNDER] "Hypothesis: …. Untested." | Pricing view | No evidence of willingness to pay | Short | ☐ |
| 8 | Who are your competitors; what do you understand that they don't? | None researched | — | Competitor research ([YC-VALIDATION-PLAN.md](YC-VALIDATION-PLAN.md)) and genuine insight | All comparisons need citations | Short | ☐ |
| 9 | How long have you worked on this; full-time? | Git history shows first Phase 1 commit 2026-10-16 (check `git log`) | [FOUNDER] | Honest time commitment | Don't claim longer than the history supports without other evidence | 1–2 lines | ☐ |
| 10 | Founders: names, roles, equity, incorporation, location, other ideas | None | — | All | — | Form fields | ☐ |
| 11 | Demo (separate field) | [YC-DEMO-STORYBOARD.md](YC-DEMO-STORYBOARD.md) | Link/upload after recording | Recording | Must disclose synthetic data | Check portal | ☐ |
| 12 | Founder video (separate field) | [YC-FOUNDER-VIDEO.md](YC-FOUNDER-VIDEO.md) | — | Founder records | Real facts only | 1 minute | ☐ |

## 5. Answer principles (from YC's own guidance)

Paul Graham's essay (https://www.ycombinator.com/howtoapply): put the key point first, "the best answers are the most matter of fact", avoid marketing language, explain real insight and obstacles, cut unnecessary words. A truthful "no users yet, here is exactly what works and what we will learn next" is stronger here than any inflated claim.

## 6. Public/private handling

Commit: this template, the storyboard, outlines, plans. Keep private: filled answers, biography, interview notes and names, anything unannounced. Suggested private location: a document outside this repository (or an untracked folder; `.gitignore` does not currently exclude one, so do not put it in the repo directory). The Drive planning folder named in the brief was not accessed from this session.
