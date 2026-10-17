"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  advance,
  allCounted,
  canAdvance,
  canPress,
  chooseGuess,
  countAt,
  initialLab,
  LAB_EXTRAS,
  LAB_RACK,
  LAB_REST,
  LAB_TAKE,
  LAB_TOTAL,
  pressBall,
  type LabState,
  type Place,
} from "@/lib/make-ten-lab";
import { ItemArt } from "../ItemArt";

const STEP_TITLE: Record<LabState["step"], string> = {
  1: "Step 1: Fill the rack",
  2: "Step 2: Take the extras first",
  3: "Step 3: Take the rest from the ten",
  4: "Step 4: Count what is left in the rack",
};

/**
 * A draft, learner-driven walk through one make-ten way of taking balls away.
 * Four steps, each needing a real action: fill a rack, move the extras, work
 * out how many more are needed, move them, and count what remains. State is
 * local and rules live in src/lib/make-ten-lab.ts. It scores nothing.
 */
export function MakeTenLab() {
  const [lab, setLab] = useState<LabState>(initialLab);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  // Move focus to the new step's heading once, when the step changes.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [lab.step]);

  const place = (p: Place) =>
    lab.places.map((w, i) => [w, i] as const).filter(([w]) => w === p);
  const label = (i: number, p: Place) => {
    const where =
      p === "pile"
        ? "in the pile"
        : p === "rack"
          ? "in the rack"
          : "at the nets";
    return `Ball ${i + 1}, ${where}.`;
  };
  const ball = (i: number, p: Place) => (
    <button
      key={i}
      type="button"
      data-lab-ball={i + 1}
      data-lab-place={p}
      aria-label={label(i, p)}
      aria-pressed={
        lab.step === 4 && p === "rack" ? lab.counted.includes(i) : undefined
      }
      disabled={!canPress(lab, i)}
      onClick={() => setLab((s) => pressBall(s, i))}
      className={`item ${p === "nets" ? "item-built" : "item-supply"} ${
        lab.step === 4 && lab.counted.includes(i) ? "lab-counted" : ""
      }`}
    >
      <ItemArt art="cricket-ball" />
    </button>
  );

  const rackSlots = Array.from({ length: LAB_RACK }, (_, k) => k);
  const racked = place("rack");
  const loose = place("pile");
  const atNets = place("nets");
  const netsCount = atNets.length;

  return (
    <div className="lab grid grid-cols-1 gap-4" data-lab-step={lab.step}>
      <h2
        ref={heading}
        tabIndex={-1}
        className="text-xl font-extrabold sm:text-2xl"
      >
        {STEP_TITLE[lab.step]}
      </h2>
      <p className="text-lg" data-testid="lab-instruction">
        {lab.step === 1 &&
          `Coach Bails has ${LAB_TOTAL} balls. Tap balls to fill the rack until it is full. A full rack holds ${LAB_RACK}.`}
        {lab.step === 2 &&
          `The coach needs ${LAB_TAKE} balls at the nets. Start with the balls outside the rack: tap each one to send it to the nets.`}
        {lab.step === 3 &&
          `Now take the rest from the full rack. Tap balls in the rack to send them to the nets until all ${LAB_TAKE} spots are full.`}
        {lab.step === 4 &&
          "Tap each ball still in the rack to count it. Then look at what you counted."}
      </p>

      <div className="lab-board grid grid-cols-1 gap-4 min-[47rem]:grid-cols-3">
        <section className="field-panel field-supply" aria-label="Loose balls">
          <h3 className="tray-label">Loose balls</h3>
          <div className="tray-row flex min-h-14 flex-wrap gap-2">
            {loose.map(([, i]) => ball(i, "pile"))}
          </div>
        </section>
        <section className="field-panel lab-rack" aria-label="The rack">
          <h3 className="tray-label">Rack of ten</h3>
          <div className="lab-rack-grid" role="group" aria-label="Rack of ten">
            {rackSlots.map((k) =>
              racked[k] ? (
                ball(racked[k][1], "rack")
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
        <section className="field-panel field-built" aria-label="At the nets">
          <h3 className="tray-label">At the nets</h3>
          <div className="flex min-h-14 flex-wrap gap-2">
            {atNets.map(([, i]) => ball(i, "nets"))}
            {Array.from(
              { length: Math.max(0, LAB_TAKE - netsCount) },
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
      </div>

      <div
        role="status"
        aria-live="polite"
        className="card p-3"
        data-testid="lab-status"
      >
        {lab.step === 1 && (
          <p>
            In the rack: {countAt(lab, "rack")}. Outside the rack:{" "}
            {countAt(lab, "pile")}.
            {canAdvance(lab) &&
              ` The rack is full. ${countAt(lab, "pile")} balls are outside it.`}
          </p>
        )}
        {lab.step === 2 && (
          <p>
            At the nets: {netsCount} of {LAB_TAKE}.{" "}
            {countAt(lab, "pile") === 0 && lab.guess === null
              ? "Every loose ball is at the nets. Look at the empty spots."
              : ""}
          </p>
        )}
        {lab.step === 3 && (
          <p>
            At the nets: {netsCount} of {LAB_TAKE}.
          </p>
        )}
        {lab.step === 4 && (
          <p>
            Counted: {lab.counted.length}.
            {allCounted(lab) &&
              ` You counted every ball in the rack, and the loose balls were all taken: that is what is left.`}
          </p>
        )}
      </div>

      {lab.step === 2 && countAt(lab, "pile") === 0 && (
        <fieldset className="card p-3">
          <legend className="px-1 text-lg font-semibold">
            How many more balls does the coach need?
          </legend>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={lab.guess === n}
                onClick={() => setLab((s) => chooseGuess(s, n))}
                className={`answer-chip lab-guess ${lab.guess === n ? "lab-guess-on" : ""}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div role="status" aria-live="polite">
            {lab.guess !== null && (
              <p className="mt-2" data-testid="lab-guess-feedback">
                {lab.guess === LAB_REST
                  ? `Yes. ${LAB_EXTRAS} and ${LAB_REST} make ${LAB_TAKE}. Take ${LAB_REST} more.`
                  : `Look at the nets. Count the empty spots. How many are still empty?`}
              </p>
            )}
          </div>
          {lab.guess !== null && lab.guess !== LAB_REST && (
            <button
              type="button"
              className="btn btn-secondary mt-2"
              onClick={() => setLab((s) => ({ ...s, guess: null }))}
            >
              Try again
            </button>
          )}
        </fieldset>
      )}

      {lab.step === 4 && allCounted(lab) && (
        <p className="notice font-semibold" data-testid="lab-result">
          {LAB_TOTAL} take away {LAB_TAKE}: you took {LAB_EXTRAS}, then{" "}
          {LAB_REST} more from the ten, and counted {lab.counted.length} left.
          This is one way. Taking any {LAB_TAKE} balls leaves the same number.
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {lab.step < 4 && (
          <button
            type="button"
            className="btn btn-primary"
            aria-disabled={!canAdvance(lab)}
            onClick={() => setLab((s) => advance(s))}
          >
            Next step
          </button>
        )}
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setLab(initialLab())}
        >
          Start the activity again
        </button>
        <Link href="/cricket" className="btn btn-secondary">
          Back to Cricket Academy
        </Link>
      </div>
    </div>
  );
}
