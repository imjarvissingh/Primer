"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type {
  AssessmentQuestion,
  AssessmentStatus,
} from "@/lib/assessment-protocol";
import { AnswerPicker } from "@/components/practice/AnswerPicker";
import { sendAssessment } from "./api";

type Screen =
  | { name: "intro" }
  | {
      name: "asking";
      sessionId: string;
      seq: number;
      question: AssessmentQuestion;
    }
  | {
      name: "done";
      sessionId: string;
      status: Exclude<AssessmentStatus, "in-progress">;
    };

const primary =
  "min-h-12 rounded-md bg-(--accent) px-6 text-lg font-semibold text-(--accent-fg) aria-disabled:opacity-60";
const secondary =
  "min-h-12 rounded-md border-2 border-border px-4 font-semibold";

/**
 * The independent check, one question at a time. It decides nothing: every
 * answer goes to the server, and the server's reply is deliberately the same
 * whether the answer was right or wrong. There are no hints, timers or scores
 * on this screen.
 */
export function AssessmentCheck() {
  const [screen, setScreen] = useState<Screen>({ name: "intro" });
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  // A ref, not state, so a rapid second click is blocked before React re-renders.
  const inFlight = useRef(false);
  const generation = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);

  const position = screen.name === "asking" ? screen.question.position : 0;
  // Move focus to the new heading so screen readers announce the next question.
  useEffect(() => {
    if (screen.name !== "intro") heading.current?.focus();
  }, [screen.name, position]);

  // Next keeps a page you navigated away from mounted but hidden, with its
  // state. Hiding (or unmounting) runs this cleanup, so a later visit never
  // resumes a check whose server session may be gone: it opens at the intro.
  useEffect(() => {
    const abandoned = generation;
    return () => {
      abandoned.current += 1;
      setScreen({ name: "intro" });
      setSelected(null);
      setNotice("");
    };
  }, []);

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

  function restart(message = "") {
    generation.current += 1;
    setSelected(null);
    setNotice(message);
    setScreen({ name: "intro" });
  }

  function begin() {
    return guarded(async () => {
      const mine = ++generation.current;
      setNotice("");
      const res = await sendAssessment({ action: "start" });
      if (mine !== generation.current) return;
      if (res.ok && "sessionId" in res) {
        setSelected(null);
        setScreen({
          name: "asking",
          sessionId: res.sessionId,
          seq: res.seq,
          question: res.question,
        });
      } else {
        setNotice(
          !res.ok && res.error === "rate-limited"
            ? "Lots of people are trying this right now. Please wait a minute and try again."
            : "We could not start. Please try again.",
        );
      }
    });
  }

  function act(
    current: Extract<Screen, { name: "asking" }>,
    kind: "answer" | "skip" | "stop",
  ) {
    return guarded(async () => {
      const mine = generation.current;
      const base = { sessionId: current.sessionId, seq: current.seq };
      const res = await sendAssessment(
        kind === "answer"
          ? { action: "answer", ...base, answer: selected }
          : { action: kind, ...base },
      );
      if (mine !== generation.current) return;
      if (!res.ok) {
        if (res.error === "network" || res.error === "server-error") {
          setNotice("We could not reach the activity. Please try again.");
        } else {
          // Lost, expired or out-of-step session: it cannot be rebuilt from
          // anything the browser holds, so the only safe move is a fresh start.
          restart(
            "That check is no longer available, so it could not be continued. Press Start to begin a new one.",
          );
        }
        return;
      }
      if (!("ack" in res)) return;

      if (res.question === null) {
        setScreen({
          name: "done",
          sessionId: current.sessionId,
          status: res.status === "in-progress" ? "complete" : res.status,
        });
        return;
      }
      setNotice(
        res.ack === "ask-again"
          ? "We could not read that answer. Please pick a number."
          : res.ack === "skipped"
            ? "Skipped."
            : "Your answer is saved.",
      );
      if (res.ack !== "ask-again") setSelected(null);
      setScreen({ ...current, seq: res.seq, question: res.question });
    });
  }

  if (screen.name === "intro") {
    return (
      <section aria-labelledby="intro-heading" className="grid gap-4">
        <h2 id="intro-heading" className="text-2xl font-bold">
          Try some on your own
        </h2>
        <p className="text-lg">
          These are a few short questions. You do the thinking by yourself.
          There are no hints, no timer, and you will not see if an answer is
          right. You can skip a question or stop at any time. If you refresh
          this page, the check starts over.
        </p>
        <div role="status" aria-live="polite">
          {notice && (
            <p className="rounded-lg border-2 border-border p-3">{notice}</p>
          )}
        </div>
        <div>
          <button
            type="button"
            aria-disabled={busy}
            onClick={() => (busy ? undefined : begin())}
            className={primary}
          >
            Start
          </button>
        </div>
      </section>
    );
  }

  if (screen.name === "done") {
    return (
      <section aria-labelledby="done-heading" className="grid gap-4">
        <h2
          id="done-heading"
          ref={heading}
          tabIndex={-1}
          className="text-2xl font-bold"
        >
          {screen.status === "complete" ? "All done" : "Stopped for now"}
        </h2>
        <p className="text-lg">
          {screen.status === "complete"
            ? "Thank you for trying these on your own."
            : "That is okay. You can try again whenever you like."}
        </p>
        <p>
          <Link
            href={`/demo-progress?session=${screen.sessionId}`}
            className="underline"
          >
            Summary for a grown-up (demo)
          </Link>
        </p>
        <div>
          <button type="button" onClick={() => restart()} className={primary}>
            Start over
          </button>
        </div>
      </section>
    );
  }

  const { question } = screen;
  return (
    <section aria-labelledby="question-heading" className="grid gap-5">
      <h2
        id="question-heading"
        ref={heading}
        tabIndex={-1}
        className="text-2xl font-bold"
      >
        Question {question.position} of {question.total}
      </h2>
      <div>
        <p className="text-4xl font-bold" aria-hidden="true">
          {question.start} − {question.takeAway}
        </p>
        <p className="mt-2 text-lg">
          Start with {question.start}. Take away {question.takeAway}. How many
          are left?
        </p>
      </div>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (selected !== null && !busy) void act(screen, "answer");
        }}
      >
        <AnswerPicker
          legend="Pick a number"
          max={question.maxAnswer}
          value={selected}
          onChange={setSelected}
          disabled={busy}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            aria-disabled={selected === null || busy}
            className={primary}
          >
            Save my answer
          </button>
          <button
            type="button"
            aria-disabled={busy}
            onClick={() => (busy ? undefined : void act(screen, "skip"))}
            className={secondary}
          >
            Skip this question
          </button>
        </div>
      </form>
      <div role="status" aria-live="polite" className="min-h-8">
        {notice}
      </div>
      <div className="border-t border-border pt-4">
        <button
          type="button"
          aria-disabled={busy}
          onClick={() => (busy ? undefined : void act(screen, "stop"))}
          className={secondary}
        >
          Stop for now
        </button>{" "}
        <button
          type="button"
          aria-disabled={busy}
          onClick={() => (busy ? undefined : restart())}
          className={secondary}
        >
          Start over
        </button>
      </div>
    </section>
  );
}
