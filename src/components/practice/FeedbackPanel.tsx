import type { PracticeFeedback } from "@/lib/practice-protocol";
import type { ThemeVocabulary } from "@/themes";
import { presentHint } from "./hints";
import { TenFrames } from "./TenFrames";

interface FeedbackPanelProps {
  vocabulary: ThemeVocabulary;
  feedback: PracticeFeedback | null;
  start: number;
  takeAway: number;
  networkProblem: boolean;
  /** "Skip" leaves the current challenge; in the warm-up it returns to the mission. */
  skipLabel: string;
  onSkip: () => void;
}

/** Kinds that answer a press of "Check my answer": the page moves focus to them. */
export function takesFocus(feedback: PracticeFeedback | null): boolean {
  return (
    feedback !== null &&
    (feedback.kind === "neutral-feedback" ||
      feedback.kind === "hint" ||
      feedback.kind === "offer-skip" ||
      feedback.kind === "ask-again")
  );
}

export const FEEDBACK_ID = "feedback-panel";

/**
 * Child-facing wording for each controlled feedback kind. Feedback is neutral
 * and never blames.
 *
 * Help the learner asked for (a wrong answer, a hint) is a labelled region the
 * page focuses once, so it scrolls into view and is read once: the region is
 * deliberately NOT a live region, or it would be announced twice. Quiet
 * messages that arrive without a key press (connection trouble, "you are back
 * at the mission") stay in a polite live region that is always in the page.
 */
export function FeedbackPanel({
  vocabulary,
  feedback,
  start,
  takeAway,
  networkProblem,
  skipLabel,
  onSkip,
}: FeedbackPanelProps) {
  const focusable = !networkProblem && takesFocus(feedback);
  return (
    <div className="min-h-16">
      <div role="status" aria-live="polite">
        {networkProblem ? (
          <p className="notice">
            We could not reach the activity. Check the connection and try again.
          </p>
        ) : feedback?.kind === "support-finished" ? (
          <p className="notice">You are back at the mission. Take your time.</p>
        ) : null}
      </div>
      {focusable && feedback && (
        <section
          id={FEEDBACK_ID}
          tabIndex={-1}
          aria-labelledby={`${FEEDBACK_ID}-title`}
          aria-describedby={`${FEEDBACK_ID}-text`}
          className="notice feedback-region"
        >
          <Message
            feedback={feedback}
            start={start}
            takeAway={takeAway}
            vocabulary={vocabulary}
            skipLabel={skipLabel}
            onSkip={onSkip}
          />
        </section>
      )}
    </div>
  );
}

const TITLE = `${FEEDBACK_ID}-title`;
const TEXT = `${FEEDBACK_ID}-text`;

function Message({
  feedback,
  start,
  takeAway,
  vocabulary,
  skipLabel,
  onSkip,
}: {
  feedback: PracticeFeedback;
  start: number;
  takeAway: number;
  vocabulary: ThemeVocabulary;
  skipLabel: string;
  onSkip: () => void;
}) {
  switch (feedback.kind) {
    case "neutral-feedback":
      return (
        <p id={TITLE}>
          Not quite yet. Look at the {vocabulary.plural}{" "}
          {vocabulary.supplyPlace} and try again. There is no rush.
        </p>
      );
    case "hint": {
      const hint = presentHint(
        feedback.hintId,
        feedback.steps,
        start,
        vocabulary,
      );
      return (
        <>
          <h3 id={TITLE} className="font-semibold">
            Hint {feedback.hintNumber}
          </h3>
          <p id={TEXT} className="mt-1">
            {hint.text}
          </p>
          {feedback.steps !== null && (
            <TenFrames
              vocabulary={vocabulary}
              start={start}
              takeAway={takeAway}
              steps={feedback.steps}
            />
          )}
          <p className="mt-2 text-sm">
            Draft demo hint, not yet reviewed by an educator.
          </p>
        </>
      );
    }
    case "ask-again":
      return (
        <p id={TITLE}>
          We could not read that answer. Pick a number and try again.
        </p>
      );
    case "offer-skip":
      return (
        <>
          <p id={TITLE}>This one is tricky. You can keep trying, or skip it.</p>
          <button
            type="button"
            onClick={onSkip}
            className="btn btn-secondary mt-2"
          >
            {skipLabel}
          </button>
        </>
      );
    default:
      return null;
  }
}
