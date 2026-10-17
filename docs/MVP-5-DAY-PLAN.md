# Primer: five-day MVP plan (Oct 17-21, 2026)

Status: planning document. Source of truth for sprint scope. Work items live in GitHub issues (https://github.com/imjarvissingh/Primer/issues, milestones "Day 1" to "Day 5"). Dates are targets, not promises.

## Target
A visually appealing, **functional, adult-operated** demo: Parent Welcome -> Interest Selection -> playable themed math mission -> guided support -> independent check -> synthetic parent snapshot -> replay or change interest. Synthetic data only. Not a validated or child-cleared product.

## Definition of an actually working feature
Its controls work, state is correct and server-authoritative, navigation in and out works, errors and expiry are handled, automated tests cover it, it works at 320-1440 px with keyboard and reduced motion, and it was exercised in the running app. Anything else is labelled "preview" or "not playable yet" in the UI.

## Scope
P0: connected navigation (#1, #2), reliable tests (#3), session lifecycle (#5), shared theme contract (#6), Cricket (#7), Basketball (#8), Soccer (#9), Surprise-me flow (#11), privacy gates (#23), educator review request (#20, founder), deployment with approval (#26), YC capability record (#27).
P1: prototype evaluation (#4), unify previews (#10), visual identity (#12), animation (#13), teaching items (#16-#19, partly blocked), parent copy and snapshot (#21, #22), accessibility (#24), integrity review (#25), YC recording and validation (#28).
P2: sound (#14), asset optimization (#15).

## Dependency order
Connected navigation -> shared theme contract -> Cricket -> Basketball and Soccer -> Surprise-me and previews -> visual identity -> animation -> accessibility and integrity review -> deployment -> YC materials.

## Daily acceptance
- Day 1 (Oct 17): governance, connected journey for Building and Space, reliable suite. Founder review.
- Day 2 (Oct 18): shared contract, Cricket playable, session lifecycle, prototype decision. **Status:** all five worlds playable on branch `milestone2/five-worlds` (pulled forward from Day 3); prototype decision (#4) and session lifecycle polish (#5) still open.
- Day 3 (Oct 19): Basketball and Soccer playable, visual identity, parent copy.
- Day 4 (Oct 20): animation, accessibility, integrity review, snapshot polish.
- Day 5 (Oct 21): deployment (if approved), smoke tests, recording, YC materials.

## Founder checkpoints
End of each day: run the app, review the PR, approve or redirect. Required approvals: pushing, PRs, merging, deployment, major visual or product decisions, choice among hint options (#16).

## Explicit exclusions
Real children, accounts, persistence, analytics, live child-facing AI, dynamic AI generation, 3D engine, payments, multiplayer, claims of learning gains or mastery.

## Known blockers
Educator review (external; #16, #17, #19, #20, #22 partly). Legal/consent review for any child use. Concept images for the visual direction (never supplied). Hosting choice and approval. Single-instance in-memory sessions limit hosting options.

## Cut rules
Cut in this order: sound, asset optimization, advanced animation, extra polish, then the last themed mission(s). A theme that is not playable stays labelled "not playable yet". Never cut: server-side scoring, assessment separation, accessibility basics, honest labelling, tests of what ships.
