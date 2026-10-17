# Primer — Educator Review Packet (DRAFT, awaiting a qualified reviewer)

Prepared 2026-10-16 (Phase 8D) from the code at commit `78575b5`; refreshed 2026-10-17 (Phase 8E) for the focus/visibility change described below (the instructional wording, hint order and warm-up policy are unchanged). **All content in this packet and in the application is DRAFT and unreviewed. Status: NOT reviewed. Nothing here is educator-approved.** All pedagogical comments in section 5 are the implementer's provisional observations, offered as questions for a reviewer; they are not findings of an educator and must not be quoted as such.

All wording below is copied from the running application (Block Builder theme unless noted; Space Construction swaps nouns only: "module", "supply", "station").

## 1. Product context

- **Intended learners:** US children ages 6–9. **Current scope:** one lesson area, subtraction within 20, with a focus on subtracting across ten.
- **Draft skill graph** (`docs/CURRICULUM.md`, prerequisite edges are implementation assumptions): S01 count 0–20 → S02 compose/decompose teen numbers; S01 → S03 take-away; S04 make-ten (requires S03, then S02); S05 independent transfer (an assessment objective, not a lesson).
- **Learning objective of the first lesson:** compute 13 − 5 (and similar) and reason about the quantity that remains, using a make-ten strategy as support.
- **Theme personalization:** "Block Builder" (bridge) and "Space Construction" (station) change only nouns, art and colors. The mathematics, hints and policy are identical. Whether the two themes carry _equal_ meaning is a review question (Q8).
- **Practice vs independent check:** guided practice (hints, pictures, warm-up) is a separate server session that records nothing. The independent check (`/assessment`) is four different unseen items (16 − 5, 19 − 7, 14 − 6, 17 − 9), no hints, no correctness shown, one scored answer per item. The two are not linked.
- **No mastery is awarded**; no mastery thresholds exist (a qualified educator must supply them).

## 2. Worked example — the actual 13 − 5 journey

Mission item: "The builder has 13 blocks. The team uses 5 of them on the bridge. Tap 5 blocks to put them on the bridge." The learner taps any 5 of 13 numbered blocks (the answer picker unlocks only when exactly 5 are on the bridge), then picks a number 0–20 for "How many blocks are left in the pile?". Correct answer 8 (known only to the server).

Intended make-ten reasoning (the policy's strategy numbers): 13 = 10 + 3; 5 = 3 + 2; 13 − 3 = 10; 10 − 2 = 8. The application states the numbers 3 and 2 but never writes the equations, and never shows 8.

| Step                         | What the learner sees (verbatim)                                                                                                                                                                                                                                                                                       | Picture                                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start                        | Block pile: blocks 1–13 in two rows of 5 and a row of 3. "On the bridge": none yet.                                                                                                                                                                                                                                    | Bridge scene with an empty gap.                                                                                                                                           |
| After tapping 5              | "Blocks on the bridge: 5 (goal: 5)" / "5 blocks on the bridge. Now count the ones left in the pile." Used slots stay visible as dashed empty squares.                                                                                                                                                                  | Bridge scene shows 5 built slots.                                                                                                                                         |
| **Wrong answer 1**           | "Not quite yet. Look at the blocks in the pile and try again. There is no rush."                                                                                                                                                                                                                                       | none                                                                                                                                                                      |
| **Wrong answer 2 — Hint 1**  | "Hint 1 / Try this: take 3 blocks first. Then the pile is a full ten. The outlined blocks are those 3." + "Draft demo hint, not yet reviewed by an educator."                                                                                                                                                          | Blocks 11–13 in the pile get a dashed outline. Ten-frame picture: left frame "Ten" with 10 filled counters; right frame "Extra" with 3 ✕ circles. Caption "✕ means take these first." |
| **Wrong answer 3 — Hint 2**  | "Hint 2 / You took 3 blocks to make a full ten. You still need to take 2 more from the ten. How many are left?"                                                                                                                                                                                                        | "Ten" frame: 8 filled counters and 2 ✕ circles; "Extra" frame: 3 dashed circles. Caption "✕ means take these next. A dashed circle is already taken." Blocks 11–13 stay outlined. |
| **Wrong answer 4 — offer**   | Heading "Want a short warm-up first?" / "It is a smaller one with the same idea. Then you come back to The Broken Bridge." Buttons: **Try the warm-up**, **Not now**, **Stop for now**.                                                                                                                                 | Bridge scene, not started.                                                                                                                                                |
| Warm-up (if accepted)        | Heading "Warm-up" / "A smaller one first. Then you go back to The Broken Bridge." / "The builder has 10 blocks. The team uses 6 of them on the bridge. Tap 6 blocks to put them on the bridge." Same question form; answer 4. Hints for this item are the take-away hints ("Cover the blocks you take away…").  | Same manipulatives with 10 blocks.                                                                                                                                        |
| Return to the mission        | "You are back at the mission. Take your time." Manipulatives reset; the learner places 5 blocks again.                                                                                                                                                                                                                 | —                                                                                                                                                                         |
| Solve                        | Correct (8): "The bridge is fixed! You said 8 blocks were left, and that is right. Thank you for helping the builder." + "This is practice with help. It is not a test and does not measure mastery."                                                                                                                  | Celebration art.                                                                                                                                                          |
| If wrong again after warm-up | The ladder replays (neutral note, Hint 1, Hint 2). A fourth wrong answer ends the mission: "Let's try something a little easier next time / This one was a big challenge. A grown-up can help, or you can start again whenever you like." The warm-up is never offered a second time.                                 | —                                                                                                                                                                         |
| If the learner chooses "Not now" | The mission **ends** with the same "Let's try something a little easier next time" screen (it does not return to the question).                                                                                                                                                                                    | —                                                                                                                                                                         |
| Other exits                  | "Skip this challenge" appears only after repeated unreadable answers; "Stop for now" and "Start over" are always present.                                                                                                                                                                                              | —                                                                                                                                                                         |

**Independent-assessment separation (verified in code and tests):** the check offers no hints, ten-frames or warm-ups; its items are disjoint from the guided-practice bank; each answer is acknowledged identically ("Your answer is saved.") whether right or wrong; the adult summary is built only from the server's record of those four answers and states "This demo does not link a practice session to a check. Nothing from practice appears in this summary."

## 3. Concern A — what Hint 1 discloses

**What it says:** "take 3 blocks first. Then the pile is a full ten." The picture shows 10 counters plus 3 ✕ marks.

**What it reveals:** (1) the strategy "remove the extras to reach ten first"; (2) the split size (3), which is the decomposition of 13 into 10 + 3; (3) that the remaining quantity after step one is exactly ten.

**What remains for the learner:** recognising that the 5 to be taken is 3 + 2; finding the second part (2) — which is only supplied by Hint 2, one wrong answer later; computing 10 − 2; and connecting the result to "how many are left". Hint 1 gives no final number and no equation.

**Provisional observation (not an educator finding):** Hint 1 hands over the most conceptually demanding step (choosing 3 as the first take by recognising 13 = 10 + 3) rather than prompting for it. The learner is told rather than asked. Hint 2 then gives the second part of the subtrahend (2) and frames the last step as 10 − 2 — leaving essentially one simple fact (10 − 2) after two hints.

**Alternative wordings for an educator to consider** (none is implemented):

1. _Question prompt (weaker):_ "13 is a full ten and some extras. How many extras are there?" (shows the frame, asks for 3).
2. _Strategy cue without numbers:_ "Can you take just enough to make the pile a full ten?" (outlines the extras but does not state 3).
3. _Part-whole cue:_ "5 is made of two parts. One part gets the pile down to ten. What could that part be?"
4. _Delay the strategy:_ Hint 1 shows only the ten-frame split of 13 (10 and 3) without any instruction; Hint 2 supplies "take 3 first".

Any change alters the tutoring policy and requires an explicit decision recorded in `docs/DECISIONS.md`.

## 4. Concern B — warm-up selection

**Implemented:** the policy's prerequisite for S04 is S03 (first listed prerequisite); the warm-up is guided-practice item GP-05, **10 − 6 = 4** (answer hidden), using the same tap-blocks interface. After the warm-up the learner returns to 13 − 5 with a fresh try.

**What it exercises:** take-away from exactly ten; counting what remains within ten. This overlaps with the final step of the make-ten route (10 − 2) and with S03 skills generally.

**What it does not exercise:** the likely barrier for 13 − 5 — recognising that 13 is 10 + 3 and that 5 splits into 3 + 2 (S02, part-whole composition/decomposition). Nothing about crossing ten or decomposing the subtrahend appears in the warm-up. A learner who needs the warm-up for the _decomposition_ step is not helped by it, and the warm-up result is not used for any decision (the learner always returns to the same item).

**S02 alternatives in the bank:** GP-03 (6 + 7 = ?, compose) and GP-04 (15 = 8 + ?, decompose). Neither is the smallest relevant fact (for example "5 = 3 + ?" or "13 = 10 + ?"). An S02 warm-up would also need a different interaction than the current subtraction manipulatives (which only model taking away) — it is not a one-line swap. **No substitution has been made.**

**Questions for the reviewer:** is a take-away within ten an acceptable bridge for this learner, or should the warm-up be part-whole, or both in sequence? Should the warm-up result influence what happens on return?

## 5. Concern C — representation and misconception risks (provisional)

Observed facts first, then risks to be judged by an educator.

Facts: the "Ten" frame is a 2 × 5 grid read left→right, top→bottom, filled counters first; the "Extra" frame holds the 3 ones above ten. States differ by shape as well as color: filled counter, hollow circle with ✕ ("take now"), dashed circle ("already taken"), empty cell. In Hint 2 the ✕ cells are the last two cells of the ten and the three extras are shown as dashed circles. The picture never prints the answer, but the 8 remaining filled counters can be counted. The pictures are generic and are drawn from the numbers 13, 3 and 2, not from the learner's actual taps.

Risks for review:

1. **Picture vs learner's own action.** The learner has already tapped 5 blocks (any of the 13) _before_ any hint. Hint 1 says "take 3 blocks first" and outlines blocks 11–13 in the pile; Hint 2 says "You took 3 blocks". If the learner tapped blocks 1–5 (as the pile numbering invites), the hint describes an action the learner did not take, and the outline sits on blocks that are not part of their selection. The hints are not tied to the learner's state. The learner is also not asked to re-do the removal in two stages. (Checklist items 3, 9.)
2. **Used vs remaining.** The question asks for what is _left in the pile_. The ✕ marks and "taken" circles show the removed amount; the answer is the unmarked remainder. Hint 2's wording "How many are left?" is tied to the "Ten" frame, but the frame also contains the removed cells; a learner may count the wrong set (all 10, the 2 ✕, or the 3 dashed circles) — nothing in the picture says which group is the answer.
3. **Extras shown in a separate frame.** The three extras appear as hollow ✕ circles in a different frame (and then as dashed circles). This may help showing "13 = 10 + 3" but may also suggest that the extras are different objects from the counters, or that the dashed circles are "still there". The dashed circles in Hint 2 and the continuing outline of blocks 11–13 in the pile (the outline is not removed in Hint 2) may conflict with "already taken".
4. **Meaning of crossing ten.** Nothing in the wording explains _why_ one makes ten (the benefit of working with a friendly number). The strategy is stated procedurally.
5. **Decomposing the subtrahend.** The decomposition 5 = 3 + 2 is never shown as a part-whole picture; the learner sees only 3 (Hint 1) and 2 (Hint 2) as instructions.
6. **Symbol meaning.** ✕ is used for "take now" and "take next" in two stages with a changed caption. Whether 6–9-year-olds read a hollow circle with ✕ versus a dashed circle as intended has not been tested with children.
7. **Reading load.** Hint text is 2–3 sentences plus a caption plus a "Draft demo hint" note (reading level not measured). Hints appear _below_ the answer picker. Before Phase 8E, on a 390 px phone the panel started at the bottom edge of the screen (about 1,760 px below the top of the page) and a child could miss it. Since Phase 8E, keyboard focus moves to the new help once, which scrolls it into view (see section 6A). Whether children notice and read it has **not** been tested with children.

## 6. Review questions

Please answer on the record in section 8. Mark each: _appropriate / needs change / unsure_, with a short reason.

1. **Mathematical correctness:** are 13 − 5 = 8, the split 13 = 10 + 3, 5 = 3 + 2, 13 − 3 = 10, 10 − 2 = 8 and the warm-up 10 − 6 = 4 all correct as presented, and are the pictures consistent with them?
2. **Grade-level appropriateness** for ages 6–9 (which grade band is this suited to?).
3. **Conceptual progression:** neutral note → Hint 1 → Hint 2 → warm-up offer. Is this order and spacing right? Should the learner act on each stage?
4. **Hint disclosure timing:** is naming "take 3 first" in Hint 1 too much, too early? Which alternative in section 3 (or another) would you use?
5. **Ten-frame representation:** is the 2 × 5 frame with a separate "Extra" frame conventional? Are ✕ and dashed circles clear? Do you want counters that match the learner's blocks?
6. **Warm-up selection:** is take-away within ten (10 − 6) right, or should it be part-whole (S02), or both?
7. **Reading load and vocabulary:** words such as "pile", "outlined", "full ten", "extra".
8. **Theme equivalence:** do "blocks on the bridge" and "modules on the station" carry the same arithmetic meaning (including "used" vs "left")?
9. **Misconception risks** listed in section 5 — which are real, which are not, which are missing?
10. **Feedback tone:** "Not quite yet…", "Let's try something a little easier next time / This one was a big challenge", "Taking a break". Is any of it discouraging? Should "Not now" on the warm-up end the mission?
11. **Independent check:** do four unseen items (two take-away, two cross-ten) support _useful descriptive_ observations? Is the fixed order right? What follow-up should occur for skipped items?
12. **Additional prerequisites** (counting, teen-number place value, fact fluency) that you would require before this lesson.
13. **Evidence labels:** are "Answered independently", "Correct in this short check", "Skipped", "Not reached", "Needs more evidence", "Mastery: not awarded" understandable and appropriately cautious for a parent?
14. **Physical manipulatives / audio / other accessibility alternatives** needed for learners who cannot use the screen interaction?
15. **Mastery rules:** what independent and delayed evidence would you require (minimum correct, maximum incorrect, delay)? These are blank in the product by design.

## 6A. Where to see each stage, and what the reviewer must decide

**Routes (adult-operated, synthetic data):** `/block-builder` (bridge) and `/space-construction` (station) are the same lesson with different nouns; `/assessment` is the separate no-hint check; `/demo-progress` is the synthetic adult summary. Use a phone-width window (about 390 px) at least once.

**Reproduction guide (Block Builder; the other world is identical with "module", "supply", "station"):**

1. Open `/block-builder`, press **Start building**.
2. Tap blocks 1–5 (the answer picker unlocks).
3. Pick **9**, press **Check my answer** → _neutral feedback_ ("Not quite yet…"). Focus moves to this message.
4. Pick 9 again → **Hint 1** (with ten-frame). Focus moves to the "Hint 1" heading; the hint is scrolled into view.
5. Pick 9 again → **Hint 2**.
6. Pick 9 again → **warm-up offer** ("Want a short warm-up first?").
7. **Try the warm-up** (tap 6 blocks, pick 4) → back at the mission; or **Not now** → the mission ends. Wording of every stage is quoted verbatim in section 2.

**What is unchanged since the last packet:** hint text, hint order, ten-frame pictures, the warm-up (10 − 6), the "Not now" outcome and the fixed ladder (neutral → Hint 1 → Hint 2 → offer). Only the _delivery_ changed (focus and scroll position); nothing about _what_ is said.

**Construction-versus-ten-frame mismatch, in plain words.** The learner first taps any 5 of 13 blocks (they choose which). Hint 1 then shows a ten-frame that says "take 3 first" and outlines blocks 11–13, as if the learner had not yet acted; the ten-frame counters are not the learner's blocks. A learner who tapped blocks 1–5 sees a picture of a different action from the one they performed. Hint 1 also states the first step ("take 3") before the learner has been asked to find it. These are the issues in sections 3 and 5 (risk 1). **They are deliberately not fixed**; the choice between telling, asking, or matching the picture to the learner's taps is a policy decision for the reviewer.

**Decision table (blank). Do not fill in without a real reviewer; do not record names or contact details here.**

| # | Decision | Current behaviour (draft) | Options raised so far | Reviewer decision |
| --- | --- | --- | --- | --- |
| 1 | Hint 1 disclosure | Says "take 3 blocks first" after one wrong follow-up | Section 3, alternatives 1–4 | |
| 2 | Ten-frame stage interpretation | Hint 1: 10 counters + 3 ✕ in an "Extra" frame; Hint 2: 8 counters + 2 ✕, 3 dashed | Matching counters to the learner's blocks; one frame; no ✕ | |
| 3 | Construction versus strategy explanation | Learner taps 5 first; the hint then describes "take 3 first" | Explain the link; ask the learner to find 3; reorder the steps | |
| 4 | Choice of prerequisite warm-up | 10 − 6 (take-away within ten, S03) | Part-whole (S02), both, or none | |
| 5 | Declining the warm-up | "Not now" ends the mission with the "something easier" screen | Return to the question; offer once more; only stop on "Stop for now" | |
| 6 | Age appropriateness | Targeted at ages 6–9 | Narrower band; reading level; audio | |
| 7 | Clarity of assisted vs independent learning | Practice says it is "not a test"; check shows no hints and no correctness | Wording; parent explanation; labels | |

## 6B. Cricket Academy vertical slice (2026-10-17) — three categories, kept apart

Issue #38. **Nothing below is educator-reviewed.** No AI agent has certified any of it.

**A. Existing approved software behaviour (unchanged).** Server-side evaluation, attempt counting, the fixed hint ladder (neutral → Hint 1 → Hint 2 → warm-up offer), session lifecycle, assessment isolation. Not touched by this slice. (Software behaviour only; the wording and pedagogy inside it are category B.)

**B. Existing draft educational content (unchanged, still pending).** Make-ten Hint 1 and Hint 2 wording, the warm-up, and the construction-vs-hint mismatch in section 6A.

**C. New instructional hypotheses added in the Cricket slice (all pending review):**

| # | Hypothesis | Where | Connected to scoring or hints? |
| --- | --- | --- | --- |
| C1 | Seeing the quantities apart (at the start / sent to the nets / left, shown as "?") helps separate whole, part taken, and part left | Scoreboard on `/cricket` | No. Display only. |
| C2 | Letting the learner regroup 13 balls into a rack of ten plus extras ("Make a ten") before or while moving balls supports later ten-based strategies | `/cricket`, optional toggle, default off | No. Same buttons, same selection. |
| C3 | Drawing five empty places at the nets makes "how many are needed" visible without a numeral | `/cricket` | No. |
| C4 | Showing the learner's own five balls and the balls really left after a server-confirmed success connects action to result | Finale on `/cricket` | Shown only after a server "correct". |
| C5 | A four-step make-ten sequence: fill a rack of ten → take the three extras → work out how many more are needed to reach five → take them from the ten → count what is left | `/cricket/make-ten-lab` (separate, adult-operated) | **No.** Client only, no API calls, nothing saved. Not linked from any hint. |

**Interactive sequence (C5), learner action at each step.** 1. Tap balls into a rack that holds ten (observe/organise). 2. Tap the three loose balls to the nets, then choose how many more the coach needs (decide). Wrong choice: "Look at the nets. Count the empty spots." (neutral, local check, nothing scored). 3. Tap two balls from the rack (manipulate). 4. Tap each ball left in the rack to count it (demonstrate). Then: "13 take away 5: you took 3, then 2 more from the ten, and counted 8 left. This is one way. Taking any 5 balls leaves the same number."

**Prior knowledge assumed:** counting to 13, knowing a ten-frame/rack of ten, 3 + 2 = 5.

**Likely misconceptions to watch:** (a) the lab's 3-then-2 order becomes the only "right" way to subtract (the closing line tries to prevent it); (b) "make a ten" is read as "always take from ten"; (c) the child reads the shown "13" and "5" as the whole task and skips counting; (d) the "?" is read as a hidden number the app knows, not a question for them.

**Accessibility barriers noticed (not yet tested with assistive technology):** the story animation is non-essential and every beat is reachable with Next/Back; balls are buttons, but a child who cannot tap precisely has no drag alternative; the lab's counting uses toggle buttons, not speech. Screen readers, physical devices and children: not tested.

**Questions for the reviewer:** Is C2 helpful or does it pre-empt the strategy choice? Should the lab's sequence ever be offered inside the tutor (that would need a policy change and explicit approval; it was **not** done)? Is showing the remainder after success (C4) fine, or does it encourage reading rather than counting? Is the "How many more does the coach need?" step age-appropriate? Should the make-ten steps ask the learner to find the three extras rather than tapping them?

_Update 2026-10-18: the C5 lab described above has been replaced by the five-step draft in section 6C (the learner now names the extras, the second part and the remainder). C1–C4 are unchanged._

## 6C. Learning Experience 2.1 and 2.2: the Cricket 13 − 5 case study and the redesigned draft lab (2026-10-18)

**Start with `docs/LAB-REVIEW-KIT.md`** (message to send, demonstration route, decision map, prioritized questions, feedback template). This section is the detailed reference behind it.

**Status: DRAFT. NOT reviewed by a qualified educator.** The audit below is an AI-assisted preliminary review by the implementing agent (with an AI code review by Codex CLI). It is a list of questions and observations. It is not an educator finding, not an endorsement and not evidence that anything helps children learn. No child and no educator has used this build.

This section is self-contained: a reviewer can read it without the code. Screenshots of the real running page are in `docs/cricket-lab-screens/`: `m390-*` every mathematical state on a 390 px phone, `m320-*` the question states on the smallest phone, `d1440-*` key states on a desktop. Regenerate with `tests/tools/capture-lab-screens.mjs`.

### 6C.1 Who and what

| Item | Draft answer (pending review) |
| --- | --- |
| Learners | US children 6–9, adult-operated demo only |
| Target skill | Subtracting across ten within 20 using a make-ten (decompose the subtrahend) strategy; S04 in `docs/CURRICULUM.md` |
| Assumed prerequisites | Counting objects to 13 (S01); a full ten as a unit, teen number = ten and some ones (S02); 5 = 3 + 2 and similar small splits; take-away meaning of subtraction (S03) |
| Lesson objective (hypothesis) | After the activity the learner can explain 13 − 5 as "13 is 10 and 3; take the 3, then 2 more from the ten; 8 are left", and try a similar problem without prompts |
| Where | `/cricket/make-ten-lab` (separate page; linked for grown-ups from `/cricket`). Not connected to hints, scoring, sessions, the independent check or the parent summary |

### 6C.2 Gate A: preliminary audit of the existing Cricket 13 − 5 lesson (AI-assisted, not an educator review)

"Definite defect" = a software or representation fault that can be checked. "Hypothesis" = an instructional judgement that only a qualified educator can make. Line numbers refer to commit `3c3f9dc`.

| # | Current behaviour (before this change) | Concern | Kind | Severity | Source | Proposed improvement | Software change | Educator approval | Test strategy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Mission: the learner taps any 5 of 13, then picks how many are left from 0–20 | Only one mathematical decision (the final number). Counting what remains is a valid take-away method, but no make-ten reasoning is ever required | Hypothesis | Medium | `PracticeMission.tsx` 437–547 | Keep the mission (it is the authoritative, server-scored practice). Offer decisions about ten and extras only in the separate draft lab | None in production | Yes: whether the mission should ever require the strategy | Existing five-world suites unchanged |
| A2 | "Make a ten" toggle moves the *first ten* balls into a rack | A view switch: the app does the grouping and the learner decides nothing | Hypothesis (C2) | Medium | `CricketStation.tsx` 57–98; `ConstructionField.tsx` 116–126 | In the lab, the learner fills the rack and then says how many are outside it | Lab only | Yes | Lab unit + e2e |
| A3 | Scoreboard: start 13, sent N of 5, left "?" | Keeps whole / part taken / part left apart; "?" is never filled in by the app | No defect found | — | `CricketStation.tsx` 25–49 | Keep | None | Optional (C1) | Existing |
| A4 | Intro "job" caption states the goal | Goal without the solution; no countable remainder drawn | No defect found | — | `CricketIntro.tsx` 48–54 | Keep | None | No | Existing |
| A5 | Hint 1 / Hint 2 (shared, server-authorised) say "take 3 first… you took 3" | Describes an action the learner may not have done; tells rather than asks | Definite mismatch (section 6A) + wording hypothesis | High (pedagogy) | `FeedbackPanel.tsx`; packet §3, §5 risk 1 | Unchanged here. The lab shows a sequence whose picture does match the learner's actions, for comparison | None in production | **Required** before any hint change | — |
| A6 | Answer picker: 21 numbers (0–20) | Large set for ages 6–9, but it does not cue the answer and matches the check (RC1 decision) | Hypothesis | Low | `AnswerPicker.tsx`; DECISIONS RC1 | Unchanged in the mission. The lab offers 0 to the starting amount so the likely mix-ups (5, 10, 13) can be chosen | Lab only | Yes (#17) | Lab e2e |
| A7 | Old lab step 1 status printed "Outside the rack: 3" while filling | Told the learner the number of extras | Definite defect | Medium | old `MakeTenLab.tsx` 154–160 | No outside count is printed; the learner is asked for it | Lab | No | Unit: status never contains it |
| A8 | Old lab step 2 always said "start with the balls outside the rack" | Strategy imposed; acceptable only if labelled as one way | Hypothesis | Low | old `MakeTenLab.tsx` 99–101 | "One way to start…"; closing note says any 5 leaves the same number | Lab | Yes | e2e wording |
| A9 | Old lab step 4: the app showed "Counted: N" as balls were tapped, then printed "…counted 8 left" | The app counted and stated the result; the learner never decided how many were left | **Definite defect** | High | old `MakeTenLab.tsx` 175–181, 223–229 | Silent marking aid; the learner answers "How many balls are still in the rack?"; recap only after a right answer | Lab | No (wording yes) | Unit: `recap()` null until right; e2e: result absent before answer |
| A10 | Old lab: no unaided application | No look at whether the idea is used on a new problem | Hypothesis | Medium | old lab | Step 5: 11 − 4, no rack, no strategy words, no hints; not a bank item; not saved | Lab | Yes (item, whether a rack is offered, timing) | Unit: bank-collision test |
| A11 | Old lab: no way back a step | Could not recover from a mistaken step | Definite usability defect | Low | old `MakeTenLab.tsx` 231–252 | "Back a step" restores the step exactly; moving a ball clears any answer about that picture | Lab | No | Unit + e2e |
| A12 | Old lab: focus fell to the page after a ball moved | Keyboard users restarted from the top after each move | Definite a11y defect | Medium | old `MakeTenLab.tsx` | Focus goes to the next ball in the same place, else the question, else Next | Lab | No | e2e keyboard |
| A13 | Rack wrapped to 4 + 4 + 2 in the three-column desktop layout (found in a real browser during this review) | The "ten" no longer read as two rows of five | Definite representation defect | Medium | lab grid + CSS | Two columns at most; rows wrap only at very large text | Lab CSS | No | e2e at 5 widths + 200% text |
| A14 | Independent check and parent summary | Untouched; neither practice nor the lab feeds them | No defect found | — | `src/server`, `/assessment`, `/demo-progress` | Keep | None | — | Existing isolation suites |

### 6C.3 The redesigned draft sequence (what the learner does)

Every number the learner gives is checked against the objects on screen at that moment (how many are outside the rack, how many spots are empty, how many are still in the rack), never against a stored answer. Moving an object clears any answer about that picture. Nothing is sent to the server.

| Step (on screen) | Learner action | Representation | Prompt (verbatim) | Feedback (verbatim; draft) |
| --- | --- | --- | --- | --- |
| 1 "Make a ten" | Tap balls into a 2 × 5 rack until it is full (any ten), then choose a number | 13 separate balls in rows of five; rack with ten dashed places | "Coach Bails has 13 balls. Tap balls to put them in the rack. A full rack holds 10. Tap one in the rack to put it back." / "The rack is full. How many balls are outside it?" (0–13); a line under the numbers: "Tap each ball outside the rack to mark it as you count." | Right: "Yes. 13 is 10 and 3." plus a part-whole picture. Chose 10: "10 is how many are in the rack. How many are outside it?" Chose 13: "13 is all of the balls. How many are outside the rack?" Other: "Not quite. Count the balls outside the rack." |
| 2 "Start with the extras" | Send the 3 balls outside the rack to the nets (the rack is locked and shown paler), then choose a number | Nets titled "At the nets: 3 of 5" with 5 spots: 3 filled, 2 empty | "Coach Bails needs 5 balls at the nets. One way to start: send the balls outside the rack first. Tap each one." / "How many more balls does Coach Bails need?" | Right: "Yes. 5 is 3 and 2." plus picture. Chose 5: "5 is how many Coach Bails needs in all. Some are there already. How many spots are still empty?" Chose 3: "3 are at the nets already. How many spots are still empty?" Other: "Not quite. Count the empty spots at the nets." |
| 3 "Take the rest from the ten" | Tap balls in the rack to fill the empty spots (a third cannot be taken; either can be put back) | Nets show the parts apart: 3 extras, a dashed divider, 2 from the ten | "You found how many more Coach Bails needs. Take that many balls from the rack to fill the empty spots at the nets." (the number is no longer stated; 2.1 said "take 2") | "To go on, fill all 5 spots at the nets." until done |
| 4 "How many are left?" | Optionally tap balls to mark them while counting (no number appears), then choose a number | Rack with 8 balls and 2 empty places | "How many balls are still in the rack?" (0–13); under the numbers: "Tap each ball in the rack to mark it as you count." (the instruction line steps aside while a question is open) | Right: "Yes. 8 balls are still in the rack." then "You made a ten and 3 extras. You took the 3 extras, then 2 more from the ten. 13 take away 5 leaves 8. This is one way to do it. Taking any 5 balls from 13 leaves 8 too." Chose 5: "5 is how many went to the nets. How many are still in the rack?" Chose 13: "13 is how many Coach Bails had at the start. Some went to the nets." Chose 10: "Look again: some spots in the rack are empty now." |
| 5 "Try one on your own" | Send 4 of 11 balls to the nets, then choose a number; no rack, no hints | 11 balls in rows of five; nets with 4 spots | "A new one, with no help. Coach Bails has 11 balls. Send 4 to the nets, then work out how many are left." / "11 balls, 4 at the nets. How many balls are left?" | Right: "Yes, that matches the balls that are left. That is the end of this draft activity." Wrong: "That does not match yet. Look again at the balls that are not at the nets." (no strategy cue) |

After a second wrong number for the same picture (steps 1, 2 and 4 only; never in step 5) the feedback adds "Count them one at a time and tap each ball as you count it." (step 2: "Count the empty spots at the nets one at a time, touching each one."); after a third it adds "A grown-up can count with you, or you can use Back a step." These lines never state a number. Moving any ball starts the count again. They are hypotheses (questions P2).

Controls on every step: **Next step** (blocked, with the reason shown, until the step's action and answer are done), **Back a step**, **Start again**, **Leave the activity**. The step-4 recap states only actions the lab required and recorded; it does not claim the learner chose the strategy freely.

**Step 5 is not evidence.** It is one local try right after guided steps, checked in the browser and never saved. It must not be read as independent or assessment evidence.

### 6C.4 Accessibility accommodations (automated browser checks only)

Every ball is a real button (tap, click, Enter/Space); no dragging. After a move, focus stays with the objects (next ball in the same place, else the question, else Next; the question takes focus the moment it opens). The step heading takes focus on Next/Back and the page scrolls so the heading is at the top. Moves are announced in one polite live region that is hidden from sight ("Ball 4 moved to the rack. The rack is full."; "Ball 12 moved to the nets. 3 of 5 spots at the nets are filled."); it never states a number the learner is still being asked for. A right answer replaces the number choices with "Your answer: n" and focus moves to the confirmation. Marked balls show a ring and a tick, not colour alone; a marked ball reports `aria-pressed`. Balls that cannot be pressed are real disabled buttons and look paler. Motion is decorative and off under reduced motion; nothing depends on it. Checked with Playwright at 320, 390, 768, 1024 and 1440 px and at 200% text. Cross-browser and assistive-technology results for this build are in `docs/ACCESSIBILITY-AUDIT.md` (Learning Experience 2.2 section). **Not done unless stated there:** a real VoiceOver or other screen-reader pass, switch access, physical phones and tablets.

### 6C.5 Instructional hypotheses (all unvalidated)

- H1. Asking "how many are outside the full ten?" after the learner builds the ten makes 13 = 10 + 3 the learner's own observation rather than the app's statement.
- H2. Showing the two parts of the take apart at the nets (3 | 2) makes 5 = 3 + 2 visible without an equation.
- H3. Asking for the remainder, with a silent marking aid instead of a running count, keeps the final reasoning with the learner.
- H4. Number-specific feedback for 5, 10 and 13 helps learners who confuse the part taken, the ten or the whole with the remainder.
- H6. (2.2) Leaving the number to take in step 3 unstated makes the learner use their own step-2 answer and the empty spots, instead of following an instruction.
- H7. (2.2) A counting aid (marking the group being counted) lets a learner who is unsure count carefully without the app giving the number.
- H8. (2.2) After two or three wrong numbers, pointing to careful counting and then to a grown-up is better than repeating the same feedback. Nothing here limits retries.
- H9. (2.2) Showing "3 of 5" in the nets title makes "5 is 3 and 2" visible; it may also make the "how many more" question easy. Pale locked balls and one nudge of the loose balls direct attention; they may also distract.
- H5. One unaided try right after the guided steps shows the adult whether the learner can start a similar problem; it says nothing about learning or retention.

### 6C.6 Likely misconceptions to watch

(a) Answering 5 (the part moved) for what is left. (b) Answering 10 because "make a ten" sounds like the answer. (c) Believing the 3-then-2 order is the only correct way. (d) Reading the dashed divider at the nets as a separate group not counted in the 5. (e) Counting the empty dashed places in the rack as balls. (f) Thinking the unguided try must also use a rack.

### 6C.7 Questions for the educator

The prioritized list to send (P1–P6, including questions about the 2.2 changes) is in `docs/LAB-REVIEW-KIT.md` section 5; this list is the original set.

1. Is the sequence (build ten → name the extras → take the extras → name what is still needed → take from the ten → name the remainder) mathematically sound and appropriate for ages 6–9? For which grade?
2. Should the learner choose *which* first part to take, or is "one way to start" adequate?
3. Is "How many are outside the rack?" the right first question, or should it be "13 is 10 and how many more?"
4. Is a 0–13 choice set right, or should it be smaller, or should the learner build or type the number?
5. Are the number-specific feedback lines for 5, 10 and 13 helpful or too leading?
6. Is the recap after a right answer appropriate, or does it over-explain?
7. Should the unguided try offer a rack? Should it come later (spaced) rather than immediately?
8. Should the lab ever be offered inside the tutor? (Would need a hint-policy change and explicit approval; not done.)
9. Is the part-whole picture ("13 is 10 and 3") familiar at this age, or would a number bond or ten-frame alone be better?
10. Which misconceptions in 6C.6 are real, and which are missing?
11. Reading load: is the text short enough to be read aloud by an adult? Which words would you change ("extras", "rack", "spots")?

### 6C.8 Proposed criteria for accepting or rejecting the design (for the reviewer to amend)

Accept for adult-operated demonstration only if all hold: (1) every quantity and statement on screen is mathematically correct; (2) no screen states a result before the learner gives it; (3) the strategy is presented as one way, not the way; (4) the wording is age-appropriate when read aloud; (5) feedback is not discouraging; (6) the reviewer judges the sequence a reasonable model of make-ten subtraction for the stated grade. Reject or revise if any statement misdescribes what the learner did, if a representation is likely to cause one of the misconceptions above in a way the feedback cannot correct, or if the sequence is developmentally inappropriate. Acceptance for a child pilot is a separate decision and is **not** implied.

### 6C.9 What changed in the software, and what did not (2.1)

Changed: `/cricket/make-ten-lab` only (`src/lib/make-ten-lab.ts`, `src/components/practice/cricket/MakeTenLab.tsx`, the page notice, lab CSS, lab tests). **Not changed:** the mission, server, hint wording and ladder, tutoring policy, evaluator, question banks, independent check, parent summary, session lifecycle, rate limit, and the other four worlds.

### 6C.10 Learning Experience 2.2: what changed, and why (2026-10-18)

Layout and interaction changes to the draft lab only. **Not changed:** the tutor, hints, evaluator, banks, check, summary, sessions, server, rate limit and the other four worlds.

| Change | Reason | Kind |
| --- | --- | --- |
| The draft notice is two lines with the rest under "More about this draft" | On a 320 px phone it filled the first screen | Layout |
| The visible status card is gone; moves go to a hidden live region and counts sit in the panel titles ("At the nets: 3 of 5") | In step 4 the card was empty; elsewhere it repeated what the objects show | Defect fix |
| While a question is open the board (objects) is pinned above it when it leaves room for the question | At 320×568 and 390×664 the question pushed the rack out of view | Layout |
| The panel "Outside the rack" disappears on phones when it is empty | It only pushed the rest down | Layout |
| Objects are 44 px on phones (48 px before); at 320 px the nets show "3 \| 2" on one row, as two groups that wrap as units | A full row of five plus the divider did not fit | Layout |
| The page now wears the Cricket palette | Without it the empty nets spots had no border and moved balls no ring (a defect in 2.1) | Defect fix |
| Step 3 does not state the number to take | The learner already found it in step 2; the spots show it | Interaction (hypothesis H6) |
| Counting marks work on the group being counted (outside the full ten; the rack in step 4); never in step 5 | Counting aid without giving a number | Interaction (H7) |
| Support after the second and third wrong number | Mistake handling | Interaction (H8, question P2) |
| Locked balls are paler; the loose balls nudge once when the ten is full | Show what can be pressed; draw the eye to the extras | Interaction (H9) |
| One travel system for every change (tap, undo, Next, Back, Start again); it always continues from where an object looks to be | Make each change visible; survive rapid taps | Animation (visual only) |
| Rapid taps build on each other instead of undoing | Real defect found by the new stress test | Defect fix |
| A step restored by Back keeps focus on its heading | Real defect found by the e2e suite | Defect fix |

**Decision map.** The learner's decisions, with what each shows and whether guessing can pass them, are tabulated in `docs/LAB-REVIEW-KIT.md` section 4. Summary: steps 1–2 make the learner decide two numbers from pictures they built; step 3 turns the step-2 answer into an action; step 4 asks for the remainder; step 5 is the same task with no help. Guessing a number can eventually succeed in every step because retries are unlimited; that is a question for the educator, not a software decision.

## 7. How to run it yourself (adult, synthetic data only)

`npm ci && npm run build && npm start -- --port 3000`, then open `/block-builder`: tap blocks 1–5, answer 9 four times to see every step above, then accept the warm-up (tap 6 blocks, answer 4), re-place 5 blocks and answer 8. The independent check is at `/assessment`. See `docs/DEMO-RUNBOOK.md`. **Do not enter real child information; do not observe a real child with this build.**

## 8. Review record (blank — to be completed by a real reviewer, privately)

A reviewer who uses the feedback template in `docs/LAB-REVIEW-KIT.md` (section 6) returns that template; transfer each finding into the table below, anonymised, once the reviewer approves publication. Decisions (accepted / deferred / declined, with the reason) are written in the last column by the founder.

**Public-repository rule:** this repository is public. Reviewer names, contact details, employer, qualifications evidence and private notes must be recorded in a private copy outside the repository. Commit only what the reviewer has explicitly approved for publication, and only in anonymised form.

| Field                                                     | Entry (private copy)                      |
| --------------------------------------------------------- | ----------------------------------------- |
| Reviewer role (e.g. K–3 teacher, elementary math coach)   |                                           |
| Qualifications (credential type, years; evidence private) |                                           |
| Date(s) of review                                         |                                           |
| Build reviewed (commit SHA)                               |                                           |
| Publication consent for anonymised findings (yes/no)      |                                           |

| #   | Finding (quote the screen/step) | Severity (blocker / high / medium / low) | Recommended change | Decision (accepted / deferred / declined + reason) | Follow-up review needed? |
| --- | ------------------------------- | ---------------------------------------- | ------------------ | -------------------------------------------------- | ------------------------ |
|     |                                 |                                          |                    |                                                    |                          |
|     |                                 |                                          |                    |                                                    |                          |
|     |                                 |                                          |                    |                                                    |                          |

Overall recommendation (private): ☐ approve for adult-operated synthetic demo wording ☐ approve with changes ☐ do not approve. Child-pilot content approval is a separate decision and is **not** implied by any of the above.

_No reviewer has been identified, contacted or recorded. Educator approval remains an open real-world gate (see `docs/MVP-READINESS.md`)._
