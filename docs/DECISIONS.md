# Primer — Decisions 2026-10-16

US first; math first; Block Builder and Space Construction; shared theme-neutral curriculum and evaluator; original characters; React/SVG first, no complex game engine; deterministic hints; synthetic demo before child pilot; solo founder with coding agents; no coding prompt until requested.

Open: legal consent approach, US educator reviewer, parent recruitment, final providers, actual skill-difficulty equivalence.

Deferred: voice, limitless generative content, 3D, user-uploaded copyrighted characters, multiplayer, payments, sophisticated knowledge-tracing infrastructure.

## Phase 1 implementation decisions (2026-10-16)
npm as package manager. System font stack instead of Google-hosted fonts (no external requests). Prettier for formatting, with eslint-config-prettier. Playwright tests the production build, not the dev server. Next.js scaffold defaults `cacheComponents` and `partialPrefetching` kept as generated. CI runs `npm audit --omit=dev` and gitleaks; dev-only audit findings in the ESLint toolchain are tracked, not force-fixed.

## Phase 1.5 maintenance (2026-10-16)
**Accepted risk — braces (GHSA-vfj7-8cjw-p6xm, high, CVSS 7.5).** Chain: eslint-config-next 16.4.2 → @next/eslint-plugin-next → fast-glob 3.3.1 → micromatch 4.0.8 → braces 3.0.3. The advisory lists no patched version (braces 3.0.3 is the latest release), so `npm audit` still reports 5 high findings and they are **unresolved**. Impact is a denial of service (stack exhaustion crashing the Node process) from deeply nested brace patterns; it is dev-only (`npm audit --omit=dev` reports 0), and lint patterns come from this repository, not untrusted input. The audit's suggested fix downgrades to Next 14 and was rejected. Follow-up: re-run `npm audit` monthly and after any `eslint-config-next` update. CI audits production dependencies only, so this known dev finding does not block builds.

**CI hardening.** `actions/checkout` and `actions/setup-node` are pinned to full commit SHAs (the commits behind their v4 tags). The gitleaks tarball is verified against a pinned SHA-256 before use; bump version and hash together. Pins do not update themselves, so review them periodically.


## Phase 2 domain decisions (2026-10-16)
**Design choices**
- S05 is modelled as an `assessment-objective` with an `assesses` list, not a prerequisite, so transfer evidence cannot distort progression.
- Problems carry only an instructional skill (S01–S04). S05 evidence comes from which bank an item sits in (independent, delayed).
- The stored answer key is cross-checked against a recomputation from the parameters; a mismatch rejects the problem. Unknown fields (including any theme field) are rejected.
- Learner responses are never coerced: only a whole-number `number` from 0 to 20 is scorable.
- Hints are not part of banks. Only tutoring holds hint ladders (controlled ids), so assessment items cannot carry hints.
- Assessment feedback is one identical neutral action for right and wrong answers; unreadable answers are re-asked and not scored.
- Exact duplicates across banks are errors; equivalent number facts are warnings.
- Whether work was independent is derived (assessment phase and zero hints), never stored. Repeated attempts at the same assessment item count once. Skips are not evidence.
- Mastery is behind an explicit policy type. The only existing policy is the draft one, which cannot award mastery.
- No dependency was added. Plain TypeScript validation replaced a schema library to keep the surface small.

**Implementation assumptions awaiting educator review** (not approved decisions): the prerequisite edges, bank contents, hint wording ids, the practice sequence (neutral feedback, hint 1, hint 2, prerequisite fallback or skip offer, stop after 5 wrong), and the 3-unreadable-answers skip offer.

## Phase 3 decisions (2026-10-16)
- **Server-authoritative demo session in memory.** Opaque UUID, 30-minute sliding TTL, 500-session cap, `seq` for stale/duplicate rejection. Rejected: client-held tutor state (forgeable hint/attempt counts), signed cookie/token (replayable, needs a secret), database/Redis (not justified for one demo). Cost: no persistence, single instance only; documented in ARCHITECTURE.md.
- **Mission name, not item id.** The API accepts only `broken-bridge`, which the server maps to guided-practice item `GP-07`. Assessment items cannot be named.
- **Route Handler, not Server Action.** A plain JSON endpoint is easier to unit test, inspect and bound.
- **Shown quantity vs answer.** The pile always has `start` blocks; the live count shown is blocks *on the bridge* only. The remaining number is never printed, so the learner counts it.
- **Tap/click first.** Blocks are native buttons; no drag-and-drop. Answers are a 0-20 radio group, not free text.
- **Hint wording is client-side draft presentation** keyed by the server's hint id; make-ten numbers come from the evaluator's strategy.
- **No `easier-practice` activity.** The policy's prerequisite fallback ends the mission with an honest message because new curriculum content is out of scope.
- `server-only` is used without installing the package (Next resolves it); Vitest stubs it. No dependencies were added.

## Phase 4 decisions (2026-10-16)
- **Theme is presentation-only and never sent to the server.** Rejected: a `theme` request field (adds an allowlist and a place for theme to leak into logic) and a second route (duplicate code). Consequence: the server cannot tell the themes apart, which is the intended proof that they share one engine.
- **Neutral mission id and path.** `broken-bridge` / `/api/practice/bridge` became `subtract-practice` / `/api/practice/mission` because the server mission is not bridge-specific.
- **`ThemeConfig` is string-only, frozen data, no functions.** Story text uses two validated placeholders; hints use a typed vocabulary instead of string replacement over whole sentences. Validated by `tests/unit/themes.test.ts`.
- **Readiness gate in the UI, not the server.** The picker unlocks only when the built quantity matches the story. Scoring rules unchanged.
- **Colors via CSS variables on a theme class**, not per-theme components; only the two scenes differ in markup.
- **Defect fixed:** `.gitignore`'s Python-template `lib/` rule hid `src/lib/practice-protocol.ts`, so Phase 3 commit `395727f` failed CI typecheck until `68eefb2`. `!src/lib/` now un-ignores it. Lesson: after committing, check CI or typecheck a clean clone, not just the working tree.

## Phase 5 decisions (2026-10-16)
- **Separate assessment endpoint, shared machinery.** `/api/assessment` has its own parser, state and service, but reuses `TtlStore`, the bounded body reader, `evaluateResponse` and tutoring `step` (independent phase). Rejected: adding an `assessment` mode to the practice API, which would put hint and feedback code on the same path as scored independent work.
- **Neutral replies by construction:** the reply never contains a correctness field during the check, so no UI can leak it.
- **Unreadable answers do not consume the scored try** (practice and assessment already treat them as "ask again"); a skip is recorded but is not evidence.
- **Summary keyed by an opaque session id in the URL**, not browser storage, so it survives refresh and cannot be forged: the browser sends an id, never a number. No fixture or sample profile exists; with no session the page shows only guidance.
- **No link between practice and check state.** Rejected: carrying a practice session id into the check, which would need a server-verified link and an identity concept we do not have.
- **Version labels are shown to adults as provenance**, so they are no longer in the browser-exposure token list; answer keys, item ids and bank names still are.
- **Descriptive labels only:** "Correct in this short check", "Needs more evidence", "Not yet assessed". No percentage-as-mastery, trend or prediction.

## Phase 6 decisions (2026-10-16)
- **Keep the in-memory store.** No database, Redis or auth just to survive a restart; expiry is surfaced honestly instead. Rejected: rebuilding a session from client-held answers or scores (fabricated evidence).
- **Reset on hide, not `cacheComponents: false`.** Disabling the setting would change caching across the whole app; resetting two client components fixes the stale-state hazard directly. Tested by `returning to a page through in-app navigation never resumes old state`.
- **Global per-process start limiter, not per-IP.** IP-keyed limiting needs trusted proxy headers and amounts to tracking; a global start cap protects the real risk (evicting live sessions) with no identifier. Rejected: external rate-limit services.
- **No CSRF token** (no cookies, JSON-only, no CORS headers).
- **Bare summary link removed from the home page.** It was a dead end without a session id, and the id should only travel from the finished check. The summary page still explains itself when opened bare.
- **5xx is retryable.** Previously any non-network error returned the learner to the start; a transient server error now keeps their question.
- **Copy:** fixed one grammar error on the home page, softened "planned" in page metadata, added refresh behavior to the intro text. No mathematical values, hint policy or feedback semantics changed. Wording still needs educator review.

## Phase 8A decisions (2026-10-16)
- **No UI framework or fonts.** Identity is CSS variables in `globals.css` (cream/navy/teal, amber highlight), a few shared classes (`.btn`, `.card`, `.notice`, `.field-panel`) and inline SVG. System font stack, zero new dependencies.
- **Theme = palette + artwork + strings.** Each world sets CSS variables on its theme class (`--panel-bg`, `--accent`, item colors and shape); scenes are SVG components passed to the shared mission. A new presentation-only `goal` string was added to the theme contract (no digits, no authority).
- **Worlds keep their own palette in dark mode** (self-contained panels); the page chrome follows `prefers-color-scheme`.
- **Assessment is deliberately plainer** (`.calm-panel`, no world art). Its progress bar is decorative; the heading carries the text.
- **Progress pips duplicate text** ("Blocks on the bridge: N (goal: M)") and are `aria-hidden`; they do not change placement behavior (that is Phase 8B).
- **Motion** lives only inside `prefers-reduced-motion: no-preference` (enforced by a unit test): scene entrance, block placement pop, button press.
- Summary visuals show counts and per-question outcomes only; no rates, scores or confidence.

## Phase 8B decisions (2026-10-16)
- **Count-based slot mapping, not identity-based.** Scene slots are interchangeable, so the scene needs only `placed` and `required`. Mapping item ids to slots would add state with no visible benefit and would make returns look inconsistent. Rejected: a second construction array or counter.
- **Placed is derived (`used.size`), never stored**; built slots are clamped to `required` so over-placement can never draw extra slots (the existing text still tells the learner to put extras back).
- **Scene chosen by `theme.id` inside the client**, removing the `scene` prop. Rejected: making scenes client components and passing references through server pages (more indirection for the same result).
- **Static completion outline instead of a celebratory animation**: visible under reduced motion, no flashing, and does not imply a correct answer.
- **Space planet moved down ~16 px** to make room for up to nine module cells (takeAway can be 1–9 in the cross-ten family).
- **Home cards:** the "Draft demo" pill moved beside the card title so the action button no longer wraps differently per card.
- **Contrast review:** Space theme token pairs (text, muted, buttons, item numbers, borders, focus, cue) all measured at or above their WCAG AA targets (lowest: field-built border 4.62:1 vs 3:1 required), so no colors were changed.

## Phase 8C decisions (2026-10-16) — all provisional pending educator review

- **No tutoring-policy change.** The domain already emits `practice-prerequisite` (S03) after both hints. The service now honours it instead of ending the mission. Rejected: adding a new remediation state to the domain (nothing needed it).
- **Warm-up is S03 (take-away), reusing guided-practice item GP-05 (10 − 6).** It is the policy's first S04 prerequisite and needs no new bank. Rejected: a part-whole (S02) exercise, because the policy names S03 first and a second item type would be new curriculum. Open educator question.
- **Offered once per session.** A second request for support ends practice as before, so there is no remediation loop. The learner can decline, go back to the mission or stop at any time.
- **Help stays on the record.** Returning to the mission starts a fresh item but carries `hintsShown`, so a later correct answer is never "independent". Practice never writes evidence in any case.
- **Stage = what the server disclosed.** Hint 1 carries `takeToTen` with `takeFromTen: null`; hint 2 carries both. Earlier code sent both with hint 1, which let a client draw hint 2 early. The picture builder cannot produce a later stage without the later number.
- **Ten-frame helper lives in `src/lib/ten-frame.ts`, import-free,** because the boundary test forbids client imports of `@/domain` (answer keys live there). It holds no scoring authority.
- **A bare ten-frame is only part-whole.** The make-ten label is used only when the second removal step is shown (hint 2 / "from-ten" stage). Ineligible numbers draw nothing.
- **Neutral feedback (wrong answer 1) gets no picture.** Stage A of the candidate ladder maps to it unchanged.
- **Playwright:** `reuseExistingServer` is now opt-in (`PRIMER_E2E_REUSE=1`); the port is overridable with `PRIMER_E2E_PORT`.

## Phase 8E decisions (2026-10-17)

- **Move focus to the help; do not move the help.** Feedback stays under the answer form (reading order: question, answer, response). After a key press that returns help, focus goes once to a labelled `tabindex="-1"` region, and the browser's native focus scroll brings it into view. Rejected: placing feedback above the form (it would push the "Check my answer" button down as the hint grows), a modal or floating overlay (intrusive), and custom smooth scrolling (disorienting, and slower under reduced motion).
- **Help region is not a live region.** The old `role="status"` wrapper plus focus would announce the hint twice. Focus plus accessible name (title) and description (text) gives one announcement. Connection problems and "back at the mission" keep the polite live region because they arrive without a key press.
- **Only the learner's own action steals focus.** Focus moves only for responses to "Check my answer", never for passive updates or while typing elsewhere.
- **Instruction content untouched.** The educator-flagged issues (Hint 1 disclosure, picture vs the learner's taps, warm-up choice, "Not now" ending the mission) are documented in the educator packet, not changed.


## Phase 8F decisions (2026-10-17)

- **Fix the track, not the art.** The SVG scenes already scaled; the grid's implicit `auto` column grew to the resource rows' min-content. Mission grids use `grid-cols-1` (`minmax(0, 1fr)`) and rows wrap. No global `overflow-x` rule, because that would hide the problem and clip content.
- **Wrap before shrinking.** Text and touch targets keep their rem sizes; rows wrap, headings use `overflow-wrap: break-word` and buttons `max-width: 100%`. The five-per-row grouping yields only when five items cannot fit.

## Milestone 1 decisions (2026-10-17)
- **Welcome is the product entry; missions stay separate routes.** Home links to `/welcome`; choosing Building or Space links to the real `/block-builder` or `/space-construction`. The interest is not passed to the server and is not stored. Rejected: query parameters or storage carrying the interest (new state, no benefit yet).
- **(Superseded in Milestone 2: all five are playable.) Unbuilt interests are never started.** Cricket, Basketball and Soccer show "not playable yet" and offer Building or Space. Rejected: starting a Building mission under another name.
- **`/welcome` resets when left**, like the mission pages, because Next keeps hidden pages mounted. The choice lives only while the page is in view.
- **Shared header links** "Choose an interest" and "Back to Primer home" on every page except home (which has its own entry link) and `/welcome` (which hides the interest link because it is already there), so no page is a dead end.
- **E2E start limit: no override, serial browser tests (#30).** Root cause of the full-suite failures, reproduced locally: the production start cap (120 per minute per process) is exhausted by the browser suite itself. An environment-variable override was built first and rejected after Codex review: a name that is easy to copy into a deployment is not a security boundary, and `NODE_ENV` cannot tell a Playwright run of a production build from a real deployment. `src/server/rate-limit.ts` is now identical to `main`: a constant cap with no configuration path (a unit test fails if `process.env`, `NODE_ENV` or `PRIMER_START_LIMIT` appears there or in the routes). Playwright runs with `workers: 1` (170 of 170 passed in 3.8 min; 2 workers still failed 2 tests, 3 workers 3, on every run). If the suite outgrows one worker, shard it across separate server processes, each with its own limiter. CORRECTION (checked against the logs of CI runs 38987722610 and 38988195480): those two earlier CI failures were NOT rate-limit exhaustion. They were real 200%-text overflow failures (`text-scaling.spec.ts`) that the Phase 8F commits were in the middle of fixing. The rate-limit exhaustion is a separate, locally reproduced cause of parallel-run failures; the exact `demo-journey.spec.ts` failure originally reported was never reproduced and has no known cause.
- **Focus after in-app navigation (#29).** `RouteFocus` (in the root layout) moves focus to the page's `main h1` when the pathname changes and focus has been lost to `<body>`. It does nothing on a hard load, on ordinary updates, or when focus is already inside the page. Probe before the fix: focus was `BODY` after link navigation from `/`, `/block-builder` and `/assessment`. Not tested with a real screen reader.
- **Prototype preserved, not integrated.** The Block Builder prototype lives on `prototype/block-builder-adventure` (simulated scoring, unreviewed hints). Reuse is decided in #4.
- **Agent governance:** `AGENTS.md` holds agent rules, GitHub issues hold work, `docs/MVP-5-DAY-PLAN.md` holds sprint scope; no other plan documents.

## Milestone 2 decisions (2026-10-17)
- **Five worlds are five `ThemeConfig`s on the one shared mission engine.** Cricket (`/cricket`), Basketball (`/basketball`) and Soccer (`/soccer`) were added as data (nouns, story, colors) plus an SVG scene. No new component, API field, evaluator, tutoring path or session code. The server still cannot tell the themes apart, and no theme or interest is ever sent to it. A unit test sends the same learner actions through all five and requires byte-identical requests.
- **Interest -> theme mapping is explicit and total.** `src/interests` maps each of the five interests to a `mission: { themeId, href }`; the old "preview only / not playable" state is removed. The preview shows the mission theme's own story (closes #10), so the two cannot disagree. Interest names and theme names may differ (for example the interest "Space Explorer" opens the theme "Space Construction"); the founder may rename either later.
- **Presentation-only theme tests were not weakened.** They run unchanged over five themes (no digits, no answer-like keys, frozen string-only data, stylesheet rule for each class).
- **The scene never shows the remainder.** The basket, rack and bag are drawn as solid shapes with no countable balls, only the five slots to fill are drawn, and no "8 left" counter exists. The remaining balls are the buttons still in the supply, countable by sight and by assistive technology.
- **Hint wording reframed, tutoring policy untouched.** The ids, ladder, numbers and server authorization are unchanged. Presentation now says "Let's look at the same subtraction another way", describes taking 3 then 2 as a picture "not what you moved", and never says "you took". Ten-frame captions say "In this picture". Whether this is pedagogically right, and the underlying mismatch, remain educator-review questions (#16, #17).
- **Surprise me (#11):** all five interests are playable, so it can pick any of them; its choice is tested deterministically by stubbing `Math.random` in the browser. Nothing about the choice is stored.
- **Replay and exit:** "Start over" on the finish screen begins a fresh server session (all 13 back, nothing placed); the header links "Choose an interest" and "Back to Primer home" exit from any mission. Both are covered by browser tests in all five worlds.
- **E2E concurrency unchanged:** serial, no production override (see Milestone 1).

## Milestone 3 decisions (2026-10-17)
- **The remaining objects are individually drawn and countable; the scene never carries them.** Milestone 2 hid the supply inside a solid basket/rack/bag to avoid showing the answer, which also hid the set a child must count. Now the thirteen resources are real, separate, drawn buttons in a themed tray (crate, basket, rack, bag, storage bay). The scene draws only the five places to fill. The count the learner sees is the session's own state (one button per item, five moved), so it cannot disagree with the server. Nothing states the remainder, and no numeral is printed on the objects (accessible names keep each object's number).
- **Moved objects are the same drawing.** A moved object keeps its drawing, gains a ring and a tick, and sits in the second area; its place in the tray stays as a dashed empty spot, so the five taken are visible and the eight left are countable. Moved is shown by place, ring and tick together, never by color alone.
- **Accessible counting:** the tray group is described as "count them yourself, one at a time with Tab" with no number. Keyboard focus follows the pressed object on to the next one in the tray (and follows a returned object back), so Tab does not restart (Codex finding). Remaining set size is not announced as a list length.
- **One shared interaction stack for five worlds:** `ItemArt` (drawing), `ConstructionField` (tray, tap/keyboard), `Guide` (strip), CSS motion. A theme supplies only `itemArt`, `guide` (name, look, four fixed lines) and a palette class.
- **Guides react to real events only.** Four moods: welcome (nothing placed), working (objects being moved), again (neutral feedback, a hint, a skip offer or an unreadable answer), done (server says right, shown on the finish screen). Lines are fixed authored text with no numbers; "again" never praises or judges; nothing is generated. Building uses Tinker (robot), Space Orbi (robot), the sports use Coach Bails, Dribbles and Kicks.
- **The finished world stays on screen** after a right answer (picture complete, guide in "done"). Picture "complete" requires exactly the goal number placed; over-placing does not finish it (Codex finding).
- **Motion is CSS-only, mount-driven and inside `prefers-reduced-motion: no-preference`:** objects drop into the destination, pop back into the tray, the guide hops and waves, the finished scene brightens. State never depends on motion; tests assert final states.
- **Not done on purpose:** no 3D engine, no new dependency, no change to tutoring policy, ladder, server authorization, answer picker or warm-up. The art is still flat SVG; a real art pipeline is the next dependency (#12).

## Milestone 4 decisions (2026-10-17)
- **Art tooling and what "premium" means here.** No image-generation tool was available (the Canva and Figma connectors were not authenticated, and no local renderer was installed), so no raster artwork was generated and none is claimed. The scenes are hand-authored, layered SVG: gradient skies and light glows, far/mid/near layers, perspective floors and fields, themed set pieces, contact shadows, foreground. It is materially richer than Milestone 3 but is still vector illustration, not commissioned or generated illustration. A dedicated art pass is tracked in #12 with the assets it needs.
- **Scenes are layered components with one shared frame.** `scenes/parts.tsx` holds the frame (viewBox 600 x 340, `slice`), the lit goal pad with its places, the contact shadow, the glow and the celebration pieces; each world is one file. All art is inline: no image, media or font request, so nothing can fail to load, and a test asserts it. Each scene must stay under 420 elements and 26 KB.
- **Phone composition (closes #35 in part).** On phones the frame is 5:4 and the SVG slices its sides, so everything essential (the goal pad, always centred on x = 300) lives in the centre band x 110..490; on 640 px and wider the frame is 600:340. The scene is now about a third of a phone viewport (was 14%). A test checks that every goal place is on screen at 320, 390 and 768 px.
- **Decoration that could be mistaken for a resource is not drawn.** No loose balls, blocks or capsules in scenes; cones, rocks and hubs are shaped differently; the scoreboard shows bars, not numerals. The countable objects are only the tray buttons.
- **Objects visibly travel.** A pressed object flies from where it was to where it lands (Web Animations API on the real button: translate and a small scale, 380 ms). Counts come from state immediately, so no frame can show an impossible quantity; input is never blocked; the final layout has no leftover transform; it is skipped entirely under reduced motion. Verified in real Chrome (running animation at 60 ms, none at 600 ms).
- **Filled is not solved.** The picture's goal ring turns green when exactly the goal number is placed (`data-complete`), but sparkles, the brighten and the guide's finished pose appear only after the server confirms a right answer (`data-solved`). Caught in review of the first build, which celebrated at five placed.
- **Ambient motion is slow, decorative and off for reduced motion:** drifting clouds, twinkling stars, river ripples, flags, a breathing goal pad. Event motion (flight, guide hop, sparkles) is finite; tests wait for finite animations only.
- **Welcome and interest cards reuse the mission scenes**, so previews and games cannot drift apart; the older separate welcome art was removed.
- **Summary polish only.** A plain-language lead restating the counts, a two-card comparison of guided practice and the independent check, a no-wrap header fix, and next-step links. No evidence calculation, count or wording about mastery changed. A draft home activity was not added (educator-blocked, #22).
- **Not done on purpose:** no tutoring, hint-ladder or answer-picker change (proposals recorded on #16/#17), no sound, no new dependency, no 3D, no rate-limit change.

## RC1 decisions (2026-10-17)

- **Answer entry: presentation only.** The picker keeps exactly 0–20 as radio buttons, now in a grid (5 columns on phones, 7 from 640 px). A smaller option set, typed entry, a stepper or a number line would change cueing, difficulty or assessment conditions, so they are **not** implemented and are recorded as educator questions (#17, #20). Details in [RC1.md](RC1.md).
- **"Not now" is described, not changed.** The offer says the practice ends; the state machine, ladder, thresholds and hint text are untouched. Whether declining should return to the question stays open (#19).
- **Hosting is single-process only.** In-memory sessions and the per-process limiter mean one always-on instance and no serverless hosting for the demo; restarts end sessions. The limiter stays fixed at 120 starts per minute with no override. A shared store is a separate, unapproved redesign. See [DEPLOYMENT.md](DEPLOYMENT.md).
- **Hardening headers and `/api/health`.** Added frame, permissions, referrer and noindex headers and a data-free liveness route. No CSP yet (needs a tested nonce policy).
- **Nothing deployed, merged or approved.** No hosting, DNS or payment was set up; no educator, screen-reader or child testing occurred.
