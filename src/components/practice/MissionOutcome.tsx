import Link from "next/link";
import { useEffect, useRef } from "react";
import { THEMES, type ThemeConfig } from "@/themes";

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

/** A still, decorative badge. It claims nothing; the heading says what happened. */
function Celebration() {
  return (
    <svg
      viewBox="0 0 120 60"
      aria-hidden="true"
      focusable="false"
      className="mb-3 h-14 w-auto"
    >
      <circle cx="60" cy="30" r="24" fill="var(--accent)" />
      <path
        d="M48 31 l9 9 l17 -19"
        fill="none"
        stroke="var(--accent-fg)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 20 l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z M104 14 l2 5 l5 1 l-4 4 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -4 l5 -1z"
        fill="var(--highlight)"
      />
    </svg>
  );
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
  const other = THEMES.find((t) => t.id !== theme.id);
  return (
    <section
      aria-labelledby="outcome-heading"
      className="card scene-enter p-5 sm:p-7"
    >
      {kind === "correct" && <Celebration />}
      <h2
        id="outcome-heading"
        ref={heading}
        tabIndex={-1}
        className="text-2xl font-extrabold sm:text-3xl"
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
      {kind === "correct" && other !== undefined && (
        <p className="mt-3">
          Or visit another world:{" "}
          <Link href={other.href} className="underline">
            {other.displayName}
          </Link>{" "}
          (a new, separate practice).
        </p>
      )}
      <button
        type="button"
        onClick={onRestart}
        className="btn btn-primary mt-5"
      >
        Start over
      </button>
    </section>
  );
}
