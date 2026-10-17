# Milestone 3 audit: current app in a real browser (2026-10-17)

Audit of `main` at `8a9b51f` (Milestone 2), before any Milestone 3 change. Method and limits are stated per finding. Nothing here is a claim of educator approval or pitch-readiness.

## How the audit was done (and what it was not)
- **Claude in Chrome (real Chrome, extension connected):** navigated, clicked, typed, scrolled, screenshotted. It played the full Cricket journey (start, move five, answer wrongly, neutral feedback, Hint 1, answer 8, finish) and viewed Building and Space after moving five. Its viewport stayed 714 x 756 even after a window-resize request, so it could not provide true 1024 or 1440 widths.
- **Playwright (Chromium, Firefox 157, WebKit):** widths 320, 390, 768, 1024, 1440, measured geometry for all five worlds. Chromium was measured at all five widths; Firefox and WebKit at 390 and 1440 only. Keyboard, 200% text and reduced motion are covered by the existing automated suites, not by a manual pass.
- **Not done:** no screen reader, no physical device, no real Safari or Firefox desktop session, no children or educators.
- **Retracted finding:** an early measurement showed 34-36 px touch targets. That was an artifact of measuring during the placement animation. Settled sizes are 48 px (52 px at wider widths) for objects and 56 px for answers.

## Mathematics and server authority (verified)
- 13 starting objects, 5 moved, 8 remaining: consistent in all five worlds (the tray holds 13 buttons; five move; eight stay).
- Scoring is server-side: the browser sends only the learner's number; the theme is never sent.
- Hint wording does not claim what the learner did ("a picture of the idea, not what you moved").
- No P0 defect found.

## Findings
| # | Sev | Finding | Evidence | Cause | Fix status |
|---|-----|---------|----------|-------|------------|
| 1 | P1 | The remaining objects were not visible in the scene. Cricket, Basketball and Soccer drew a solid basket/rack/bag; Building and Space drew no supply at all. The countable things were generic numbered chips in a separate panel. | Chrome screenshots of /cricket, /block-builder, /space-construction | M2 hid the scene's objects to avoid showing the answer, which also hid the set a child should count | Fixed in M3 (issues #12, #18) |
| 2 | P1 | Objects were numbered 1 to 13: a worksheet number line, not physical objects; the last label reads "13". | Chrome | Numerals on chips | Fixed: drawn objects, no numerals (accessible names keep numbers) |
| 3 | P1 | Moved objects looked different from remaining ones (striped yellow discs vs pink chips), so "the same objects moved" was not visible. | Chrome (Cricket) | Separate styles for supply and built | Fixed: same drawing, ringed and ticked |
| 4 | P1 | The scene was a small strip: 14% of viewport height at 390 px, 27% at 1440 px; the page reads as a form with a picture. | Playwright geometry, 5 worlds | Layout | Partly fixed: stage card with guide strip, wider page. Scene is still not dominant on phones. Open |
| 5 | P1 | Guide characters: one recolored human figure for three sports, static; no reactions. | Chrome | No guide system | Fixed: five guides, four event-driven moods, fixed authored lines |
| 6 | P1 | The finish screen dropped the world: a text card with a check icon. | Chrome | Outcome screen replaced the stage | Fixed: finished world and guide reaction stay on screen |
| 7 | P2 | Hint 1 is about 45 words plus a diagram; the outlined objects are far up the page on phones. | Chrome | Draft wording, layout | Open: wording needs educator review (#16, #17) |
| 8 | P2 | The 0-20 answer picker has 21 targets for ages 6-9. | Chrome | Design | Open: educator question (#17) |
| 9 | P2 | Parent explanation of what Primer does was thin. | Welcome page | Copy | Fixed: five-point "How Primer works" (#21) |
| 10 | P2 | Art is flat SVG; not premium. | All | Tooling | Open: needs an art pipeline (#12) |
| 11 | P2 | Several e2e helpers force-check a 1 px hidden radio (fragile after long hints). | CI run 39006989047 | Test design | Open (#24) |

## Not found
No horizontal overflow at 320 to 1440 px in Chromium, Firefox or WebKit; no function dead ends in the Chrome walk-through.
