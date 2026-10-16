"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  PRACTICE_MISSION_ID,
  type PracticeFeedback,
  type PublicChallenge,
} from "@/lib/practice-protocol";
import { AnswerPicker } from "./AnswerPicker";
import { ConstructionField } from "./ConstructionField";
import { FeedbackPanel } from "./FeedbackPanel";
import { MissionOutcome, type OutcomeKind } from "./MissionOutcome";
import { presentHint } from "./hints";
import { capitalize, countOf, fillStory, type ThemeConfig } from "@/themes";
import { sendPractice } from "./api";

interface Session {
  id: string;
  seq: number;
  challenge: PublicChallenge;
}

type Screen =
  | { name: "intro" }
  | { name: "playing"; session: Session }
  | { name: "outcome"; kind: OutcomeKind };

const primaryButton =
  "min-h-12 rounded-md bg-(--accent) px-6 text-lg font-semibold text-(--accent-fg) aria-disabled:opacity-60";
const secondaryButton =
  "min-h-12 rounded-md border-2 border-border px-4 font-semibold";

interface PracticeMissionProps {
  theme: ThemeConfig;
  /** Decorative artwork for this theme (hidden from assistive tech). */
  scene: ReactNode;
}

/** One shared mission for every theme; the theme only changes words and looks. */
export function PracticeMission(props: PracticeMissionProps) {
  return (
    <div className={`${props.theme.className} mission-panel`}>
      <MissionBody {...props} />
    </div>
  );
}

/**
 * Owns what the learner sees: which screen, which blocks are on the bridge,
 * and the latest feedback. It decides nothing about correctness. Every answer
 * is sent to the server, which scores it and says what feedback to show.
 */
function MissionBody({ theme, scene }: PracticeMissionProps) {
  const [screen, setScreen] = useState<Screen>({ name: "intro" });
  const [used, setUsed] = useState<ReadonlySet<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [networkProblem, setNetworkProblem] = useState(false);
  const [busy, setBusy] = useState(false);
  // A ref, not state, so a rapid second click is blocked before React re-renders.
  const inFlight = useRef(false);
  // Bumped on restart so a late reply for an abandoned session is ignored.
  const generation = useRef(0);

  function resetLocal() {
    setUsed(new Set());
    setSelected(null);
    setSubmitted(null);
    setFeedback(null);
    setNetworkProblem(false);
  }

  async function guarded(task: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await task();
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function begin() {
    return guarded(async () => {
      const mine = ++generation.current;
      resetLocal();
      const res = await sendPractice({
        action: "start",
        missionId: PRACTICE_MISSION_ID,
      });
      if (mine !== generation.current) return;
      if (res.ok && "sessionId" in res) {
        setScreen({
          name: "playing",
          session: {
            id: res.sessionId,
            seq: res.seq,
            challenge: res.challenge,
          },
        });
      } else {
        setNetworkProblem(true);
      }
    });
  }

  function restart() {
    generation.current += 1;
    resetLocal();
    setScreen({ name: "intro" });
  }

  function act(session: Session, request: "attempt" | "skip" | "stop") {
    return guarded(async () => {
      const mine = generation.current;
      setNetworkProblem(false);
      const base = { sessionId: session.id, seq: session.seq };
      const res = await sendPractice(
        request === "attempt"
          ? { action: "attempt", ...base, answer: selected }
          : { action: request, ...base },
      );
      if (mine !== generation.current) return;
      if (!res.ok) {
        // Lost, expired or out-of-step session: the only safe move is a fresh start.
        if (res.error === "network") setNetworkProblem(true);
        else restart();
        return;
      }
      if (!("feedback" in res)) return;

      const next = res.feedback;
      if (res.sessionStatus === "finished") {
        setSubmitted(selected);
        setScreen({ name: "outcome", kind: outcomeFor(next) });
        return;
      }
      setScreen({ name: "playing", session: { ...session, seq: res.seq } });
      setFeedback(next);
      if (next.kind !== "ask-again") setSelected(null);
    });
  }

  function toggle(block: number) {
    setUsed((prev) => {
      const next = new Set(prev);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  }

  if (screen.name === "intro") {
    return (
      <section aria-labelledby="intro-heading" className="grid gap-4">
        {scene}
        <h2 id="intro-heading" className="text-2xl font-bold">
          {theme.missionTitle}
        </h2>
        <p className="text-lg">{theme.intro}</p>
        <div role="status" aria-live="polite">
          {networkProblem && (
            <p className="rounded-lg border-2 border-border p-3">
              We could not start the activity. Please try again.
            </p>
          )}
        </div>
        <div>
          <button
            type="button"
            aria-disabled={busy}
            onClick={() => (busy ? undefined : begin())}
            className={primaryButton}
          >
            {theme.startLabel}
          </button>
        </div>
      </section>
    );
  }

  if (screen.name === "outcome") {
    return (
      <MissionOutcome
        theme={theme}
        kind={screen.kind}
        answer={submitted}
        onRestart={restart}
      />
    );
  }

  const { session } = screen;
  const v = theme.vocabulary;
  const { challenge } = session;
  const ready = used.size === challenge.takeAway;
  const hintCue =
    feedback?.kind === "hint"
      ? presentHint(feedback.hintId, feedback.steps, challenge.start, v)
          .highlightAbove
      : null;

  return (
    <section aria-labelledby="play-heading" className="grid gap-5">
      {scene}
      <div>
        <h2 id="play-heading" className="text-2xl font-bold">
          {theme.playHeading}
        </h2>
        <p className="mt-2 text-lg">
          {fillStory(theme.story, challenge)} Tap{" "}
          {countOf(challenge.takeAway, v)} to put them {v.builtPlace}.
        </p>
      </div>

      <ConstructionField
        vocabulary={v}
        total={challenge.start}
        used={used}
        onToggle={toggle}
        highlightAbove={hintCue}
        disabled={busy}
      />
      <div role="status" aria-live="polite">
        <p className="font-semibold">
          {capitalize(v.plural)} {v.builtPlace}: {used.size}
        </p>
        <p className="mt-1">
          {readinessMessage(used.size, challenge.takeAway, v)}
        </p>
      </div>
      {used.size > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setUsed(new Set())}
            className={secondaryButton}
          >
            Put all {v.plural} back
          </button>
        </div>
      )}

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && selected !== null && !busy) void act(session, "attempt");
        }}
      >
        <AnswerPicker
          legend={`How many ${v.plural} are left ${v.supplyPlace}?`}
          max={challenge.maxAnswer}
          value={selected}
          onChange={setSelected}
          disabled={busy || !ready}
        />
        <div>
          <button
            type="submit"
            aria-disabled={!ready || selected === null || busy}
            className={primaryButton}
          >
            Check my answer
          </button>
        </div>
      </form>

      <FeedbackPanel
        vocabulary={v}
        feedback={feedback}
        start={challenge.start}
        networkProblem={networkProblem}
        onSkip={() => void act(session, "skip")}
      />

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={() => void act(session, "stop")}
          className={secondaryButton}
        >
          Stop for now
        </button>
        <button type="button" onClick={restart} className={secondaryButton}>
          Start over
        </button>
      </div>
    </section>
  );
}

function outcomeFor(feedback: PracticeFeedback): OutcomeKind {
  switch (feedback.kind) {
    case "correct":
      return "correct";
    case "easier-practice":
      return "easier-practice";
    case "skipped":
      return "skipped";
    case "ended":
      return feedback.reason;
    default:
      // The server only finishes a session with one of the kinds above.
      return "learner-stopped";
  }
}

/**
 * Keeps the picture consistent with the story: the answer picker unlocks only
 * when exactly `takeAway` items are in the construction area. This is a
 * presentation gate, not a scoring rule; the server never sees it.
 */
function readinessMessage(
  used: number,
  takeAway: number,
  v: ThemeConfig["vocabulary"],
): string {
  if (used < takeAway) {
    return `Put ${countOf(takeAway - used, v)} more ${v.builtPlace} to continue.`;
  }
  if (used > takeAway) {
    return `That is more than ${takeAway}. Put ${countOf(used - takeAway, v)} back ${v.supplyPlace}.`;
  }
  return `${countOf(takeAway, v)} ${v.builtPlace}. Now count the ones left ${v.supplyPlace}.`;
}
