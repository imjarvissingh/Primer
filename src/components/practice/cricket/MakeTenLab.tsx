"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import Link from "next/link";
import type { ItemArtId } from "@/themes";
import {
  advance,
  back,
  canPress,
  chooseAnswer,
  countAt,
  initialLab,
  isMarkable,
  isRight,
  LAST_STEP,
  nextNeeds,
  openQuestion,
  pressBall,
  RACK,
  recap,
  shownBy,
  triesFor,
  type LabState,
  type Needs,
  type Place,
  type Question,
} from "@/lib/make-ten-lab";
import { AnswerPicker } from "../AnswerPicker";
import { ItemArt } from "../ItemArt";

/**
 * What a world supplies to the lab: nouns and a drawing. The steps, numbers,
 * questions and checks are the same for every world (src/lib/make-ten-lab.ts).
 */
export interface LabWords {
  readonly guide: string;
  readonly one: string;
  readonly many: string;
  /** The holder of ten, e.g. "rack". */
  readonly rack: string;
  /** Where the taken objects go, e.g. "the nets". */
  readonly destination: string;
}

export const CRICKET_LAB_WORDS: LabWords = {
  guide: "Coach Bails",
  one: "ball",
  many: "balls",
  rack: "rack",
  destination: "the nets",
};

const STEP_TITLE: Record<LabState["step"], string> = {
  1: "Make a ten",
  2: "Start with the extras",
  3: "Take the rest from the ten",
  4: "How many are left?",
  5: "Try one on your own",
};

const reducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface BallSpot {
  rect: DOMRect;
  place: Place;
}

/**
 * Remember where every object is on screen, as it looks right now (including
 * any travel still in progress), so the next render can show each object
 * moving from there to its new place. Purely visual: it never decides what
 * state the lab is in, never blocks input, and is skipped under reduced motion.
 */
function spotsOf(root: HTMLElement | null) {
  const spots = new Map<number, BallSpot>();
  root?.querySelectorAll<HTMLElement>("button[data-lab-ball]").forEach((el) =>
    spots.set(Number(el.dataset.labBall), {
      rect: el.getBoundingClientRect(),
      place: el.dataset.labPlace as Place,
    }),
  );
  return spots;
}

/**
 * Pin the board while a question is open, so the objects stay in view while the
 * learner chooses a number, but only when the board leaves room for the
 * question below it. A taller board (large text, a very short screen) simply
 * scrolls, so pinning can never trap the question out of reach.
 * The state is the data-pinned attribute (see .lab-board[data-pinned] in CSS).
 */
function applyPin(el: HTMLElement) {
  const html = document.documentElement;
  const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
  // Judge the board by the height it has when pinned (its own padding and
  // rule included) however it looks now, so pinning does not change the
  // answer and flicker.
  const style = getComputedStyle(el);
  const extra =
    parseFloat(style.paddingTop) +
    parseFloat(style.paddingBottom) +
    parseFloat(style.borderBottomWidth);
  const pinnedNow = el.dataset.pinned === "true";
  const height = el.offsetHeight - (pinnedNow ? extra : 0) + rem * 1.125;
  // Pin only if the question (about 15rem of numbers and a Check button)
  // still fits below it.
  const pin = window.innerHeight - height >= rem * 15;
  el.dataset.pinned = String(pin);
  // Keyboard focus scrolls to just below the pinned board, never behind it.
  html.style.scrollPaddingTop = pin ? `${height + 8}px` : "";
}

function releasePin(el: HTMLElement) {
  delete el.dataset.pinned;
  document.documentElement.style.scrollPaddingTop = "";
}

function usePinnedBoard(board: RefObject<HTMLElement | null>, active: boolean) {
  useLayoutEffect(() => {
    const el = board.current;
    if (!el || !active) return;
    const measure = () => applyPin(el);
    measure();
    const ro =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
      releasePin(el);
    };
  }, [board, active]);
}

interface MakeTenLabProps {
  words?: LabWords;
  art?: ItemArtId;
}

/**
 * A draft, learner-driven make-ten activity in five steps. Every step needs an
 * action on the objects and every number the learner gives is a decision about
 * what they can see: how many are outside a full ten, how many more are needed,
 * how many are left. The lab states a result only after the learner has given
 * it. State is local; rules live in src/lib/make-ten-lab.ts. It scores nothing.
 */
export function MakeTenLab({
  words: w = CRICKET_LAB_WORDS,
  art = "cricket-ball",
}: MakeTenLabProps) {
  const [lab, setLab] = useState<LabState>(initialLab);
  // Always the newest state, even between two taps that arrive before React has
  // re-rendered, so a fast second tap builds on the first instead of undoing it.
  const latest = useRef(lab);
  const commit = (next: LabState) => {
    latest.current = next;
    setLab(next);
  };
  // The last thing that happened, for the live region (moves, marks).
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);

  // Focus the step heading when the step changes (not on first render).
  const shownStep = useRef(lab.step);
  const shownDepth = useRef(lab.history.length);
  useEffect(() => {
    if (
      shownStep.current === lab.step &&
      shownDepth.current === lab.history.length
    )
      return;
    shownStep.current = lab.step;
    shownDepth.current = lab.history.length;
    // Bring the new step's title to the top of the screen, then focus it, so a
    // phone shows the title and the objects together rather than the page header.
    heading.current?.focus({ preventScroll: true });
    // Not scrollIntoView: it would also honour the scroll padding set for the
    // pinned board and leave the title below the fold.
    if (root.current)
      window.scrollTo({
        top: window.scrollY + root.current.getBoundingClientRect().top - 8,
        behavior: "auto",
      });
  }, [lab.step, lab.history.length]);

  // Where each object was before the latest change (see spotsOf). Every change
  // that can move objects (a tap, Next, Back, Start again) records it first.
  const before = useRef<{
    key: string;
    spots: Map<number, BallSpot>;
  } | null>(null);
  const problemKey = `${lab.problem.total}-${lab.problem.take}`;
  const remember = () => {
    before.current = { key: problemKey, spots: spotsOf(root.current) };
  };
  // Show each object travelling from where it was to where it is now. A move
  // lifts the object; objects only pushed aside by the new layout glide. The
  // numbers and places are already final when this runs, so a travelling object
  // is never the only evidence of a quantity, and an interrupted travel simply
  // continues from where the object looks to be.
  useLayoutEffect(() => {
    const was = before.current;
    before.current = null;
    if (!was || was.key !== problemKey || reducedMotion()) return;
    root.current
      ?.querySelectorAll<HTMLElement>("button[data-lab-ball]")
      .forEach((el) => {
        if (typeof el.animate !== "function") return;
        const prev = was.spots.get(Number(el.dataset.labBall));
        if (!prev) return;
        const now = el.getBoundingClientRect();
        const dx = prev.rect.left - now.left;
        const dy = prev.rect.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        const lifted = prev.place !== el.dataset.labPlace;
        el.animate(
          [
            {
              transform: `translate(${dx}px, ${dy}px) scale(${lifted ? 1.12 : 1})`,
              zIndex: 5,
            },
            { transform: "translate(0, 0) scale(1)", zIndex: 5 },
          ],
          {
            duration: lifted ? 380 : 260,
            easing: "cubic-bezier(0.2, 0.8, 0.25, 1)",
          },
        );
      });
  }, [lab, problemKey]);

  // After an object moves its button is replaced, so focus would fall to the
  // page. Keep it where the learner is working: the next object that can still
  // move from the same place, else the question that just opened, else the
  // moved object, else "Next step".
  const refocus = useRef<{
    ball: number;
    from: Place;
    opened: boolean;
  } | null>(null);
  useEffect(() => {
    const want = refocus.current;
    refocus.current = null;
    if (!want || !root.current) return;
    const q = (sel: string) => root.current?.querySelector<HTMLElement>(sel);
    (
      (want.opened ? q("[data-lab-question] input:not([disabled])") : null) ??
      q(`button[data-lab-place="${want.from}"]:not([disabled])`) ??
      q("[data-lab-question] input:not([disabled])") ??
      (nextNeeds(lab) === null ? nextButton.current : null) ??
      q(`button[data-lab-ball="${want.ball}"]:not([disabled])`) ??
      nextButton.current
    )?.focus();
  }, [lab]);

  const question = openQuestion(lab);
  usePinnedBoard(board, question !== null);

  const press = (i: number) => {
    const now = latest.current;
    const next = pressBall(now, i);
    if (next === now) return;
    const from = now.places[i];
    const to = next.places[i];
    if (from !== to) {
      remember();
      refocus.current = {
        ball: i + 1,
        from,
        opened: openQuestion(next) !== null && openQuestion(now) === null,
      };
      setSaid(announce(next, i, w));
    } else {
      // Marking: the button's own pressed state is the one announcement.
      setSaid("");
    }
    commit(next);
  };

  const { problem } = lab;
  const onLesson = lab.step < LAST_STEP;
  const indexesAt = (p: Place) =>
    lab.places.flatMap((where, i) => (where === p ? [i] : []));
  const racked = indexesAt("rack");
  const loose = indexesAt("pile");
  const atNets = indexesAt("nets");
  // At the nets, show the two parts of the take apart: first the extras, then
  // the ones from the ten, so "5 is 3 and 2" is visible in the picture itself.
  const netsExtras = atNets.filter((i) => !lab.fromRack.includes(i));
  const netsFromTen = lab.fromRack.filter((i) => lab.places[i] === "nets");
  const needs = nextNeeds(lab);
  const summary = recap(lab);
  // Step 4 asks about the ten, so the count at the nets would only echo "5".
  const showNetsCount = lab.step === 2 || lab.step === 3 || lab.step === 5;

  const ball = (i: number) => {
    const p = lab.places[i];
    const markable = isMarkable(lab, i);
    const marked = markable && lab.marked.includes(i);
    return (
      <button
        key={i}
        type="button"
        data-lab-ball={i + 1}
        data-lab-place={p}
        aria-label={`${cap(w.one)} ${i + 1}, ${placeWords(p, w, onLesson)}.`}
        aria-pressed={markable ? marked : undefined}
        disabled={!canPress(lab, i)}
        onClick={() => press(i)}
        className={`item ${p === "nets" ? "item-built" : "item-supply"} ${marked ? "lab-marked" : ""} ${question === "extras" && p === "pile" ? "lab-cue" : ""}`}
      >
        <ItemArt art={art} />
        {marked && (
          <span aria-hidden="true" className="item-check">
            ✓
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={root}
      className="lab grid grid-cols-1 gap-3 sm:gap-4"
      data-lab-step={lab.step}
    >
      <div>
        <p className="text-sm font-bold text-muted">
          Step {lab.step} of {LAST_STEP}
        </p>
        <h2
          ref={heading}
          tabIndex={-1}
          className="text-xl font-extrabold sm:text-2xl"
        >
          {STEP_TITLE[lab.step]}
        </h2>
        {/* While a question is open it carries the task, so the instruction
            steps aside and the question stays close to the objects. */}
        {!question && (
          <p
            key={lab.step}
            className="lab-reveal mt-1 text-lg"
            data-testid="lab-instruction"
          >
            {instruction(lab, w)}
          </p>
        )}
      </div>

      <div
        ref={board}
        // Two columns at most: a panel must always fit a full row of five, or
        // the rack stops reading as two rows of five.
        className="lab-board grid grid-cols-1 gap-3 min-[47rem]:grid-cols-2 sm:gap-4"
      >
        <section
          className={`field-panel field-supply ${loose.length === 0 && lab.step > 1 ? "lab-pile-empty" : ""}`}
          aria-labelledby="lab-pile-label"
        >
          <h3 id="lab-pile-label" className="tray-label">
            {onLesson ? `Outside the ${w.rack}` : `${w.guide}'s ${w.many}`}
          </h3>
          <div
            className="lab-five min-h-14"
            role="group"
            aria-labelledby="lab-pile-label"
          >
            {loose.map(ball)}
          </div>
        </section>
        {onLesson && (
          <section
            className="field-panel lab-rack"
            aria-labelledby="lab-rack-label"
          >
            <h3 id="lab-rack-label" className="tray-label">
              {cap(w.rack)} (holds {RACK})
            </h3>
            <div
              className="lab-five"
              role="group"
              aria-labelledby="lab-rack-label"
            >
              {Array.from({ length: RACK }, (_, k) =>
                racked[k] !== undefined ? (
                  ball(racked[k])
                ) : (
                  <span
                    key={`e${k}`}
                    aria-hidden="true"
                    className="item item-slot"
                  />
                ),
              )}
            </div>
          </section>
        )}
        {/* Step 1 is only about the ten; the nets join from step 2, which also
            keeps the question close to the balls on a phone. */}
        {lab.step > 1 && (
          <section
            className={`field-panel field-built lab-reveal ${onLesson ? "min-[47rem]:col-span-2" : ""}`}
            aria-labelledby="lab-nets-label"
          >
            <h3 id="lab-nets-label" className="tray-label">
              At {w.destination}
              {showNetsCount
                ? `: ${atNets.length} of ${problem.take}`
                : ` (${problem.take} spots)`}
            </h3>
            <div
              className="lab-nets min-h-14"
              role="group"
              aria-labelledby="lab-nets-label"
            >
              <div className="lab-part">{netsExtras.map(ball)}</div>
              {netsFromTen.length > 0 && (
                <div className="lab-part lab-split">
                  {netsFromTen.map(ball)}
                </div>
              )}
              <div className="lab-part">
                {Array.from(
                  { length: Math.max(0, problem.take - atNets.length) },
                  (_, k) => (
                    <span
                      key={`t${k}`}
                      aria-hidden="true"
                      className="item item-target"
                    />
                  ),
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Moves are announced here and nowhere else. What a sighted learner
          needs is the objects themselves and the counts in the panel titles,
          so this stays out of sight rather than repeating them in a card. */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="lab-status"
      >
        {said}
      </div>

      {question && (
        <LabQuestion
          key={`${lab.step}-${question}-${lab.history.length}`}
          lab={lab}
          question={question}
          words={w}
          onCheck={(n) => commit(chooseAnswer(latest.current, question, n))}
        />
      )}

      {lab.step === 1 && isRight(lab, "extras") && (
        <Bond whole={problem.total} parts={[RACK, shownBy(lab, "extras")]} />
      )}
      {lab.step === 2 && isRight(lab, "more") && (
        <Bond
          whole={problem.take}
          parts={[countAt(lab, "nets"), shownBy(lab, "more")]}
        />
      )}
      {summary && (
        <div className="notice lab-reveal" data-testid="lab-result">
          <p className="font-semibold">
            You made a ten and {summary.extras} extras. You took the{" "}
            {summary.extras} extras, then {summary.fromRack} more from the ten.{" "}
            {summary.total} take away {summary.take} leaves {summary.left}.
          </p>
          <p className="mt-1">
            This is one way to do it. Taking any {summary.take} {w.many} from{" "}
            {summary.total} leaves {summary.left} too.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        {lab.step < LAST_STEP && (
          <button
            ref={nextButton}
            type="button"
            className="btn btn-primary"
            aria-disabled={needs !== null}
            aria-describedby={needs ? "lab-next-needs" : undefined}
            onClick={() => {
              if (nextNeeds(latest.current) !== null) return;
              remember();
              setSaid("");
              commit(advance(latest.current));
            }}
          >
            Next step
          </button>
        )}
        {lab.history.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              remember();
              setSaid("");
              commit(back(latest.current));
            }}
          >
            Back a step
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            remember();
            setSaid("");
            commit(initialLab());
            heading.current?.focus();
          }}
        >
          Start again
        </button>
        <Link href="/cricket" className="btn btn-secondary">
          Leave the activity
        </Link>
        {needs && (needs !== "last-step" || !openQuestion(lab)) && (
          <p id="lab-next-needs" className="w-full text-sm text-muted">
            {needsWords(needs, lab, w)}
          </p>
        )}
      </div>
    </div>
  );
}

interface LabQuestionProps {
  lab: LabState;
  question: Question;
  words: LabWords;
  onCheck: (n: number) => void;
}

/** One question at a time, answered with the same number picker as the mission. */
function LabQuestion({ lab, question, words: w, onCheck }: LabQuestionProps) {
  const [pick, setPick] = useState<number | null>(null);
  const given = lab.answers[question];
  const right = isRight(lab, question);
  const done = useRef<HTMLParagraphElement>(null);
  const counting = countingAid(question, w);
  const support = supportAfterMixUps(question, triesFor(lab, question), w);
  // A right answer replaces the controls with the answer itself, so keyboard
  // focus moves to the confirmation (read once; it is not a live region). Only
  // when the answer turns right here, not when a step is restored already
  // answered: then the step heading keeps focus.
  const wasRight = useRef(right);
  useEffect(() => {
    if (right && !wasRight.current) done.current?.focus();
    wasRight.current = right;
  }, [right]);
  if (right && given !== undefined)
    return (
      <div
        className="card grid grid-cols-1 gap-2 p-4"
        data-lab-question={question}
      >
        <p className="text-lg font-semibold">{legendFor(question, lab, w)}</p>
        <p>Your answer: {given}</p>
        <p
          ref={done}
          tabIndex={-1}
          className="font-semibold"
          data-testid="lab-feedback"
          data-right="true"
        >
          {feedbackFor(question, given, lab, w)}
        </p>
      </div>
    );
  return (
    <form
      className="card grid grid-cols-1 gap-3 p-4"
      data-lab-question={question}
      onSubmit={(e) => {
        e.preventDefault();
        if (pick !== null) onCheck(pick);
      }}
    >
      <AnswerPicker
        legend={legendFor(question, lab, w)}
        // 0 to the starting amount for every question: the range never hints at
        // the number, and the likely mix-ups (10, the start, the take) can be chosen.
        max={lab.problem.total}
        value={pick}
        onChange={setPick}
        disabled={false}
      />
      {counting && (
        <p className="text-sm text-muted" data-testid="lab-count-aid">
          {counting}
        </p>
      )}
      <div>
        <button
          type="submit"
          className="btn btn-primary"
          aria-disabled={pick === null}
        >
          Check
        </button>
      </div>
      <div role="status" aria-live="polite">
        {given !== undefined && (
          <p data-testid="lab-feedback" data-right="false">
            {feedbackFor(question, given, lab, w)}
            {support && <> {support}</>}
          </p>
        )}
      </div>
    </form>
  );
}

/** A part-whole picture of a split the learner has just found: whole, then its two parts. */
function Bond({ whole, parts }: { whole: number; parts: [number, number] }) {
  return (
    // The same words are announced by the feedback line, so this is hidden from
    // assistive technology to avoid saying it twice.
    <figure
      className="lab-bond lab-reveal"
      data-testid="lab-bond"
      aria-hidden="true"
    >
      <span className="lab-bond-whole">{whole}</span>
      <span className="lab-bond-is">is</span>
      <span className="lab-bond-part">{parts[0]}</span>
      <span className="lab-bond-is">and</span>
      <span className="lab-bond-part">{parts[1]}</span>
    </figure>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n: number, w: LabWords) => `${n} ${n === 1 ? w.one : w.many}`;

/** The unguided try has no rack, so its waiting objects are "with the guide". */
function placeWords(p: Place, w: LabWords, hasRack: boolean) {
  return p === "pile"
    ? hasRack
      ? `outside the ${w.rack}`
      : `with ${w.guide}`
    : p === "rack"
      ? `in the ${w.rack}`
      : `at ${w.destination}`;
}

/** Where an object went, for the announcement ("moved to the rack"). */
function moveWords(p: Place, w: LabWords, hasRack: boolean) {
  return p === "pile"
    ? hasRack
      ? `back outside the ${w.rack}`
      : `back to ${w.guide}`
    : p === "rack"
      ? `to the ${w.rack}`
      : `to ${w.destination}`;
}

/**
 * The one sentence a move adds for assistive technology: what moved and where,
 * plus a count only where the picture already shows it. It never states a
 * quantity the learner is still being asked for.
 */
function announce(s: LabState, i: number, w: LabWords): string {
  const to = s.places[i];
  const hasRack = s.step < LAST_STEP;
  let text = `${cap(w.one)} ${i + 1} moved ${moveWords(to, w, hasRack)}.`;
  if (to === "rack" && countAt(s, "rack") === RACK)
    text += ` The ${w.rack} is full.`;
  if (s.step !== 1 && s.step !== 4 && countAt(s, "nets") > 0)
    text += ` ${countAt(s, "nets")} of ${s.problem.take} spots at ${w.destination} are filled.`;
  return text;
}

function instruction(s: LabState, w: LabWords): string {
  const { total, take } = s.problem;
  switch (s.step) {
    case 1:
      return `${w.guide} has ${total} ${w.many}. Tap ${w.many} to put them in the ${w.rack}. A full ${w.rack} holds ${RACK}. Tap one in the ${w.rack} to put it back.`;
    case 2:
      return `${w.guide} needs ${take} ${w.many} at ${w.destination}. One way to start: send the ${w.many} outside the ${w.rack} first. Tap each one.`;
    case 3:
      // The number to take is the one the learner just found, so it is not repeated here.
      return `You found how many more ${w.guide} needs. Take that many ${w.many} from the ${w.rack} to fill the empty spots at ${w.destination}.`;
    case 4:
      return `Look at the ${w.rack}.`;
    case 5:
      return `A new one, with no help. ${w.guide} has ${total} ${w.many}. Send ${take} to ${w.destination}, then work out how many are left. Tap one at ${w.destination} to put it back.`;
  }
}

function legendFor(q: Question, s: LabState, w: LabWords): string {
  switch (q) {
    case "extras":
      return `The ${w.rack} is full. How many ${w.many} are outside it?`;
    case "more":
      return `How many more ${w.many} does ${w.guide} need?`;
    case "left":
      return `How many ${w.many} are still in the ${w.rack}?`;
    case "apply":
      return `${s.problem.total} ${w.many}, ${s.problem.take} at ${w.destination}. How many ${w.many} are left?`;
  }
}

/**
 * Local feedback, never a score. Wrong answers that match a number on screen
 * get a pointer to which group that number belongs to (draft hypotheses about
 * likely confusions, pending educator review). The unguided try gets no hint.
 */
function feedbackFor(
  q: Question,
  given: number,
  s: LabState,
  w: LabWords,
): string {
  const shown = shownBy(s, q);
  const nets = countAt(s, "nets");
  const { total, take } = s.problem;
  if (given === shown) {
    switch (q) {
      case "extras":
        return `Yes. ${total} is ${RACK} and ${shown}.`;
      case "more":
        return `Yes. ${take} is ${nets} and ${shown}.`;
      case "left":
        return `Yes. ${plural(shown, w)} are still in the ${w.rack}.`;
      case "apply":
        return `Yes, that matches the ${w.many} that are left. That is the end of this draft activity.`;
    }
  }
  if (q === "apply")
    return `That does not match yet. Look again at the ${w.many} that are not at ${w.destination}.`;
  if (q === "extras") {
    if (given === RACK)
      return `${RACK} is how many are in the ${w.rack}. How many are outside it?`;
    if (given === total)
      return `${total} is all of the ${w.many}. How many are outside the ${w.rack}?`;
    return `Not quite. Count the ${w.many} outside the ${w.rack}.`;
  }
  if (q === "more") {
    if (given === take)
      return `${take} is how many ${w.guide} needs in all. Some are there already. How many spots are still empty?`;
    if (given === nets)
      return `${nets} are at ${w.destination} already. How many spots are still empty?`;
    return `Not quite. Count the empty spots at ${w.destination}.`;
  }
  if (given === nets)
    return `${nets} is how many went to ${w.destination}. How many are still in the ${w.rack}?`;
  if (given === total)
    return `${total} is how many ${w.guide} had at the start. Some went to ${w.destination}.`;
  if (given === RACK)
    return `Look again: some spots in the ${w.rack} are empty now.`;
  return `Not quite. Count the ${w.many} still in the ${w.rack}. You can tap each one to mark it.`;
}

/** What the learner can do to count; the objects mark, nothing tells the number. */
function countingAid(q: Question, w: LabWords): string | null {
  switch (q) {
    case "extras":
      return `Tap each ${w.one} outside the ${w.rack} to mark it as you count.`;
    case "left":
      return `Tap each ${w.one} in the ${w.rack} to mark it as you count.`;
    case "more":
      return `Count the empty spots at ${w.destination}.`;
    case "apply":
      return null;
  }
}

/**
 * More support after repeated mix-ups on the same picture. It points at ways
 * to count or to get help and never states the number. Draft hypothesis for
 * educator review (packet 6C, question 8); the unguided try gets none.
 */
function supportAfterMixUps(
  q: Question,
  tries: number,
  w: LabWords,
): string | null {
  if (q === "apply" || tries < 2) return null;
  const count =
    q === "more"
      ? `Count the empty spots at ${w.destination} one at a time, touching each one.`
      : `Count them one at a time and tap each ${w.one} as you count it.`;
  return tries < 3
    ? count
    : `${count} A grown-up can count with you, or you can use Back a step.`;
}

function needsWords(n: Needs, s: LabState, w: LabWords): string {
  switch (n) {
    case "fill-rack":
      return `To go on, fill the ${w.rack}.`;
    case "move-extras":
      return `To go on, send every ${w.one} outside the ${w.rack} to ${w.destination}.`;
    case "fill-nets":
      return `To go on, fill all ${s.problem.take} spots at ${w.destination}.`;
    case "answer":
      return "To go on, answer the question.";
    case "last-step":
      return `The question appears when ${s.problem.take} ${w.many} are at ${w.destination}.`;
  }
}
