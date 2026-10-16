import { useEffect, useRef } from "react";

export type OutcomeKind =
  | "correct"
  | "easier-practice"
  | "skipped"
  | "learner-stopped"
  | "unproductive";

const COPY: Record<
  OutcomeKind,
  { title: string; body: (answer: number | null) => string }
> = {
  correct: {
    title: "The bridge is fixed!",
    body: (a) =>
      `You said ${a ?? "that many"} blocks were left, and that is right. Thank you for helping the builder.`,
  },
  "easier-practice": {
    title: "Let's try something a little easier next time",
    body: () =>
      "This bridge was a big one. In a full version, you would get an easier bridge to practice first. This demo does not have that yet.",
  },
  skipped: {
    title: "We skipped this bridge",
    body: () => "That is okay. You can try it again whenever you like.",
  },
  "learner-stopped": {
    title: "Taking a break",
    body: () =>
      "Good work today. You can start this bridge again whenever you like.",
  },
  unproductive: {
    title: "Let's take a break",
    body: () =>
      "You worked hard on this one. A grown-up can help, or you can start the bridge again.",
  },
};

interface MissionOutcomeProps {
  kind: OutcomeKind;
  answer: number | null;
  onRestart: () => void;
}

/** End-of-mission screen. Guided practice only: it shows no score, streak or mastery claim. */
export function MissionOutcome({
  kind,
  answer,
  onRestart,
}: MissionOutcomeProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const copy = COPY[kind];
  return (
    <section
      aria-labelledby="outcome-heading"
      className="rounded-lg border-2 border-border p-5"
    >
      <h2
        id="outcome-heading"
        ref={heading}
        tabIndex={-1}
        className="text-2xl font-bold"
      >
        {copy.title}
      </h2>
      <p className="mt-3 text-lg">{copy.body(answer)}</p>
      <p className="mt-3 text-sm text-muted">
        This is practice with help. It is not a test and does not measure
        mastery.
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-5 min-h-12 rounded-md bg-sky-800 px-6 text-lg font-semibold text-white"
      >
        Start over
      </button>
    </section>
  );
}
