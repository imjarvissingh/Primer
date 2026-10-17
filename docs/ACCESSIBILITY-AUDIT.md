# Primer — Accessibility Audit (Phase 8D)

**Date:** 2026-10-16. **Audited code:** commit `78575b5` (Phase 8C); defects below were fixed in the Phase 8D commit that adds this file. **This is a developer audit with automated and scripted checks. It is not a WCAG conformance claim, not an accessibility certification, and not a substitute for testing with disabled users and real assistive technology.**

## 1. Method and tools

| Item | Detail |
| --- | --- |
| Browser | Chromium (Playwright 1.64 bundled build), headless, macOS. **No other browser was used.** |
| Server | Production build (`next build` + `next start`) on a free local port. |
| Automated rules | axe-core 4.10.2 (installed in a scratch directory outside the repository for this audit only; **not** added to `package.json`), rule tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`. |
| Scripted checks | Own Playwright scripts (kept out of the repository): horizontal overflow, interactive target size, rendered font size, text-colour contrast against the resolved background (alpha-aware; ignores gradients/images), heading outline, document titles, console errors, keyboard-only journey, focus location after each transition, forced-colors emulation, text-spacing override, accessibility-tree dump (`ariaSnapshot`). |
| Viewports (CSS px) | 320×640, 390×844, 768×1024, 1440×900; plus ad-hoc 640, 700, 735, 740, 760 and 1280 (with 200% root font) for the zoom findings. |
| Colour schemes | Light (all viewports); dark (320 and 390). |
| States covered per viewport | Home; each world's introduction, empty construction, 5 blocks placed, wrong answer 1, Hint 1, Hint 2, warm-up offer, warm-up activity, back at the mission, outcome; independent check intro, question 1, done; adult summary with a real completed check; summary with no session; summary with an unknown session; mission with an expired (404) session. Roughly 100+ page-states in total (first sweep: 104 states, 4 viewports × 26). |
| **Screen readers** | **NOT TESTED.** No VoiceOver, NVDA, JAWS or TalkBack session was run. The accessibility-tree dump shows what browsers expose; it is **not** manual screen-reader verification. |

## 2. Results summary

- **axe-core: 0 violations** in every audited state (light and dark), both after and before the fixes below. Automated rules find only a fraction of real problems.
- **Contrast:** 0 text-contrast failures by my own computation in every audited state; token pairs in section 4.
- **Four demonstrated defects fixed** and a fifth (summary reflow) fixed after a later sweep (A11Y-01…05). **Open items** are listed in section 5.

## 3. Checks and outcomes

| Area | Result | Evidence / note |
| --- | --- | --- |
| Keyboard operation | **Pass** (Chromium) | Skip link is first Tab stop; blocks toggle with Space and Enter; answer radios move with arrow keys (0→9 by 9 presses); Tab leaves the radio group to "Check my answer"; Enter submits. |
| Tab order | **Pass** | Heading → blocks in numeric order → built blocks → "Put all back" → answers → Check → feedback controls → Stop → Start over. |
| Focus indicator | **Pass** | 3 px solid outline, 2 px offset, on links, buttons, headings (programmatic focus) and the radio chips. Indicator colours measured ≥ 5.7:1 on each panel. |
| Focus after question/screen change | **Pass after fix** | Offer, warm-up, back-to-mission, outcome and assessment questions move focus to the new heading. **Failure A11Y-03 (fixed):** after pressing **Start** the focus fell to `<body>`; after **Start over** likewise. |
| Focus after wrong answer / hint | Intentional | Focus stays on "Check my answer"; new content is announced through `role="status"` (polite). Real announcement behaviour untested (no screen reader). |
| Semantic headings | **Pass** | One `h1` per page; `h2` per screen state; `h3` for pile/bridge. No skipped levels. Titles are unique per route. |
| Control labelling | **Pass after fix** | Blocks have full names ("Block 6, in the pile. Press to put it on the bridge."). **A11Y-04 (fixed):** "outlined" hint cue was visual only. |
| Instructions | Pass (inspection) | Goal, story and "Tap 5 blocks…" are text. |
| Error/feedback announcement | Partial | Feedback, readiness and errors sit in `role="status"` regions. Expired-session state audited (axe clean). Not verified with a real screen reader. |
| Ten-frame text alternative | Pass (inspection) | `role="img"` with an `aria-label` describing the frames and stage (never the answer) plus a `figcaption`. Describes counts, not the arrangement cell-by-cell. |
| SVG scenes | Pass (inspection) | Scene art is decorative; state is also in text ("Blocks on the bridge: 5 (goal: 5)"). |
| Touch targets | **Pass with advisories** | Buttons, blocks (48–52 px, settled; mid-animation snapshots read 34–44 px) and answer chips (56 px) are ≥ 44×44 CSS px at every viewport. Text links are smaller: header "Back to Primer home" 24 px high, home-page world links 42 px, in-sentence links 18 px, standalone summary links 18 px (A11Y-06). |
| Mobile text readability | Pass with advisory | Body text ≥ 16 px; smallest HTML text 14 px. SVG ten-frame labels ("Ten"/"Extra") render at 11 px at 320 px (A11Y-05). |
| Zoom / reflow | **Pass after fixes** | 320 px (= 400% zoom on a 1280 px screen) and 640–720 px (= 200% zoom) failed before the fixes (A11Y-01/02). Text-only 200% (root font ×2 at 1280 px) showed no overflow or clipping. |
| Text spacing (1.4.12 override: line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em) | **Pass** | No horizontal overflow, no clipped overflow-hidden containers on the mission screen with Hint 1–2 visible (390 px). |
| Colour contrast | **Pass** | Section 4. Dark mode also swept. |
| Reduced motion | Pass (existing tests only) | Existing Playwright tests assert the entrance, placement and slot animations are removed under `prefers-reduced-motion: reduce`. My own ad-hoc probe of this was not completed in this audit. |
| Forced colors (emulated) | **Pass with advisory** | `forced-colors: active` at 390 px: no overflow, all text and controls visible; hint cue outline and ten-frame shapes survive. The decorative progress pips lose their fill (A11Y-08). Real Windows High Contrast not tested. |
| Console errors | Pass | The only console message is the browser's own log of the expected 404 from the summary API for an unknown session. |

## 4. Contrast calculations (WCAG relative-luminance formula)

Thresholds: 4.5:1 normal text, 3:1 large text and essential non-text indicators.

| Pair | Ratio |
| --- | --- |
| Light: text `#1b2540` on `#fffaf0` | 14.57 |
| Light: muted `#475569` on `#fffaf0` / `#fff` | 7.28 / 7.58 |
| Light: primary button `#fff` on `#0f766e` | 5.47 |
| Light: control border `#8b94a8` on `#fff` (non-text, 3:1) | 3.04 |
| Light: focus ring `#a21caf` on `#fffaf0` | 6.08 |
| Dark: text `#eef2ff` on `#0f1526` | 16.25 |
| Dark: muted `#b6c0d8` on `#0f1526` | 9.97 |
| Dark: border `#6b7691` on `#18203a` | 3.54 |
| Dark: button `#042f2e` on `#5eead4` | 9.78 |
| Dark: focus `#f0abfc` on `#0f1526` | 10.33 |
| Bridge: text `#2a1f12` on `#fff3d6` | 14.61 |
| Bridge: muted `#5b4630` on `#fff3d6` | 8.06 |
| Bridge: border `#8a5a2b` on field `#f7e3b5` | 4.64 |
| Bridge: button `#fff` on `#0b5d73` | 7.43 |
| Bridge: block label `#111827` on `#fcd34d` | 12.30 |
| Bridge: hint-cue outline `#a21caf` on `#f7e3b5` (3:1) | 5.00 |
| Space: text `#f1f5ff` on `#0b1437` | 16.46 |
| Space: muted `#c7d2fe` on `#0b1437` | 12.04 |
| Space: button `#1e1b4b` on `#fde047` | 12.13 |
| Space: module label `#111827` on `#a5b4fc` | 8.90 |
| Space: hint-cue outline `#fb923c` on `#16215c` (3:1) | 6.60 |
| Space: focus `#fde047` on `#0b1437` | 13.62 |
| Space: border `#818cf8` on `#16215c` | 5.01 |

The lowest non-text value is the light-theme control border (3.04:1), which meets 3:1 narrowly. Disabled controls (60% opacity) are exempt from contrast requirements but are visibly dim. These numbers do not establish full WCAG conformance.

## 5. Findings

Severity is the auditor's judgement for a 6–9-year-old audience using this draft in an adult-operated demo.

### Fixed in Phase 8D

| ID | Sev. | Defect (reproduction) | Why it matters | Fix | Regression test |
| --- | --- | --- | --- | --- | --- |
| A11Y-01 | Medium | At a 320 px viewport the mission page scrolled sideways by 12 px: a row of five 48 px blocks plus panel padding needs ~300 px, the page leaves ~256 px. (Open `/block-builder` at 320 px, press Start.) | WCAG 1.4.10 Reflow; content cut off at 400% zoom / smallest phones. | Below 360 px: panel padding 0.5rem and a 4 px row gap (below the `sm` breakpoint). Blocks stay 48 px; five-per-row grouping kept. (`globals.css`, `ConstructionField.tsx`) | Playwright 320 px case added to the existing overflow/target test of both worlds; it now also checks Hint 1 and Hint 2 states. |
| A11Y-02 | High | Between ~640 and ~720 px (= 200% browser zoom on a 1280 px screen) the two-column layout made the fifth block of each row overflow its panel and overlap the bridge panel (a block could not be clicked: another panel intercepted the pointer). | Zoomed users could not operate the core interaction. | Two columns only from 47rem; stacked below. | Playwright: every pile item stays inside its panel at 640, 700 and 768 px, both worlds. |
| A11Y-03 | Medium | Pressing **Start** (or **Start over**) unmounted the focused button and focus fell to `<body>`; keyboard and screen-reader users lost their place. | WCAG 2.4.3; assessment screens already moved focus to the heading. | Focus the new heading (`play-heading` / `intro-heading`, `tabIndex=-1`) after Start and Start over. | Playwright: focus lands on the mission heading after Start and on the title after Start over, both worlds. |
| A11Y-04 | Medium | Hint 1 says "The outlined blocks are those 3", but the outline was only a dashed border; the accessible names of blocks 11–13 were unchanged. | WCAG 1.1.1/1.3.3: instruction relied on a visual cue. | Cued blocks are named "…, in the pile, outlined by the hint. Press…". The name still starts with the original text. | Playwright: exactly three blocks carry the cue after Hint 1; none before; others do not. |
| A11Y-05 | Medium | The adult summary's "1 ● Correct 2 ● Correct…" row overflowed by 5 px at 320 px with a real completed check (found in a second sweep; the first sweep only audited the no-session summary). | Reflow at 320 px. | 2×2 grid below 360 px, 4 columns from 360 px. | Playwright: the existing summary overflow test now also runs at 320 px (failed on the old build, passes on the new). |

### Open — not fixed (tracked)

| ID | Sev. | Observation | Recommendation |
| --- | --- | --- | --- |
| A11Y-06 | Low | Header link (24 px high; meets the 24 px minimum of WCAG 2.5.8) and standalone links "Start a new independent check" / "Go to the independent check" are 18 px tall. In-sentence links on the outcome screen are exempt (WCAG 2.5.8 inline exception); the standalone ones rely on the spacing exception. Below the 44 px used elsewhere. | Style them as buttons or add padding. |
| A11Y-07 | Medium (usability) | On a 390 px phone the hint panel is below the answer picker, about 1,700 px from the top. Focus stays on "Check my answer" and the panel is not scrolled into view, so a sighted child may not notice a new hint. Screen readers get the `role="status"` announcement. | Needs a design decision (scroll the hint into view or place feedback above the picker). Not changed: it affects the instructional presentation, so it is part of the educator review. |
| A11Y-08 | Low | In forced-colors mode the progress pips lose their fill, so 5 placed blocks look like 5 empty pips. The text count beside them carries the same information. | Optional: add a non-colour fill cue. |
| A11Y-09 | Low | SVG ten-frame labels "Ten" / "Extra" render at 11 px at 320 px wide (≥ 12 px at 390). The labels are redundant with the figure's text alternative. | Increase the label size in the SVG or use HTML labels. |
| A11Y-10 | Info | `next` keeps the previously visited page mounted but hidden, so two `<main id="main">` elements can exist in the DOM (one hidden). axe reported nothing and the hidden one is not exposed. | Verify with a real screen reader. |

## 6. Not tested / not evaluated

Real screen readers (VoiceOver, NVDA, JAWS, TalkBack); Safari, Firefox, Edge; real iOS/Android devices and iOS text-size settings; Windows High Contrast; voice control; switch access; physical keyboards on tablets; magnification software; audio alternatives (the product has no audio); captions (no media); cognitive/reading-load testing with children; testing with any disabled person; a full WCAG 2.2 AA manual evaluation (many criteria — e.g. consistent help, accessible authentication — are not applicable or were not examined).

## 7. Limitations

Automated tools check a subset of criteria. Contrast was computed from resolved CSS backgrounds and does not account for gradients or images. The keyboard journey and focus checks were scripted in Chromium on macOS only. Findings reflect one audit by the implementer; they should be re-checked by an independent accessibility specialist before any claim about accessibility is made externally.

---

## Verification update — Phase 8E (2026-10-17)

**Scope:** the A11Y-07 fix (hint discoverability on phones) and its focus and announcement behaviour. Developer checks only: not a conformance claim, no assistive technology. The sections above are the Phase 8D record and are unchanged, except that the A11Y-07 row there is superseded by this section.

### Change under test

After "Check my answer" returns neutral feedback, Hint 1, Hint 2, "ask again" or "skip offer", keyboard focus moves **once** to a labelled `<section id="feedback-panel" tabindex="-1">` (accessible name from its title, e.g. "Hint 2"; description from the hint text). Focus scrolls it into view; the browser's own focus scroll is used (no custom scrolling), which is instant under reduced motion in the tested build. The region is deliberately **not** a live region, so the hint is not read twice. Connection problems and "You are back at the mission" remain in the polite `role="status"` region. The warm-up offer, warm-up, return-to-mission, outcome, Start and Start over keep the Phase 8D heading focus. The hint text, order and policy are unchanged.

### Root cause of A11Y-07 (reproduced 2026-10-17, Chromium, 760 px tall viewport)

Feedback renders below the answer form. The learner's viewport sits at the "Check my answer" button, so the new panel's top edge was at y = 730 (390 px wide) or 731 (320 px) in a 760 px viewport: about 30 px visible, the hint and ten-frame below the fold, about 1,760–1,860 px from the top of the page. Focus stayed on the button and nothing scrolled.

### Checks performed

| Check | Tool / viewport | Result |
| --- | --- | --- |
| Reproduced the defect before the fix | Playwright script, Chromium; 320, 390, 768 px × 760 | Confirmed (numbers above). |
| New Playwright regression tests fail on the old code | Same suite against the stashed old build | 22 of 22 failed (focus never moved). Pass on the fix. |
| Feedback focused, visible and in view for neutral, Hint 1, Hint 2; offer heading focused with the "Try the warm-up" button on screen | Playwright; 320×640, 360×740, 390×844, 768×1024, 1440×900; both worlds; reduced motion on and off | Pass (22 tests). Region top is inside the viewport and its first line is fully visible; the ten-frame may continue below the fold on the smallest phones. |
| Not a live region; text appears once | Playwright + Vitest (both themes) | Pass. |
| Accessible name and description of the hint | Playwright (`toHaveAccessibleName` / `Description`) and Chromium accessibility-tree dump | Pass: `region "Hint 2"` → heading level 3, paragraph, figure, note. |
| Keyboard: Shift+Tab from the hint returns to "Check my answer"; Tab from the offer heading reaches "Try the warm-up" | Playwright | Pass. |
| axe-core 4.10.2 (wcag2a/aa, 21a/aa, 22aa, best-practice; installed in a scratch folder outside the repo) | Chromium 320, 390, 768, 1440 (light), 390 forced-colors, 390 dark, 390 at 200% root font, 320 with the WCAG 1.4.12 text-spacing override; neutral, Hint 1, Hint 2, offer; both worlds | **0 violations** in every checked state. |
| Horizontal overflow | Same sweep | 0 px at every viewport and mode above **except** the 200% text case below. |
| Text spacing override at 320 px | Same sweep | No overflow; hint fully readable. |
| Forced colors (emulated) at 390 px | Same sweep | No overflow; focus still moves to the hint; axe clean. Real Windows High Contrast untested. |
| Contrast | axe in light, dark, forced colors | No contrast violation in the checked states (the hint reuses the existing `.notice` colours). |

### Findings

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| A11Y-07 | Medium (usability) | Hint below the fold on phones. | **Fixed** by focus movement (this phase). Untested with children or a screen reader. |
| A11Y-11 | Medium | **Pre-existing, found in Phase 8E; fixed in Phase 8F.** At 390 px with the root font at 200% the page scrolled sideways (628 px wide, 238 px over). Phase 8E located it on the start screen; re-measurement in 8F shows the intro screen was already fine and the overflow starts once the mission is playing (see below). Two further overflows of the same family were found: the homepage wordmark (442 px at 390) and, at 320 px, mission titles, buttons and the homepage button. | **Fixed (8F)** for the tested configurations. Verified in Chromium only. |
| — | Info | The focus ring on the hint is a keyboard-modality ring (`:focus-visible`); a touch or mouse user sees the scrolled hint but no ring. This matches the existing heading focus behaviour. | Accepted. |

### Not tested (unchanged unknowns)

- **No screen reader was used** (VoiceOver, NVDA, JAWS, TalkBack). Whether "Hint 1, region" followed by its description is announced well, once, is **unverified**. The name/description wiring is verified only in the accessibility tree.
- No physical phone or tablet; no Safari or Firefox; no real Windows High Contrast; no switch, voice-control or eye-gaze use.
- No children observed. Whether children notice, read and understand the hint is unknown.
- An independent accessibility specialist has not reviewed this.

## Phase 8F: text scaling and responsive artwork (A11Y-11)

**Technique.** Root `font-size` set to 200% in Chromium (Playwright), at CSS viewports 320, 360, 390, 768, 1440 px (height 760). This is a text-size test, **not** browser zoom: zoom also shrinks the CSS viewport, so the narrow widths (320 px is a 1280 px screen at 400% zoom) cover that side. Real browser zoom, Safari, Firefox, devices and screen readers were not tested.

**Root cause (measured, not assumed).** The SVG artwork was not the cause: it is `w-full h-auto` with a `viewBox` and scales correctly. The playing-screen `<section class="grid">` had an implicit `auto` column, which grows to the widest child's min-content. The resource rows are `flex` (no wrap) of five fixed `3rem` items; at 200% root that row is about 480 px plus padding, so the grid track, and with it the scene frame (x 64 to 628), became 564 px wide inside a 390 px page. The frame's `overflow-hidden` clipped the art but not its widened box. Both themes were affected identically (shared layout).

**Before and after (`document.documentElement.scrollWidth`, 390 px viewport, 200%).**

| Screen | Before | After |
| --- | --- | --- |
| Mission intro (either theme) | 390 | 390 |
| Playing (either theme) | 628 | 390 |
| Homepage | 442 | 390 |
| Adult summary at 320 px | 338 (18 px over) | 320 |
| Mission playing / outcome at 320 px | not measured before | 320 / 320 |

**Fix (no global `overflow-x` rule).** (1) Mission sections and the construction field grid use `grid-cols-1` (`minmax(0, 1fr)`), so a track can no longer outgrow the page. (2) Resource rows `flex-wrap`, so at large text a row of five wraps instead of widening; the five-per-row grouping is lost only when five cannot fit, and every item keeps its 3rem touch size. Slot and item counts, order and the `placed = used.size` projection are unchanged. (3) Headings get `overflow-wrap: break-word` and `.btn` gets `max-width: 100%` with centred, wrapping labels, so a long word such as "Construction" at 200% on 320 px wraps at the edge instead of overflowing. (4) The homepage wordmark may wrap its icon above the word. (5) The adult summary grids (`ProgressSummary`) get `grid-cols-1` for the same reason; found by the new test at 320 px, 200%.

**Tests.** `tests/e2e/text-scaling.spec.ts` (25 tests, including a wide-font stress at 320 px because CI's Linux fonts are wider than macOS'): both themes x 5 widths x 100%/200% through intro, playing, partial and full construction, feedback, Hint 1, Hint 2, warm-up offer and warm-up; homepage, assessment and adult summary at 200%; and an end-to-end interaction test at 390 px / 200% (selection moves the artwork's built-slot count, returning a resource lowers it, controls on screen and at least 44 px tall, feedback focused and in view, Start over works). 11 of them fail on the 8E code and pass now. Tolerance is 1 px for subpixel rounding.

**Remaining.** Selection rows may now be 2 to 3 per row at large text on phones (more scrolling, no sideways scroll). No screen reader, real zoom, other browser or device checks. Forced-colors and reduced motion were not re-run beyond the existing suites. No colours were changed.

**8F follow-up (CI finding).** The first 8F push passed locally on macOS but failed CI at 320 px / 200%: GitHub's Linux fonts are wider, so the homepage "Primer" title (61 px over) and the practice answer card (9 px over) still overflowed. Fixes: the remaining implicit-column grids (answer card, assessment screens, homepage) got `grid-cols-1`; headings and buttons use `overflow-wrap: anywhere` (it also lowers min-content, so containers can shrink); the homepage title is `min(3rem, 15vw)` (unchanged at 100% text, smaller only when large text meets a narrow screen). A wide-font stress test now guards this on any OS. Lesson: overflow results depend on the font stack; only Chromium on macOS and Linux CI were exercised. A third CI failure (/demo-progress, 26 px at 320 px) was a long word ("demonstration") in the synthetic-data notice; body text now has `overflow-wrap: anywhere`, and the wide-font stress covers the homepage, assessment and adult summary as well.

## Learning Experience 2.2: draft make-ten lab (2026-10-18)

**Scope:** `/cricket/make-ten-lab` and the shared answer picker it uses. Developer checks with automated and scripted tools only. **Not a conformance claim and not a screen-reader audit.**

| Item | What was done | Result |
| --- | --- | --- |
| Browsers | Playwright's Chromium, Firefox and WebKit builds, headless, macOS. The Cricket specs (intro, play, draft lab, new lab interaction/motion/layout specs; 46 tests) run on all three with `PRIMER_E2E_CROSS_BROWSER=1`; the full suite (450 tests, five worlds) runs on Chromium in CI. | All pass |
| axe-core 4.10.2 (installed in a scratch directory, not added to `package.json`), tags wcag2a/2aa/21a/21aa/22aa/best-practice | 14 states of the lab (start, ten built, wrong answer, right answer, extras sent, take from the ten, marked, recap, unguided try, right) at 320×568 light, 390×664 light and dark, 1440×900 light, in all three browsers: 168 states | **0 violations** after the fix below |
| Defect found by axe (pre-existing, also in the mission in all five worlds) | After a number was chosen, its chip showed white text on a pale fill (contrast 1.05:1) because an unlayered `.answer-chip` background beat the selected-state utility | Fixed (`AnswerPicker.tsx`, `globals.css`); e2e test asserts the chosen chip's fill differs |
| Defect found by an independent code review (also in the mission) | At 200% text on a phone, five columns made each number about 25 px wide and broke two-digit numbers across lines | Fixed with a container query; e2e at 320 and 390 px, 200% text: every number whole, at least 44 px, no sideways scroll |
| Widths | 320, 390, 768, 1024 and 1440 px through every step (no sideways scroll); 200% text at 320 px | Pass in Chromium, Firefox and WebKit |
| Target size | Objects 44 px on phones (48 to 52 px from 40 rem); numbers at least 44 px; buttons unchanged | Measured in e2e |
| Keyboard | Objects are buttons; Enter/Space move or mark; focus follows the work; the question takes focus when it opens; the step heading takes focus on Next/Back (a restored, already-answered step no longer steals it); arrow keys choose a number | Scripted e2e in all three browsers |
| Status announcements | One polite live region for moves, hidden from sight; the number form has its own for feedback; counts sit in headings, not in live regions. "No duplicates" was checked by structure (a single live region in the lab outside a question), not by listening | Pass by structure; not heard |
| Reduced motion | The same click sequence ends in an identical state with and without the preference; no object animates under the preference | Pass (e2e) |
| Pinned board | Pinned only when 15 rem remain below it, so a tall board (large text, short screen) scrolls normally; focus scroll padding set to the board height | Layout tested at 320×568, 390×664, 390×844 |
| **Real screen reader (VoiceOver, NVDA, TalkBack)** | **NOT run.** The accessibility tree was not read aloud by any assistive technology | **Open (#24)** |
| Physical phones/tablets, real browser zoom, switch access, forced colors for this page | **NOT tested** (emulated viewports and root font-size only) | **Open (#24)** |

