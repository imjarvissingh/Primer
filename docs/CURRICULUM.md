# Primer — Curriculum

S01 Count and represent quantities 0–20.
S02 Compose/decompose numbers including teen numbers.
S03 Model subtraction as taking away.
S04 Use make-ten strategies when crossing ten.
S05 Show independent transfer (assessment goal).

## Broken Bridge
13 blocks, use 5, reason about remainder. Space modules are a contextual alternative.

## Assessment banks
Distinct reviewed baseline, guided practice, new independent posttest and reserved delayed-check items. Never count hints toward independent mastery.

## Tutoring states
Present -> observe -> score -> approved visual cue or model -> remediate prerequisite -> verify independently -> update uncertain evidence. Allow stop and skip. No unsupported diagnosis. Educator review before pilot.

## Phase 2 implementation (2026-10-16)
Versions: `curriculum-2026.10-draft.1` / `content-2026.10-draft.1`. **All content below is DRAFT and unreviewed by a qualified educator.** Nothing here is educator-approved.

### Skill structure
S01–S04 are taught skills. S05 is an **assessment objective** (evidence, not a lesson) and is never a prerequisite of anything.

**Prerequisite edges are implementation assumptions, not stated curriculum facts** — the planning documents define none:
- S02 requires S01; S03 requires S01 (a child counts before composing or subtracting).
- S04 requires S03 then S02. Order matters: S03 is the first easier-practice fallback.
- S05 assesses S03 and S04 (subtraction within 20, including crossing ten). S01 and S02 therefore cannot reach any mastery state.

### Problem types
`count` (S01), `compose` and `decompose` (S02), `subtract-take-away` (S03), `subtract-cross-ten` (S04). All within 0–20; crossing-ten uses a start of 11–18 and a result under ten. Learner responses are a bare whole number 0–20; strings, decimals, negatives and missing values are *invalid*, never scored.

### Draft banks
Baseline 8, guided practice 8 (includes the 13 − 5 Broken Bridge example), immediate independent 4 (S03 ×2, S04 ×2), delayed 4 (S03 ×2, S04 ×2). Validation rejects any exact item reused across banks; items sharing a number fact (for example 12 − 7 and 12 − 5) produce a *warning* for educator judgement. The shipped banks have none.

### Hints
Hints are controlled ids (`hint.make-ten.fill-to-ten`, …) in two-step ladders per skill. They exist only in guided practice. The content behind each id is not yet written or reviewed.

### Unresolved: mastery thresholds
The documents do not say how many correct answers, or what delay, confirm mastery. The shipped policy is `draft-unapproved` and carries no numbers, so it **cannot** return `provisional-mastery` or `confirmed-after-delay`. An educator must supply: minimum correct and maximum incorrect independent items, minimum correct and maximum incorrect delayed items, and the minimum delay in days. The engine rejects any approved policy that accepts fewer than 2 independent items or has no delay.

### Other open educator questions
Whether baseline-only correctness should ever lift a skill above "emerging"; how many practice attempts and hints are appropriate for ages 6–9; whether the fallback and stop thresholds (5 wrong tries) are right; whether independent/delayed banks should also cover S01–S02.

## Independent check status (Phase 5, 2026-10-16)
The check uses the four **draft, educator-unreviewed** items of the independent bank (16 − 5, 19 − 7, 14 − 6, 17 − 9; S03 x2, S04 x2) in that fixed order. It measures only whether a learner answered those four unseen subtraction items correctly on one occasion with no hints. It does not measure S01 or S02, retention (the delayed bank is not used), transfer beyond these items, or mastery: no thresholds are approved, so none is awarded. Open for the educator: whether four items suffice, whether the order or item mix is right, and whether skipped items should be followed up.

## Phase 8C: make-ten progression and warm-up (DRAFT, pending external educator review)

Progression for 13 − 5 (provisional): wrong 1 neutral note → hint 1: 13 as a full ten plus 3 extra, extras marked "take first" (part-whole plus first removal) → hint 2: extras gone, the remaining 2 marked inside the ten (13 − 3 = 10, then 10 − 2) → one-time warm-up (10 − 6, take-away). The pictures never show the final count.

### Review checklist for a qualified elementary mathematics educator — STATUS: PENDING, not educator-approved
1. Is the 13 − 5 make-ten progression appropriate?
2. Is the two-row, five-column ten-frame conventional and understandable? Is ✕ / dashed circle clear to 6–9-year-olds?
3. Are the removal stages sequenced correctly? Should the learner act on each stage?
4. Does the hint ladder reveal too much too soon (hint 1 already names "take 3 first")?
5. Is a take-away warm-up (S03) the right prerequisite, or should it be part-whole (S02)?
6. Is the wording age-appropriate and non-pressuring?
7. Is the return to the mission constructive?
8. Do both themes carry the same meaning?
9. Could the pictures cause subtraction misconceptions (e.g. extras shown in a separate frame)?
10. Are other accessibility alternatives needed (physical manipulatives, audio)?

Hint copy audit: hint 1 and hint 2 text is mathematically correct and was kept unchanged. Added draft text for the two S03 hint ids used in the warm-up. Neutral and fallback wording unchanged.
