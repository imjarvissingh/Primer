"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  AssessmentSummary,
  SummaryItemOutcome,
} from "@/lib/assessment-protocol";
import { sendAssessment } from "./api";

type State =
  | { name: "loading" }
  | { name: "none" }
  | { name: "unavailable"; reason: string }
  | { name: "ready"; summary: AssessmentSummary };

const OUTCOME: Record<SummaryItemOutcome, string> = {
  correct: "Correct",
  incorrect: "Not correct this time",
  skipped: "Skipped",
  "not-reached": "Not reached",
};
/** Shape + word, never color alone. Decorative: the table says the same. */
const OUTCOME_MARK: Record<SummaryItemOutcome, string> = {
  correct: "●",
  incorrect: "○",
  skipped: "↷",
  "not-reached": "–",
};
const STATE_LABEL: Record<string, string> = {
  "not-assessed": "Not yet assessed",
  emerging: "Needs more evidence",
};

/**
 * Adult-facing summary of ONE demo check. Everything shown is fetched from the
 * server-owned session the check created: the browser supplies only an opaque
 * session id, never a score. With no session there is nothing to show, and no
 * sample data is substituted.
 */
export function ProgressSummary() {
  const [state, setState] = useState<State>({ name: "loading" });

  useEffect(() => {
    let cancelled = false;
    const id = new URLSearchParams(window.location.search).get("session");
    async function load() {
      if (id === null) return setState({ name: "none" });
      const res = await sendAssessment({ action: "summary", sessionId: id });
      if (cancelled) return;
      if (res.ok && "counts" in res)
        return setState({ name: "ready", summary: res });
      const error = res.ok ? null : res.error;
      const reason =
        error === "not-finished"
          ? "That check is not finished yet. Finish or stop it, then open the summary again."
          : error === "network" || error === "server-error"
            ? "We could not reach the demo just now. Reload this page to try again. If the demo was restarted, the check may be gone."
            : "We could not find that check. Demo sessions are short-lived and are not saved, so it may have expired or the demo may have restarted. Results are never rebuilt after that.";
      setState({ name: "unavailable", reason });
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <p className="notice font-semibold" role="note">
        <span className="mr-2 rounded-full bg-foreground px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-background">
          Synthetic data
        </span>
        Synthetic demonstration data. No real child&rsquo;s information is shown
        or collected. This page is not a parent account and has no sign-in.
      </p>
      <Body state={state} />
      <Explanation />
    </div>
  );
}

function Body({ state }: { state: State }) {
  if (state.name === "loading") return <p role="status">Loading…</p>;
  if (state.name === "none" || state.name === "unavailable") {
    return (
      <section className="grid gap-3" aria-labelledby="none-heading">
        <h2 id="none-heading" className="text-xl font-semibold">
          No completed check to show
        </h2>
        <p>
          {state.name === "unavailable"
            ? state.reason
            : "Take the independent check first. Its summary will appear here. No sample results are shown in its place."}
        </p>
        <p>
          <Link href="/assessment" className="underline">
            {state.name === "unavailable"
              ? "Start a new independent check"
              : "Go to the independent check"}
          </Link>
        </p>
      </section>
    );
  }

  const s = state.summary;
  return (
    <>
      <section aria-labelledby="counts-heading" className="grid gap-3">
        <h2 id="counts-heading" className="text-xl font-semibold">
          This short check{s.status === "stopped" ? " (stopped early)" : ""}
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Questions in the check", s.counts.total],
              ["Answered independently", s.counts.answered],
              ["Correct in this short check", s.counts.correct],
              ["Skipped", s.counts.skipped],
              ["Not reached", s.counts.notReached],
            ] as const
          ).map(([label, n]) => (
            <div key={label} className="card flex flex-col-reverse p-3">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-3xl font-extrabold">{n}</dd>
            </div>
          ))}
        </dl>
        {/* The same four outcomes, in order. No total, rate or score is computed. */}
        <div
          aria-hidden="true"
          className="grid grid-cols-2 gap-2 min-[22.5rem]:grid-cols-4"
        >
          {s.items.map((item) => (
            <span
              key={item.position}
              className="card px-2 py-1.5 text-center text-sm font-semibold"
            >
              {item.position} {OUTCOME_MARK[item.outcome]}{" "}
              {OUTCOME[item.outcome]}
            </span>
          ))}
        </div>
      </section>

      <section aria-labelledby="items-heading" className="grid gap-3">
        <h2 id="items-heading" className="text-xl font-semibold">
          Question by question
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Each question in the check and what happened
            </caption>
            <thead>
              <tr className="border-b-2 border-border">
                <th scope="col" className="py-2 pr-3">
                  #
                </th>
                <th scope="col" className="py-2 pr-3">
                  Question
                </th>
                <th scope="col" className="py-2 pr-3">
                  Skill sampled
                </th>
                <th scope="col" className="py-2">
                  What happened
                </th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((item) => (
                <tr key={item.position} className="border-b border-border">
                  <th scope="row" className="py-2 pr-3">
                    {item.position}
                  </th>
                  <td className="py-2 pr-3">{item.expression}</td>
                  <td className="py-2 pr-3">{item.skill}</td>
                  <td className="py-2">{OUTCOME[item.outcome]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="skills-heading" className="grid gap-3">
        <h2 id="skills-heading" className="text-xl font-semibold">
          Skills sampled
        </h2>
        <ul className="grid gap-2">
          {s.skills.map((k) => (
            <li key={k.id} className="card p-3">
              <p className="font-semibold">
                {k.id}: {k.title}
              </p>
              <p>
                Correct in this short check: {k.correct} of {k.answered}{" "}
                answered. <strong>{k.observation}.</strong>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="mastery-heading" className="grid gap-2">
        <h2 id="mastery-heading" className="text-xl font-semibold">
          Mastery: not awarded
        </h2>
        <p>
          Evidence status:{" "}
          {STATE_LABEL[s.mastery.state] ?? "Needs more evidence"}. No educator
          has approved rules for deciding mastery, so this demo never awards it,
          whatever the score. Four questions on one occasion cannot show lasting
          understanding.
        </p>
      </section>

      <section aria-labelledby="prov-heading" className="grid gap-2">
        <h2 id="prov-heading" className="text-xl font-semibold">
          Where this comes from
        </h2>
        <ul className="list-disc pl-6">
          <li>Independent check: no hints were available, and 0 were used.</li>
          <li>
            Recorded by the server from the answers it scored; the browser
            cannot set these numbers.
          </li>
          <li>
            Draft questions, not reviewed by an educator. Curriculum{" "}
            {s.provenance.curriculumVersion}, content{" "}
            {s.provenance.contentVersion}.
          </li>
        </ul>
      </section>
    </>
  );
}

function Explanation() {
  return (
    <section aria-labelledby="limits-heading" className="grid gap-2">
      <h2 id="limits-heading" className="text-xl font-semibold">
        Practice is not the same as this check
      </h2>
      <ul className="list-disc pl-6">
        <li>
          In guided practice, a learner can get hints and feedback. That helps
          learning but does not show what they can do alone, so it is never
          counted here.
        </li>
        <li>
          This check gives no hints and no right-or-wrong feedback, and counts
          only the first answer to each question.
        </li>
        <li>
          This demo does not link a practice session to a check. Nothing from
          practice appears in this summary.
        </li>
        <li>
          Results are kept in memory for a short time and then disappear. This
          is not a record, a diagnosis or a prediction.
        </li>
      </ul>
    </section>
  );
}
