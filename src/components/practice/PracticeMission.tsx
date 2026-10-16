"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";

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
  const [sessionLost, setSessionLost] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  // A ref, not state, so a rapid second click is blocked before React re-renders.
  const inFlight = useRef(false);
  // Bumped on restart so a late reply for an abandoned session is ignored.
  const generation = useRef(0);

  // Next keeps a page you navigated away from mounted but hidden, with its
  // state. Coming back would then show a half-played mission tied to a server
  // session that may have expired. Hiding (or unmounting) runs this cleanup, so
  // the next visit always opens at the introduction.
  useEffect(() => {
    const abandoned = generation;
    return () => {
      abandoned.current += 1;
      setScreen({ name: "intro" });
      setUsed(new Set());
      setSelected(null);
      setSubmitted(null);
      setFeedback(null);
      setNetworkProblem(false);
      setSessionLost(false);
      setRateLimited(false);
    };
  }, []);

  function resetLocal() {
    setUsed(new Set());
    setSelected(null);
    setSubmitted(null);
    setFeedback(null);
    setNetworkProblem(false);
    setSessionLost(false);
    setRateLimited(false);
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
        if (!res.ok && res.error === "rate-limited") setRateLimited(true);
      }
    });
  }

  function restart(sessionEnded = false) {
    generation.current += 1;
    resetLocal();
    setSessionLost(sessionEnded);
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
        if (res.error === "network" || res.error === "server-error")
          setNetworkProblem(true);
        else restart(true);
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

  const framedScene = (
    <div className="scene-enter overflow-hidden rounded-xl border-2 border-border">
      {scene}
    </div>
  );

  if (screen.name === "intro") {
    return (
      <section aria-labelledby="intro-heading" className="grid gap-4">
        {framedScene}
        <h2 id="intro-heading" className="text-2xl font-extrabold sm:text-3xl">
          {theme.missionTitle}
        </h2>
        <p className="text-lg">{theme.intro}</p>
        <p className="notice font-semibold">{theme.goal}</p>
        <div role="status" aria-live="polite">
          {(networkProblem || sessionLost) && (
            <p className="notice">
              {sessionLost
                ? "That practice is no longer available, so it could not be continued. Press the button to begin a new one."
                : rateLimited
                  ? "Lots of people are trying this right now. Please wait a minute and try again."
                  : "We could not start the activity. Please try again."}
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
        onRestart={() => restart()}
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
      {framedScene}
      <div>
        <h2 id="play-heading" className="text-2xl font-extrabold">
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
      <div role="status" aria-live="polite" className="card p-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-bold">
            {capitalize(v.plural)} {v.builtPlace}: {used.size}
          </p>
          <span className="text-sm text-muted">
            (goal: {challenge.takeAway})
          </span>
          {/* Same information as the text beside it, drawn: decorative. */}
          <span aria-hidden="true" className="flex flex-wrap gap-1">
            {Array.from({ length: challenge.takeAway }, (_, i) => (
              <span
                key={i}
                className={`pip ${i < used.size ? "pip-filled" : ""}`}
              />
            ))}
          </span>
        </div>
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
        className="card grid gap-4 p-4"
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
        <button
          type="button"
          onClick={() => restart()}
          className={secondaryButton}
        >
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
