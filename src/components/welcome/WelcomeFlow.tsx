"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fillStory, getTheme } from "@/themes";
import {
  DEMO_NUMBERS,
  INTERESTS,
  SURPRISE,
  getInterest,
  pickSurprise,
  type Choice,
  type InterestConfig,
  type InterestId,
} from "@/interests";
import { InterestScene, SurpriseArt } from "./InterestArt";

type Step = "intro" | "choose" | "preview";

const DISCLOSURES = [
  "This is a draft demonstration, not a finished product.",
  "The content has not yet been approved by a qualified educator.",
  "It uses made-up demonstration data only.",
  "It is not ready for children to use on their own.",
  "Nothing here shows that Primer improves learning.",
] as const;

const PARENT_ROLES = [
  [
    "What is Primer?",
    "An early-stage math adventure. Your child picks something they love, and the same math appears inside a story about it.",
  ],
  [
    "Who is it for?",
    "Children ages 6 to 9. For now, a grown-up guides the whole demonstration.",
  ],
  [
    "What do you do?",
    "Introduce the activity, help choose an interest, and stay with your child. Later, you can look at a separate independent check and a cautious summary.",
  ],
] as const;

const HOW_IT_WORKS = [
  [
    "Your child chooses",
    "Pick one of five interests, or let Primer choose. The choice is not saved.",
  ],
  [
    "The world changes; the math does not",
    "The interest changes the story, the objects and the guide. The question, the checking and the help are the same in every world.",
  ],
  [
    "Practice gives support",
    "In the guided mission, the child moves objects, counts what is left, and can get gentle hints. It is practice, not a test.",
  ],
  [
    "The independent check is different",
    "It is a separate short check with no hints and no right-or-wrong feedback, so you can see what was answered alone.",
  ],
  [
    "The summary is cautious",
    "It shows what one short, made-up demo session recorded. It shows limited evidence, not mastery, and no progress over time.",
  ],
] as const;

function StatusBanner() {
  return (
    <p
      data-testid="draft-banner"
      className="inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold text-[#134e4a]"
    >
      Draft demonstration &middot; grown-up guided &middot; made-up data
      &middot; nothing is saved
    </p>
  );
}

export function WelcomeFlow() {
  const [step, setStep] = useState<Step>("intro");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [shown, setShown] = useState<InterestId | null>(null);
  const [bySurprise, setBySurprise] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Next keeps a page you navigated away from mounted but hidden, with its
  // state. Coming back would resume an old preview, so hiding resets to the
  // introduction (nothing is stored; the choice lives only while the page is
  // in view).
  useEffect(() => {
    return () => {
      setStep("intro");
      setChoice(null);
      setShown(null);
      setBySurprise(false);
    };
  }, []);

  // Move focus to the new screen's heading, but never on first load.
  useEffect(() => {
    if (!moved.current) {
      moved.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step, shown]);

  function goToPreview() {
    if (choice === null) return;
    const surprise = choice === "surprise";
    setBySurprise(surprise);
    setShown(surprise ? pickSurprise() : choice);
    setStep("preview");
  }

  const interest = shown === null ? null : getInterest(shown);

  return (
    <div className="mt-6">
      {step === "intro" && (
        <Intro headingRef={headingRef} onStart={() => setStep("choose")} />
      )}
      {step === "choose" && (
        <Choose
          headingRef={headingRef}
          choice={choice}
          onChoice={setChoice}
          onBack={() => setStep("intro")}
          onContinue={goToPreview}
        />
      )}
      {step === "preview" && interest !== null && (
        <Preview
          headingRef={headingRef}
          interest={interest}
          bySurprise={bySurprise}
          onChange={() => setStep("choose")}
          onAnother={() => setShown(pickSurprise())}
        />
      )}
    </div>
  );
}

/* ---- Step 1: parent introduction --------------------------------------- */

function Intro({
  headingRef,
  onStart,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onStart: () => void;
}) {
  return (
    <div className="scene-enter">
      <section className="welcome-hero overflow-hidden rounded-3xl">
        <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-2">
          <div>
            <StatusBanner />
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl"
            >
              Math adventures shaped by what your child loves.
            </h1>
            <p className="mt-4 text-lg">
              Primer turns the things children love into personalized math
              adventures, and helps you see what they can show on their own.
            </p>
            <p className="mt-3 text-sm">
              This is a proposed description of the product, not a proven claim.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onStart}
              >
                Choose an interest
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            {(["building", "space", "cricket", "soccer"] as const).map((id) => (
              <div
                key={id}
                className="welcome-tile overflow-hidden rounded-2xl"
              >
                <InterestScene id={id} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="parents" className="mt-8">
        <h2 id="parents" className="text-2xl font-bold">
          For parents
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {PARENT_ROLES.map(([title, text]) => (
            <div key={title} className="card p-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="how"
        className="mt-8"
        data-testid="how-it-works"
      >
        <h2 id="how" className="text-2xl font-bold">
          How Primer works
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.map(([title, text], i) => (
            <li key={title} className="card p-5">
              <p className="text-sm font-bold text-muted">Step {i + 1}</p>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="honest"
        className="notice mt-8"
        data-testid="disclosures"
      >
        <h2 id="honest" className="text-lg font-bold">
          Please know before you start
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {DISCLOSURES.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Do not enter real information about a child. This page asks for none,
          and it saves nothing.
        </p>
      </section>
    </div>
  );
}

/* ---- Step 2: choose an interest ---------------------------------------- */

function ChoiceCard({
  value,
  title,
  line,
  className,
  art,
  checked,
  onSelect,
}: {
  value: Choice;
  title: string;
  line: string;
  className: string;
  art: React.ReactNode;
  checked: boolean;
  onSelect: (c: Choice) => void;
}) {
  const id = `interest-${value}`;
  return (
    <li className={`${className} choice-wrap`}>
      <input
        id={id}
        type="radio"
        name="interest"
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="choice-input"
        aria-describedby={`${id}-desc`}
      />
      <label htmlFor={id} className="choice">
        <span className="block overflow-hidden">{art}</span>
        <span className="block p-4">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xl font-extrabold">{title}</span>
            <span className="sel-badge" aria-hidden="true">
              &#10003; Selected
            </span>
          </span>
          <span id={`${id}-desc`} className="mt-1 block text-muted">
            {line}
          </span>
        </span>
      </label>
    </li>
  );
}

function Choose({
  headingRef,
  choice,
  onChoice,
  onBack,
  onContinue,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  choice: Choice | null;
  onChoice: (c: Choice) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="scene-enter">
      <StatusBanner />
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-4xl font-extrabold sm:text-5xl"
      >
        What do you love?
      </h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">
        Help your child pick one. You can change it any time before you
        continue.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">Choose an interest</legend>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INTERESTS.map((i) => (
            <ChoiceCard
              key={i.id}
              value={i.id}
              title={i.title}
              line={i.cardLine}
              className={i.className}
              art={<InterestScene id={i.id} />}
              checked={choice === i.id}
              onSelect={onChoice}
            />
          ))}
          <ChoiceCard
            value={SURPRISE.id}
            title={SURPRISE.title}
            line={SURPRISE.cardLine}
            className={SURPRISE.className}
            art={<SurpriseArt />}
            checked={choice === SURPRISE.id}
            onSelect={onChoice}
          />
        </ul>
      </fieldset>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={choice === null}
          onClick={onContinue}
        >
          See the adventure preview
        </button>
        <p role="status" className="text-muted">
          {choice === null
            ? "Choose an interest, or “Surprise me”, to continue."
            : choice === "surprise"
              ? "Selected: Surprise me."
              : `Selected: ${getInterest(choice).title}.`}
        </p>
      </div>
      <p className="mt-6 text-sm text-muted">
        Your choice is only remembered while this page stays open. Nothing is
        stored or sent anywhere.
      </p>
    </div>
  );
}

/* ---- Step 3: adventure preview ----------------------------------------- */

function Preview({
  headingRef,
  interest,
  bySurprise,
  onChange,
  onAnother,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  interest: InterestConfig;
  bySurprise: boolean;
  onChange: () => void;
  onAnother: () => void;
}) {
  // The mission's own story, so the preview and the game cannot disagree.
  const theme = getTheme(interest.mission.themeId);
  const story = fillStory(theme.story, DEMO_NUMBERS);
  return (
    <div
      className={`${interest.className} scene-enter`}
      data-preview={interest.id}
    >
      <StatusBanner />
      <div className="mission-panel mt-4 !p-0 overflow-hidden">
        <InterestScene id={interest.id} />
        <div className="p-5 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-muted">
            Adventure preview &middot; {interest.worldName}
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-1 text-4xl font-extrabold sm:text-5xl"
          >
            {interest.worldName}
          </h1>
          {bySurprise && (
            <p className="mt-2" data-testid="surprise-note">
              Primer picked <strong>{interest.title}</strong> for you.
            </p>
          )}

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-2" aria-labelledby="story">
              <h2 id="story" className="text-lg font-bold">
                The story
              </h2>
              <p className="mt-2 text-xl" data-testid="story">
                {story}
              </p>
              <p className="mt-3 text-xl font-semibold" data-testid="question">
                {interest.question}
              </p>
              <p
                className="mt-4 inline-block rounded-xl border-2 border-current px-3 py-1 text-xl font-extrabold"
                data-testid="number-sentence"
              >
                {DEMO_NUMBERS.start} &minus; {DEMO_NUMBERS.takeAway} = ?
              </p>
              <dl className="mt-4 grid gap-1 text-sm text-muted sm:grid-cols-[auto_1fr] sm:gap-x-3">
                <dt className="font-bold">Counting</dt>
                <dd>{interest.resourceNoun}</dd>
                <dt className="font-bold">Setting</dt>
                <dd>{interest.environment}</dd>
              </dl>
            </section>
            <section className="card p-5" aria-labelledby="guide">
              <h2 id="guide" className="text-lg font-bold">
                Your guide
              </h2>
              <p className="mt-2 text-xl font-extrabold">
                {interest.guideName}
              </p>
              <p className="mt-1 text-muted">{interest.guideDescription}</p>
            </section>
          </div>

          <section
            className="notice mt-5"
            aria-labelledby="status"
            data-testid="availability"
          >
            <h2 id="status" className="text-lg font-bold">
              A draft mission is ready to play
            </h2>
            <p className="mt-1">
              This opens the real draft {interest.title.toLowerCase()} mission,
              with a grown-up guiding. Answers are checked on the server, and
              help is available if you get stuck.
            </p>
            <div className="mt-3">
              <Link href={interest.mission.href} className="btn btn-primary">
                Start the {interest.title.toLowerCase()} mission
              </Link>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onChange}
            >
              Change interest
            </button>
            {bySurprise && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onAnother}
              >
                Surprise me again
              </button>
            )}
          </div>
          <p className="mt-6 text-sm text-muted">
            Draft wording and pictures, not reviewed by an educator. No progress
            is recorded.
          </p>
        </div>
      </div>
    </div>
  );
}
