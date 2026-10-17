"use client";

import { useEffect, useRef, useState } from "react";
import {
  PRACTICE_MISSION_ID,
  type PracticeFeedback,
  type PublicChallenge,
  type SupportChallenge,
} from "@/lib/practice-protocol";
import Link from "next/link";
import { AnswerPicker } from "./AnswerPicker";
import { CricketIntro } from "./cricket/CricketIntro";
import {
  CricketAftermath,
  CricketScoreboard,
  GroupingChooser,
  type Grouping,
} from "./cricket/CricketStation";
import { ConstructionField } from "./ConstructionField";
import { GuideStrip, type GuideMood } from "./Guide";
import { FEEDBACK_ID, FeedbackPanel, takesFocus } from "./FeedbackPanel";
import { MissionOutcome, type OutcomeKind } from "./MissionOutcome";
import { presentHint } from "./hints";
import { capitalize, countOf, fillStory, type ThemeConfig } from "@/themes";
import { sendPractice } from "./api";
import { Scene } from "./scenes";
import {
  isComplete,
  NOT_STARTED,
  type ConstructionProgress,
} from "./scenes/progress";

interface Session {
  id: string;
  seq: number;
  challenge: PublicChallenge;
  /** Set only while the server has the learner in the short warm-up. */
  support: SupportChallenge | null;
}

type Screen =
  | { name: "intro" }
  | { name: "playing"; session: Session }
  | { name: "offer"; session: Session }
  | { name: "outcome"; kind: OutcomeKind };

const primaryButton = "btn btn-primary";
const secondaryButton = "btn btn-secondary";

interface PracticeMissionProps {
  theme: ThemeConfig;
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
function MissionBody({ theme }: PracticeMissionProps) {
  const [screen, setScreen] = useState<Screen>({ name: "intro" });
  const [used, setUsed] = useState<ReadonlySet<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [networkProblem, setNetworkProblem] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  // Cricket only: how the learner chose to look at the basket, and the size of
  // the basket for the closing picture. Presentation, never sent anywhere.
  const [grouping, setGrouping] = useState<Grouping>("loose");
  const [basketSize, setBasketSize] = useState(0);
  const isCricket = theme.id === "cricket-academy";
  // A ref, not state, so a rapid second click is blocked before React re-renders.
  const inFlight = useRef(false);
  // Set when the screen changes between mission, offer and warm-up, so focus
  // moves to the new heading once (and never on ordinary re-renders).
  const needsFocus = useRef(false);
  // Set when the server answers a "Check my answer" press with help. The help
  // can render far below the fold on a phone, so focus moves to it once.
  const focusFeedback = useRef(false);
  useEffect(() => {
    if (focusFeedback.current) {
      focusFeedback.current = false;
      document.getElementById(FEEDBACK_ID)?.focus();
      return;
    }
    if (!needsFocus.current) return;
    needsFocus.current = false;
    for (const id of ["offer-heading", "play-heading", "intro-heading"]) {
      document.getElementById(id)?.focus();
      if (document.activeElement?.id === id) break;
    }
  });
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
      setGrouping("loose");
    };
  }, []);

  function resetLocal() {
    setGrouping("loose");
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
        needsFocus.current = true;
        setScreen({
          name: "playing",
          session: {
            id: res.sessionId,
            seq: res.seq,
            challenge: res.challenge,
            support: null,
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
    needsFocus.current = true;
    setScreen({ name: "intro" });
  }

  function act(
    session: Session,
    request: "attempt" | "skip" | "stop" | { support: "start" | "decline" },
  ) {
    return guarded(async () => {
      const mine = generation.current;
      setNetworkProblem(false);
      const base = { sessionId: session.id, seq: session.seq };
      const res = await sendPractice(
        request === "attempt"
          ? { action: "attempt", ...base, answer: selected }
          : typeof request === "object"
            ? { action: "support", ...base, choice: request.support }
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
        setBasketSize(session.challenge.start);
        setSubmitted(selected);
        setScreen({ name: "outcome", kind: outcomeFor(next) });
        return;
      }
      // The server decides every move between the mission and the warm-up.
      const advanced = { ...session, seq: res.seq };
      if (next.kind === "support-offer") {
        needsFocus.current = true;
        setFeedback(null);
        setSelected(null);
        setScreen({ name: "offer", session: advanced });
        return;
      }
      if (next.kind === "support-started") {
        needsFocus.current = true;
        setUsed(new Set());
        setSelected(null);
        setFeedback(null);
        setScreen({
          name: "playing",
          session: { ...advanced, support: next.challenge },
        });
        return;
      }
      if (next.kind === "support-finished") {
        needsFocus.current = true;
        setUsed(new Set());
        setSelected(null);
        setFeedback(next);
        setScreen({ name: "playing", session: { ...advanced, support: null } });
        return;
      }
      focusFeedback.current = request === "attempt" && takesFocus(next);
      setScreen({ name: "playing", session: advanced });
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

  // The artwork shows the same selection the resource field shows. It only
  // reads it: `placed` is derived from `used`, never stored separately.
  const framedScene = (
    progress: ConstructionProgress,
    mood: GuideMood,
    solved = false,
  ) => (
    <div className="stage scene-enter">
      <div
        className="stage-scene"
        data-complete={isComplete(progress) ? "true" : "false"}
        // Celebration is for a right answer the server confirmed, never for
        // merely filling the picture.
        data-solved={solved ? "true" : "false"}
      >
        <Scene themeId={theme.id} progress={progress} />
      </div>
      <GuideStrip
        guide={theme.guide}
        mood={mood}
        reaction={isCricket ? used.size : 0}
      />
    </div>
  );

  if (screen.name === "intro") {
    return (
      <section
        aria-labelledby="intro-heading"
        className="grid grid-cols-1 gap-4"
      >
        {isCricket ? (
          <div className="stage scene-enter">
            <CricketIntro>
              <GuideStrip guide={theme.guide} mood="welcome" />
            </CricketIntro>
          </div>
        ) : (
          framedScene(NOT_STARTED, "welcome")
        )}
        <h2
          id="intro-heading"
          tabIndex={-1}
          className="text-2xl font-extrabold sm:text-3xl"
        >
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
        {isCricket && <LabLink />}
      </section>
    );
  }

  if (screen.name === "outcome") {
    // The world stays on screen at the end, with the guide's reaction to what
    // really happened. Only a right answer shows the finished picture.
    const solved = screen.kind === "correct";
    const outcomeMood: GuideMood = solved
      ? "done"
      : screen.kind === "easier-practice" || screen.kind === "unproductive"
        ? "again"
        : "welcome";
    return (
      <div className="grid grid-cols-1 gap-5">
        {framedScene(
          solved
            ? { placed: used.size, required: used.size }
            : { placed: 0, required: null },
          outcomeMood,
          solved,
        )}
        {isCricket && solved && (
          <CricketAftermath total={basketSize} used={used} />
        )}
        <MissionOutcome
          theme={theme}
          kind={screen.kind}
          answer={submitted}
          onRestart={() => restart()}
        />
        {isCricket && solved && <LabLink />}
      </div>
    );
  }

  const { session } = screen;
  const v = theme.vocabulary;
  // The warm-up reuses the same screen with the server's smaller numbers.
  const inSupport = session.support !== null;
  const challenge: SupportChallenge = session.support ?? session.challenge;

  if (screen.name === "offer") {
    return (
      <section
        aria-labelledby="offer-heading"
        className="grid grid-cols-1 gap-4"
      >
        {framedScene(NOT_STARTED, "again")}
        <h2
          id="offer-heading"
          tabIndex={-1}
          className="text-2xl font-extrabold"
        >
          Want a short warm-up first?
        </h2>
        <p className="text-lg">
          It is a smaller one with the same idea. Then you come back to{" "}
          {theme.missionTitle}.
        </p>
        <p className="text-base">
          If you choose Not now, this practice ends. You can start again
          whenever you like.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            aria-disabled={busy}
            onClick={() =>
              busy ? undefined : void act(session, { support: "start" })
            }
            className={primaryButton}
          >
            Try the warm-up
          </button>
          <button
            type="button"
            aria-disabled={busy}
            onClick={() =>
              busy ? undefined : void act(session, { support: "decline" })
            }
            className={secondaryButton}
          >
            Not now
          </button>
          <button
            type="button"
            aria-disabled={busy}
            onClick={() => (busy ? undefined : void act(session, "stop"))}
            className={secondaryButton}
          >
            Stop for now
          </button>
        </div>
        <div role="status" aria-live="polite">
          {networkProblem && (
            <p className="notice">
              We could not reach the activity. Check the connection and try
              again.
            </p>
          )}
        </div>
      </section>
    );
  }
  const ready = used.size === challenge.takeAway;
  const hintCue =
    feedback?.kind === "hint"
      ? presentHint(feedback.hintId, feedback.steps, challenge.start, v)
          .highlightAbove
      : null;

  return (
    <section aria-labelledby="play-heading" className="grid grid-cols-1 gap-5">
      {framedScene(
        { placed: used.size, required: challenge.takeAway },
        guideMoodFor(used.size, feedback),
      )}
      <div>
        <h2 id="play-heading" tabIndex={-1} className="text-2xl font-extrabold">
          {inSupport ? "Warm-up" : theme.playHeading}
        </h2>
        {inSupport && (
          <p className="mt-1 font-semibold">
            A smaller one first. Then you go back to {theme.missionTitle}.
          </p>
        )}
        <p className="mt-2 text-lg">
          {fillStory(theme.story, challenge)} Tap{" "}
          {countOf(challenge.takeAway, v)} to put them {v.builtPlace}.
        </p>
      </div>

      {isCricket && (
        <CricketScoreboard
          start={challenge.start}
          takeAway={challenge.takeAway}
          used={used.size}
        />
      )}
      {isCricket && !inSupport && challenge.start > 10 && (
        <GroupingChooser
          value={grouping}
          onChange={setGrouping}
          disabled={busy}
        />
      )}
      <ConstructionField
        vocabulary={v}
        art={theme.itemArt}
        total={challenge.start}
        used={used}
        onToggle={toggle}
        highlightAbove={hintCue}
        disabled={busy}
        grouping={isCricket && !inSupport ? grouping : "loose"}
        targets={isCricket ? challenge.takeAway : undefined}
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
        className="card grid grid-cols-1 gap-4 p-4"
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
        takeAway={challenge.takeAway}
        networkProblem={networkProblem}
        skipLabel={inSupport ? "Back to the mission" : "Skip this challenge"}
        onSkip={() => void act(session, "skip")}
      />

      <div className="flex flex-wrap gap-3 border-t border-border pt-4">
        {inSupport && (
          <button
            type="button"
            onClick={() => void act(session, "skip")}
            className={secondaryButton}
          >
            Back to the mission
          </button>
        )}
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

/**
 * Adult-facing pointer to the separate, draft make-ten lab. It is not part of
 * the practice, never changes a hint, and is labelled as unreviewed.
 */
function LabLink() {
  return (
    <p className="text-sm">
      For a grown-up:{" "}
      <Link href="/cricket/make-ten-lab" className="underline">
        preview a draft make-ten activity
      </Link>{" "}
      (separate from this practice, not reviewed by an educator).
    </p>
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

/**
 * Which reaction the guide shows. Every branch is a real event: nothing placed,
 * resources being moved, or help/neutral feedback after an answer that was not
 * yet right. A right answer is handled by the outcome screen. It never depends
 * on how many tries the learner has used, and nothing here praises or scores.
 */
export function guideMoodFor(
  placed: number,
  feedback: PracticeFeedback | null,
): GuideMood {
  if (
    feedback !== null &&
    (feedback.kind === "neutral-feedback" ||
      feedback.kind === "hint" ||
      feedback.kind === "offer-skip" ||
      feedback.kind === "ask-again")
  ) {
    return "again";
  }
  return placed > 0 ? "working" : "welcome";
}
