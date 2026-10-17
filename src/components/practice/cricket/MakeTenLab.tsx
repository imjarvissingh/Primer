"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ItemArtId } from "@/themes";
import {
  advance,
  back,
  canPress,
  chooseAnswer,
  countAt,
  initialLab,
  isRight,
  LAST_STEP,
  nextNeeds,
  openQuestion,
  pressBall,
  RACK,
  recap,
  shownBy,
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
  // The last thing that happened, for the live region (moves, marks).
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
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
    heading.current?.focus();
  }, [lab.step, lab.history.length]);

  // After an object moves its button is replaced, so focus would fall to the
  // page. Keep it where the learner is working: the next object that can still
  // move from the same place, else the question that just opened, else the
  // moved object, else "Next step".
  const refocus = useRef<{ ball: number; from: Place } | null>(null);
  // Where the moved object was, so it can visibly travel (decorative only).
  const flyFrom = useRef<{ ball: number; rect: DOMRect } | null>(null);
  useLayoutEffect(() => {
    const fly = flyFrom.current;
    flyFrom.current = null;
    if (!fly || reducedMotion()) return;
    const el = root.current?.querySelector<HTMLElement>(
      `button[data-lab-ball="${fly.ball}"]`,
    );
    if (!el || typeof el.animate !== "function") return;
    const now = el.getBoundingClientRect();
    const dx = fly.rect.left - now.left;
    const dy = fly.rect.top - now.top;
    if (dx === 0 && dy === 0) return;
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(1.12)`, zIndex: 5 },
        { transform: "translate(0, 0) scale(1)", zIndex: 5 },
      ],
      { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.25, 1)" },
    );
  }, [lab.places]);
  useEffect(() => {
    const want = refocus.current;
    refocus.current = null;
    if (!want || !root.current) return;
    const q = (sel: string) => root.current?.querySelector<HTMLElement>(sel);
    (
      q(`button[data-lab-place="${want.from}"]:not([disabled])`) ??
      q("[data-lab-question] input:not([disabled])") ??
      (nextNeeds(lab) === null ? nextButton.current : null) ??
      q(`button[data-lab-ball="${want.ball}"]:not([disabled])`) ??
      nextButton.current
    )?.focus();
  }, [lab]);

  const press = (i: number) => {
    const next = pressBall(lab, i);
    if (next === lab) return;
    const from = lab.places[i];
    const to = next.places[i];
    if (from !== to) {
      const el = root.current?.querySelector<HTMLElement>(
        `button[data-lab-ball="${i + 1}"]`,
      );
      if (el)
        flyFrom.current = { ball: i + 1, rect: el.getBoundingClientRect() };
      refocus.current = { ball: i + 1, from };
      setSaid(
        `${cap(w.one)} ${i + 1} moved ${moveWords(to, w, lab.step < LAST_STEP)}.`,
      );
    } else {
      // Marking: the button's own pressed state is the one announcement.
      setSaid("");
    }
    setLab(next);
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
  const question = openQuestion(lab);
  const needs = nextNeeds(lab);
  const summary = recap(lab);

  const ball = (i: number) => {
    const p = lab.places[i];
    const marked = lab.step === 4 && lab.marked.includes(i);
    return (
      <button
        key={i}
        type="button"
        data-lab-ball={i + 1}
        data-lab-place={p}
        aria-label={`${cap(w.one)} ${i + 1}, ${placeWords(p, w, onLesson)}.`}
        aria-pressed={lab.step === 4 && p === "rack" ? marked : undefined}
        disabled={!canPress(lab, i)}
        onClick={() => press(i)}
        className={`item ${p === "nets" ? "item-built" : "item-supply"} ${marked ? "lab-marked" : ""}`}
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
      className="lab grid grid-cols-1 gap-4"
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
        <p className="mt-1 text-lg" data-testid="lab-instruction">
          {instruction(lab, w)}
        </p>
      </div>

      <div
        // Two columns at most: a panel must always fit a full row of five, or
        // the rack stops reading as two rows of five.
        className="lab-board grid grid-cols-1 gap-4 min-[47rem]:grid-cols-2"
      >
        <section
          className="field-panel field-supply"
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
            className={`field-panel field-built ${onLesson ? "min-[47rem]:col-span-2" : ""}`}
            aria-labelledby="lab-nets-label"
          >
            <h3 id="lab-nets-label" className="tray-label">
              At {w.destination} ({problem.take} spots)
            </h3>
            <div
              className="flex min-h-14 flex-wrap gap-2"
              role="group"
              aria-labelledby="lab-nets-label"
            >
              {netsExtras.map(ball)}
              {netsFromTen.length > 0 && (
                <span aria-hidden="true" className="lab-split" />
              )}
              {netsFromTen.map(ball)}
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
          </section>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="card p-3"
        data-testid="lab-status"
      >
        <p>{said}</p>
        {lab.step !== 1 && lab.step !== 4 && (
          <p>
            At {w.destination}: {atNets.length} of {problem.take}.
          </p>
        )}
        {lab.step === 1 && countAt(lab, "rack") === RACK && (
          <p>The {w.rack} is full.</p>
        )}
      </div>

      {question && (
        <LabQuestion
          key={`${lab.step}-${question}-${lab.history.length}`}
          lab={lab}
          question={question}
          words={w}
          onCheck={(n) => setLab((s) => chooseAnswer(s, question, n))}
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
              if (needs === null) setSaid("");
              setLab((s) => advance(s));
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
              setSaid("");
              setLab((s) => back(s));
            }}
          >
            Back a step
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setSaid("");
            setLab(initialLab());
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
  // A right answer replaces the controls with the answer itself, so keyboard
  // focus moves to the confirmation (read once; it is not a live region).
  useEffect(() => {
    if (right) done.current?.focus();
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

function instruction(s: LabState, w: LabWords): string {
  const { total, take } = s.problem;
  switch (s.step) {
    case 1:
      return `${w.guide} has ${total} ${w.many}. Tap ${w.many} to put them in the ${w.rack}. A full ${w.rack} holds ${RACK}.`;
    case 2:
      return `${w.guide} needs ${take} ${w.many} at ${w.destination}. One way to start: send the ${w.many} outside the ${w.rack} first. Tap each one.`;
    case 3:
      // The number the learner found in step 2 (only reachable once it was right).
      return `Now take ${plural(s.answers.more ?? 0, w)} from the ${w.rack} and send them to ${w.destination}.`;
    case 4:
      return `Look at the ${w.rack}. You can tap each ${w.one} to mark it while you count.`;
    case 5:
      return `A new one, with no help. ${w.guide} has ${total} ${w.many}. Send ${take} to ${w.destination}, then work out how many are left.`;
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
