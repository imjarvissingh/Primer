"use client";

import { useRef, useState } from "react";
import {
  BRIDGE_MISSION_ID,
  type PracticeFeedback,
  type PublicChallenge,
} from "@/lib/practice-protocol";
import { AnswerPicker } from "./AnswerPicker";
import { BlockField } from "./BlockField";
import { BridgeScene } from "./BridgeScene";
import { FeedbackPanel } from "./FeedbackPanel";
import { MissionOutcome, type OutcomeKind } from "./MissionOutcome";
import { presentHint } from "./hints";
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
  "min-h-12 rounded-md bg-sky-800 px-6 text-lg font-semibold text-white aria-disabled:opacity-60";
const secondaryButton =
  "min-h-12 rounded-md border-2 border-border px-4 font-semibold";

/**
 * Owns what the learner sees: which screen, which blocks are on the bridge,
 * and the latest feedback. It decides nothing about correctness. Every answer
 * is sent to the server, which scores it and says what feedback to show.
 */
export function BridgeMission() {
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
        missionId: BRIDGE_MISSION_ID,
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
        <BridgeScene />
        <h2 id="intro-heading" className="text-2xl font-bold">
          The Broken Bridge
        </h2>
        <p className="text-lg">
          Oh no! The bridge has a gap in it. Help the builder fix it with
          blocks.
        </p>
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
            Start building
          </button>
        </div>
      </section>
    );
  }

  if (screen.name === "outcome") {
    return (
      <MissionOutcome
        kind={screen.kind}
        answer={submitted}
        onRestart={restart}
      />
    );
  }

  const { session } = screen;
  const { challenge } = session;
  const hintCue =
    feedback?.kind === "hint"
      ? presentHint(feedback.hintId, feedback.steps, challenge.start)
          .highlightAbove
      : null;

  return (
    <section aria-labelledby="play-heading" className="grid gap-5">
      <BridgeScene />
      <div>
        <h2 id="play-heading" className="text-2xl font-bold">
          Fix the bridge
        </h2>
        <p className="mt-2 text-lg">
          The builder has {challenge.start} blocks. The team uses{" "}
          {challenge.takeAway} of them on the bridge. Tap {challenge.takeAway}{" "}
          blocks to put them on the bridge.
        </p>
      </div>

      <BlockField
        total={challenge.start}
        used={used}
        onToggle={toggle}
        highlightAbove={hintCue}
        disabled={busy}
      />
      <p role="status" aria-live="polite" className="font-semibold">
        Blocks on the bridge: {used.size}
      </p>
      {used.size > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setUsed(new Set())}
            className={secondaryButton}
          >
            Put all blocks back
          </button>
        </div>
      )}

      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (selected !== null && !busy) void act(session, "attempt");
        }}
      >
        <AnswerPicker
          max={challenge.maxAnswer}
          value={selected}
          onChange={setSelected}
          disabled={busy}
        />
        <div>
          <button
            type="submit"
            aria-disabled={selected === null || busy}
            className={primaryButton}
          >
            Check my answer
          </button>
        </div>
      </form>

      <FeedbackPanel
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
