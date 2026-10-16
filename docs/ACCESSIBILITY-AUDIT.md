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
