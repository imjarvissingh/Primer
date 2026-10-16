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
