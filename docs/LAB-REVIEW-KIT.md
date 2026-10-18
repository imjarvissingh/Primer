# Make-ten lab — educator review kit

**Status: DRAFT for a qualified K–3 mathematics educator. Nothing here has been reviewed or endorsed.** No educator has been identified, contacted or recorded. The founder decides who is asked and when. This file is a ready-to-send package; it is not a finding.

You can review the activity from this file and the screenshots alone. You do not need the source code or the rest of the repository. The longer reference (audit of the existing lesson, accessibility notes, accept/reject criteria) is `docs/EDUCATOR-REVIEW-PACKET.md`, section 6C. Where reviewers' findings are recorded is section 8 of that file.

## 1. Message the founder can send (edit freely)

> Subject: 30 minutes of your expertise on a draft subtraction activity for ages 6–9
>
> Hello [name],
>
> I am building Primer, an early-stage math adventure for US children aged 6–9. I would value a qualified K–3 educator's judgment on one short draft activity before any child sees it. It teaches 13 − 5 by making a ten: put ten balls in a rack, take the three extras, then two more from the ten, and say how many are left. A last step tries 11 − 4 with no help.
>
> I am not asking you to endorse a product. I am asking whether the sequence, wording and feedback are sound for the age group, and what you would change. Everything is a proposal; an AI helped draft the strategy and no educator has reviewed it. It is a demo for adults to run: it uses no real child data, saves nothing and scores nothing.
>
> What you would need: about 30 minutes, a laptop or phone, and the one-page guide and screenshots attached (no installation). A short call or written notes are both fine. I can record your feedback anonymously or by name, as you prefer, and I will not publish anything you have not approved.
>
> Thank you for considering it.
> [founder name, contact]

Before sending: attach this file, the screenshots in `docs/cricket-lab-screens/` (`m390-*.png`), and a link to a running preview if the founder hosts one. Do not send credentials or repository access.

## 2. What the activity is, in one paragraph

A grown-up runs it with a child, or a reviewer runs it alone. Coach Bails has 13 cricket balls. (1) The learner taps balls into a rack that holds ten, then says how many balls are outside it. (2) The learner sends those balls to the nets (which have five spots) and says how many more are needed. (3) The learner takes that many from the rack. (4) The learner says how many balls are still in the rack. (5) A new problem, 11 − 4, with no rack, no strategy words and no counting aid (a wrong answer only points back at the objects). Every number the learner gives is checked only against the objects and empty spots on the screen at that moment (never against a stored answer); the screen never states a result first. Details of each step are in section 4.

**Not in scope of your review:** the scored practice, the hints in the tutor, the independent check and the parent summary. They exist separately and are unchanged. Two open questions about them are in the packet (sections 3 and 4).

## 3. Demonstration route (about 10 minutes)

Run at `/cricket/make-ten-lab` (adults only). Try each step once as a learner would, then once with a deliberate mistake.

| # | Do this | Look for | Screenshot |
| --- | --- | --- | --- |
| 1 | Open the page. Read the instruction. | Is the first action obvious? Is the draft notice clear? | `m390-1a-start` |
| 2 | Tap five balls into the rack, then five more. | The rack is two rows of five. The balls outside are a separate group. | `m390-1b-five-in-rack`, `m390-1c-ten-question` |
| 3 | Choose **10**, then Check. | Does the feedback help or give too much? | `m390-1d-feedback-ten` |
| 4 | Tap one ball outside the rack. | It gets a ring and a tick: a counting aid. No number appears. | `m390-1d2-marked-outside` |
| 5 | Choose **3**, then Check. Press **Next step**. | The part-whole picture "13 is 10 and 3". | `m390-1e-right` |
| 6 | Tap the three loose balls to the nets. | The nets show "3 of 5" and two empty spots. The rack is locked and looks paler. | `m390-2a-nets-arrive`, `m390-2b-extras-sent-question` |
| 7 | Choose **5**, then **2**. | Feedback for 5; the picture "5 is 3 and 2". | `m390-2c-feedback-five`, `m390-2d-right` |
| 8 | Next. Take balls from the rack to fill the empty spots. | The instruction does not say how many; the empty spots show it. | `m390-3a-take-from-ten`, `m390-3c-three-and-two` |
| 9 | Next. Tap rack balls to mark them. Choose **5**, then **8**. | The nets keep "3 | 2" apart from the rack. The recap appears only after 8. | `m390-4a-question` … `m390-4d-recap` |
| 10 | Next. Send four balls, choose **4**, then **7**. | No rack, no strategy words, no counting aid. A wrong number gets "look again at the balls that are not at the nets". | `m390-5a-unguided-start` … `m390-5d-unguided-right` |
| 11 | Press **Back a step** (it appears once you have moved past step 1) and **Start again** (always there). | Nothing is lost or left over. | — |

Wrong-answer support: answer the same question wrongly three times. The wording after the second and third wrong tries (counting slowly; a grown-up can count with you) is a hypothesis for you to judge (question P2).

## 4. The learner's decisions

| Step | What the learner decides | Could random tapping pass? | What changes on screen after the decision | What the feedback reveals |
| --- | --- | --- | --- | --- |
| 1 | Which ten balls go in the rack (any ten). Then: how many are outside (0–13). | The ten, yes (any taps will fill it, up to ten); this step asks little. The number: a guess has 1 chance in 14, but wrong numbers can be retried, so guessing eventually works. | Part-whole picture "13 is 10 and 3" after a right number. | Right: "13 is 10 and 3". Wrong 10 or 13: says what that number counts. Other: "count the balls outside". |
| 2 | Send the loose balls to the nets (the rack is locked). Then: how many more are needed (0–13). | The moves are forced (only loose balls move). The number can be guessed as above. | Nets show filled and empty spots; picture "5 is 3 and 2". | Header "At the nets: 3 of 5" is visible before the question, so subtraction 5 − 3 is available without counting. This is a question for you (P4). |
| 3 | How many balls to take from the rack. The number is not given; the nets show the empty spots. | Tapping any two rack balls fills the spots. A third cannot be taken. | Two balls move; the nets separate "3 | 2". | Nothing until Next. |
| 4 | How many are still in the rack (0–13). Optionally mark balls while counting. | Guessable, as above. | Recap only after a right answer. | Wrong 5: "how many went to the nets". Wrong 13: "how many at the start". Wrong 10: "some spots are empty". |
| 5 | Which four balls to send; how many are left (0–11). | Guessable. | None beyond the picture. | Right: "matches the balls that are left". Wrong: "look again at the balls not at the nets" (it points back at the objects; there is no strategy cue, counting aid or extra support in this step). |

Whether the lack of a limit on retries is acceptable is question P2.

## 5. Questions in priority order

Please answer in any form. "I don't know / outside my expertise" is a useful answer.

**P1 — soundness (blocking).**
1. Is the sequence build a ten → name the extras → take the extras → name what is still needed → take from the ten → name what is left mathematically sound for ages 6–9? Which grade, and which prior skills must be secure first (count to 13; teen number as ten and ones; 5 as 3 and 2)?
2. Is moving objects into the nets a coherent representation of subtraction, or does "adding to the nets" risk the child reading it as addition (the nets are being filled)?
3. Does any statement on screen misdescribe what the learner did, or any picture mislead?

**P2 — feedback and mistakes.**
4. Does the feedback reveal too much, or too little? In particular the number-specific lines for 5, 10 and 13.
5. After repeated wrong answers the lab suggests counting one at a time, then suggests a grown-up. What should happen after several wrong answers (more scaffolding, a worked model, stop and rest, return to an earlier step)?
6. Is it acceptable that a learner can retry numbers without limit?
7. When, if at all, should a strategy explanation be offered, and by whom?

**P3 — design of the scaffolding.**
8. Should the learner decide how to split five (3 then 2, or 2 then 3, or any), or should the lesson guide the split as it does now ("one way to start")?
9. Step 3 no longer says how many to take. Is that a reasonable level of independence, or too hard?
10. The nets show "3 of 5" before the learner is asked how many more. Helpful or giving the answer away?
11. Is filling a ten-rack an appropriate way to introduce the strategy, and is it appropriate for a learner who does not already understand grouping in tens?
12. Locked balls look paler and the three balls outside the full ten nudge once. Helpful, distracting, or confusing?

**P4 — assessment and transfer.**
13. Is 11 − 4 a suitable transfer question? Should it come right after the guided steps, or later?
14. Should the unguided try offer a rack or a counting aid?
15. Are the answer ranges (0–13 and 0–11) appropriate, or should they be smaller or entered another way?

**P5 — wording and age fit.**
16. Is the reading load right when an adult reads it aloud? Which words would you change ("extras", "rack", "spots", "nets")?
17. Does the amount of scaffolding match the intended age range?

**P6 — future use.**
18. Under what conditions, if any, could this ever become part of the tutoring flow? (It is not today, and would need a separate decision.)
19. Which common misconceptions are missing from the list in packet 6C.6?

## 6. Feedback template (copy, fill in, return)

```
Reviewer role (e.g. K–3 teacher, math coach): 
Years of K–3 experience (optional): 
Grade(s) you judge this suitable for: 
Date: 
Build reviewed (commit shown by the sender): 
OK for anonymised findings to be published? yes / no

For each issue:
Step / screen:            (quote the words or give the screenshot name)
What I saw or read:
Why it matters for a 6–9-year-old:
Severity: blocker / high / medium / low
What I would change:
Is this mathematical, pedagogical, wording, or accessibility?

Overall (circle one): approve for adult-run demo wording / approve with changes / do not approve
(Approval for use with children is a separate decision and is not being asked.)

Answers to P1–P6 (any form):
```

## 7. How a decision is made

A change to wording, feedback or sequence is accepted, deferred or declined after your findings, and the result is written next to the finding in the packet (section 8). A change to the tutor itself (hints, progression, assessment) is never made from this review alone and needs its own explicit decision. Accept, revise and reject criteria proposed for you to amend: packet 6C.8.

## 8. Privacy and honesty

The page has no application data requests (nothing is sent, saved or scored), but it is a normal web page and is not access-gated: it relies on its wording and a no-index tag. It is for adult-operated demonstration only and must not be put in front of children, or deployed for them, without a separate decision.

The repository is public. Reviewer names, contact details and notes are kept in a private copy; only findings the reviewer approves, anonymised, are committed. The review gate (educator approval) stays open until a real reviewer's findings are recorded.
