import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ThemeConfig } from "@/themes";

export type OutcomeKind =
  | "correct"
  | "easier-practice"
  | "skipped"
  | "learner-stopped"
  | "unproductive";

function copyFor(kind: OutcomeKind, theme: ThemeConfig, answer: number | null) {
  switch (kind) {
    case "correct":
      return {
        title: theme.outcomeTitle,
        body: `You said ${answer ?? "that many"} ${theme.vocabulary.plural} were left, and that is right. ${theme.outcomeThanks}`,
      };
    case "easier-practice":
      return {
        title: "Let's try something a little easier next time",
        body: "This one was a big challenge. In a full version, you would get an easier one to practice first. This demo does not have that yet.",
      };
    case "skipped":
      return {
        title: "We skipped this challenge",
        body: "That is okay. You can try it again whenever you like.",
      };
    case "learner-stopped":
      return {
        title: "Taking a break",
        body: "Good work today. You can start this mission again whenever you like.",
      };
    case "unproductive":
      return {
        title: "Let's take a break",
        body: "You worked hard on this one. A grown-up can help, or you can start again.",
      };
  }
}

interface MissionOutcomeProps {
  theme: ThemeConfig;
  kind: OutcomeKind;
  answer: number | null;
  onRestart: () => void;
}

/** End-of-mission screen. Guided practice only: it shows no score, streak or mastery claim. */
export function MissionOutcome({
  theme,
  kind,
  answer,
  onRestart,
}: MissionOutcomeProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const copy = copyFor(kind, theme, answer);
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
      <p className="mt-3 text-lg">{copy.body}</p>
      <p className="mt-3 text-sm text-muted">
        This is practice with help. It is not a test and does not measure
        mastery.
      </p>
      {kind === "correct" && (
        <p className="mt-3">
          Want to try some on your own?{" "}
          <Link href="/assessment" className="underline">
            Independent check
          </Link>{" "}
          (separate from this practice).
        </p>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="mt-5 min-h-12 rounded-md bg-(--accent) px-6 text-lg font-semibold text-(--accent-fg)"
      >
        Start over
      </button>
    </section>
  );
}
