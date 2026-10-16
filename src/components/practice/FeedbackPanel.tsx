import type { PracticeFeedback } from "@/lib/practice-protocol";
import type { ThemeVocabulary } from "@/themes";
import { presentHint } from "./hints";

interface FeedbackPanelProps {
  vocabulary: ThemeVocabulary;
  feedback: PracticeFeedback | null;
  start: number;
  networkProblem: boolean;
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
  networkProblem,
  onSkip,
}: FeedbackPanelProps) {
  return (
    <div role="status" aria-live="polite" className="min-h-16">
      {networkProblem ? (
        <p className="rounded-lg border-2 border-border p-3">
          We could not reach the activity. Check the connection and try again.
        </p>
      ) : feedback === null ? null : (
        <div className="rounded-lg border-2 border-sky-900 bg-sky-50 p-3 text-gray-900">
          <Message
            feedback={feedback}
            start={start}
            vocabulary={vocabulary}
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
  vocabulary,
  onSkip,
}: {
  feedback: PracticeFeedback;
  start: number;
  vocabulary: ThemeVocabulary;
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
          <p className="mt-2 text-sm">
            Draft demo hint, not yet reviewed by an educator.
          </p>
        </>
      );
    }
    case "ask-again":
      return <p>We could not read that answer. Pick a number and try again.</p>;
    case "offer-skip":
      return (
        <>
          <p>This one is tricky. You can keep trying, or skip it.</p>
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 min-h-12 rounded-md border-2 border-sky-900 px-4 font-semibold"
          >
            Skip this challenge
          </button>
        </>
      );
    default:
      return null;
  }
}
