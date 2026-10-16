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

## 7. How to run it yourself (adult, synthetic data only)

`npm ci && npm run build && npm start -- --port 3000`, then open `/block-builder`: tap blocks 1–5, answer 9 four times to see every step above, then accept the warm-up (tap 6 blocks, answer 4), re-place 5 blocks and answer 8. The independent check is at `/assessment`. See `docs/DEMO-RUNBOOK.md`. **Do not enter real child information; do not observe a real child with this build.**

## 8. Review record (blank — to be completed by a real reviewer, privately)

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
