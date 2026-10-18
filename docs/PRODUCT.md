# Primer — MVP Product Requirements

## Value proposition
Turn a child’s interest into a learning adventure, measuring understanding rather than engagement alone.

## Users
Child 6–9 (specific initial early arithmetic needs), parent/guardian account holder, qualified educator reviewer.

## Themes
Block Builder: bridge, building blocks, builder guide.
Space Construction: station, space modules, space guide.
Shared mathematical semantics and evaluator.

## First scope
Subtraction within 20, baseline, structured manipulatives, reviewed hints, independent assessment, evidence-based parent dashboard, privacy/consent.

## Screens
Landing; parent registration and consent; child profile; theme selection; baseline; mission intro; construction; hints; independent check; completion; parent dashboard; privacy settings.

## Not in MVP
Live open-ended AI chat, voice, third-party characters, 3D worlds, multiplayer, payments, many subjects.

## Current MVP journey and boundaries (2026-10-17)
Target journey: Parent Welcome -> Interest Selection -> playable themed mission -> guided support -> independent check -> synthetic parent snapshot -> replay or change interest.

**Works today (draft, adult-operated, synthetic; see Milestone 2 below, all five interests now play):** home -> welcome -> choose an interest -> real server-backed 13 - 5 mission with hints -> separate independent check -> adult summary -> back to home or interest choice.
**(Superseded by Milestone 2 below) Preview only:** Cricket, Basketball, Soccer were previews at Milestone 1. "Surprise me" can land on one of these and then offers Building or Space.
**Personalization is:** five authored interests, chosen voluntarily, changeable, no free text, no account, no profile, no dynamic generation. It is not algorithmic personalization.
Sprint scope and exclusions: [MVP-5-DAY-PLAN.md](MVP-5-DAY-PLAN.md).

## Milestone 2 status (2026-10-17)
All five interests (Cricket, Building, Space, Basketball, Soccer) start a real, server-scored 13 - 5 mission from the welcome flow, with hints, replay ("Start over"), interest switching and the existing independent check and synthetic summary. There is no "not playable yet" state. Art is a modest original SVG baseline; premium art and animation are later milestones. Still unvalidated: everything pedagogical (educator review pending), all child-facing claims.

## Milestone 3 status (2026-10-17)
In all five worlds the thirteen objects are drawn, separate and countable in a themed container; five move to the destination as the same objects; the guide reacts to real events; the finished world stays on screen. The welcome page has a five-point "How Primer works" for parents (what is chosen, what stays the same, guided versus independent, cautious summary). Verified in real Chrome, Firefox and WebKit (geometry only) and by automated tests; not tested with screen readers, real devices or children. Art is better but still flat SVG; premium art is a separate dependency.

## Milestone 4 status (2026-10-17)
The five worlds are layered illustrated scenes (about a third of a phone screen), the guide characters have more identity, pressed objects fly to their place, the finished world celebrates a confirmed right answer, the welcome cards preview the real scenes, and the adult summary opens with a plain-language lead and a practice-versus-check comparison. The art is hand-authored vector, not commissioned or generated illustration; it is a better baseline, not a premium finish.

## Cricket vertical slice status (2026-10-17, issue #38)
Cricket Academy (`/cricket`) now opens with a short animated story (skippable, pausable, replayable, captioned, no audio), shows start / sent / left as separate quantities, lets the learner regroup the basket into a rack of ten and extras, draws the five places to fill, and ends with a finale showing the learner's own balls and what really remains (after a server-confirmed correct answer only). A separate adult-operated draft, `/cricket/make-ten-lab`, walks through one make-ten sequence. Scoring, hints and the independent check are unchanged. Educator-unreviewed; not tested with children or assistive technology. The other four worlds are unchanged and were deliberately not upgraded.

## Learning Experience 2.1 status (2026-10-18)
The draft `/cricket/make-ten-lab` is now a five-step activity in which the learner builds a ten, says how many are outside it, takes those, says how many more are needed, takes them from the ten, says how many are left, and then tries 11 − 4 without help. It is adult-operated, client-only and labelled as unreviewed; it scores, saves and reports nothing. The production mission, tutor, check and summary are unchanged. No claim of learning benefit is made; see educator packet §6C.

## Learning Experience 2.2 status (2026-10-18)
The draft make-ten lab now reads cleanly on a 320–390 px phone (objects stay in view while a number is chosen, no empty status card), has a counting aid and wrong-answer support for educators to judge, and animates every change of place. It remains an adult-operated, client-only draft: scores, saves and reports nothing, and no educator has validated it. A review kit and an adult usability protocol are ready; no sessions or reviews have happened.
