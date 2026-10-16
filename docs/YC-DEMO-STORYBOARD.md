# Primer — YC Product Demo Storyboard

Target length **75–90 s**, narrated, screen recording only. This is the **product demo**, a separate field from the 1-minute founder video ([YC-FOUNDER-VIDEO.md](YC-FOUNDER-VIDEO.md)). The portal's demo field limits were not visible without login: check them before recording.

Setup, recovery and expected behavior come from [DEMO-RUNBOOK.md](DEMO-RUNBOOK.md). Use a fresh production server (`npm run build && npm start`). Everything shown is normal product behavior with the real evaluator; do not edit scores, add overrides or fake outcomes.

**Disclosure to show on screen and say:** "All data is synthetic demo data. No children have used this, and the content is an unreviewed draft."

## Storyboard

| Time | Screen | Narration (edit to your voice) | Interaction | Evidence shown |
| ---- | ------ | ------------------------------ | ----------- | -------------- |
| 0:00–0:10 | `/` home | "Young kids lose interest in generic math practice, and a parent can't tell whether a right answer was the child's or came from a hint. Primer is our attempt at both." | Scroll slowly past the two world cards and the independent-check card | "Draft demo … not reviewed by an educator" footer visible. *The problem sentence is a hypothesis; say "we believe" if you have no interview data* |
| 0:10–0:30 | `/block-builder` | "A child picks an interest. Here they're fixing a bridge. Thirteen blocks, five go on the bridge, how many are left? They actually move the blocks." | Start building; tap 5 blocks; pick 9 | Counter "Blocks on the bridge: 5"; calm "Not quite yet" message (no points, timer or streak) |
| 0:30–0:42 | same | "If they're stuck, hints are controlled by the server's tutoring policy, not written on the fly." | Pick another wrong answer to reach a hint; then 8 | Hint with "Draft demo hint, not yet reviewed" note; "The bridge is fixed!" with "practice with help, not a test" |
| 0:42–0:52 | `/space-construction` (via the outcome link) | "Same math, same engine, different world. Only the words and look change; the server can't even tell which theme it is." | Start; build 5; answer 8 | Visibly different palette/shape; same layout |
| 0:52–1:07 | `/assessment` | "Guided practice isn't proof of understanding, so there's a separate check: no hints, no timer, and no right-or-wrong feedback. Answers go to the server, which scores them." | Start; answer the four questions (11, 12, 8, 8) | "Your answer is saved." after each; identical for right/wrong |
| 1:07–1:25 | `/demo-progress?session=…` | "A grown-up sees only what was answered independently: four of four in this short check. Mastery: not awarded, because no educator has approved mastery rules. This is synthetic data, not a real child." | Open "Summary for a grown-up (demo)"; scroll counts, table, mastery, provenance | Counts 4/4/4/0/0; "Mastery: not awarded"; "Synthetic demonstration data" |
| 1:25–1:30 (optional) | Title card | "That's the product today: a working demo, no users yet. Next we're talking to parents and an educator." | — | Only include the "next steps" if they're true when you record |

Transitions: cut or fade between routes; keep the browser address bar out of frame or crop it at the summary scene (it holds the session id).

## Do not

- Say or show "proven learning improvement", mastery achieved, engagement results, traction, user feedback or educator approval.
- Publish footage where the `session=` value is readable. Crop or blur it; it is the only access control for that summary. Never commit it or paste it into the application text.
- Present the summary as a real child's. Say "synthetic" on camera.
- Speed up or trim the child interaction so it appears faster than it is. Edit around waiting, not the feedback.
- Bypass the evaluator, pre-fill answers through the API, or use another session's summary.

## Risks and backup

| Risk | Mitigation |
| ---- | ---------- |
| Server restarts or session expires (30 min idle) → "no longer available" | Restart server right before; record scenes in one sitting; if it happens, press Start and redo (runbook has the recovery table) |
| Hint doesn't appear as expected | Hint timing is policy-driven; do another wrong answer. If it still doesn't show, re-record the scene rather than skipping the hint statement |
| Wrong block count or accidental extra tap | "Put all blocks back" button, or Start over |
| Mobile footage layout | Tested at 360, 768, 1440 widths in `demo-journey.spec.ts`; record desktop primary, optional phone insert |
| Audio/timing over 90 s | Cut the optional last card first, then shorten scene 4 narration |
| Backup | Record each scene as a separate clip; a full re-record takes about 3 minutes of product time using the same routes |

## Pre-record checklist

- [ ] On `main` at the latest verified commit; `npm run validate` green (or at least `npm test`) if code changed since `3537e91`
- [ ] Fresh server, fresh tab, notifications off, no personal tabs/bookmarks visible
- [ ] Narration on bullet points, not read from a script
- [ ] Final footage reviewed frame by frame for the session id
