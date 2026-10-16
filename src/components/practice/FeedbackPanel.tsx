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

/**
 * Child-facing wording for each controlled feedback kind. Feedback is neutral
 * and never blames. The panel is always in the page so screen readers announce
 * changes inside it.
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
  return (
    <div role="status" aria-live="polite" className="min-h-16">
      {networkProblem ? (
        <p className="notice">
          We could not reach the activity. Check the connection and try again.
        </p>
      ) : feedback === null ? null : (
        <div className="notice">
          <Message
            feedback={feedback}
            start={start}
            takeAway={takeAway}
            vocabulary={vocabulary}
            skipLabel={skipLabel}
            onSkip={onSkip}
          />
        </div>
      )}
    </div>
  );
}

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
        <p>
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
          <p className="font-semibold">Hint {feedback.hintNumber}</p>
          <p className="mt-1">{hint.text}</p>
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
    case "support-finished":
      return <p>You are back at the mission. Take your time.</p>;
    case "ask-again":
      return <p>We could not read that answer. Pick a number and try again.</p>;
    case "offer-skip":
      return (
        <>
          <p>This one is tricky. You can keep trying, or skip it.</p>
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
