import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ExperienceCard } from "@/components/ExperienceCard";
import { BridgeScene } from "@/components/practice/scenes/BridgeScene";
import { SpaceScene } from "@/components/practice/scenes/SpaceScene";
import {
  BasketballScene,
  CricketScene,
  SoccerScene,
} from "@/components/practice/scenes/SportsScenes";
import { THEMES, type ThemeId } from "@/themes";

const ART: Record<ThemeId, React.ReactNode> = {
  "block-builder": <BridgeScene />,
  "space-construction": <SpaceScene />,
  "cricket-academy": <CricketScene />,
  "basketball-challenge": <BasketballScene />,
  "soccer-quest": <SoccerScene />,
};

const STEPS = [
  [
    "Pick a world",
    "Math is the same in every world. Only the story changes, to something a child loves.",
  ],
  [
    "Build with the numbers",
    "Move blocks or modules, count what is left, and get gentle hints when stuck.",
  ],
  [
    "Check alone, later",
    "A separate short check has no hints, so a grown-up sees what was done independently.",
  ],
] as const;

export default function Home() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14"
    >
      <header>
        <p className="inline-block rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold">
          Draft demonstration &middot; not a finished product
        </p>
        <h1 className="mt-4 text-[min(3rem,15vw)] sm:text-6xl">
          <Wordmark />
        </h1>
        <p className="mt-4 max-w-2xl text-2xl font-semibold leading-snug sm:text-3xl">
          Math becomes an adventure shaped by what a child loves.
        </p>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Primer is for children ages 6&ndash;9, starting with subtraction
          within 20. Instead of one story for everyone, practice happens inside
          a world the child cares about, with the same careful math underneath.
        </p>
        <p className="mt-6">
          <Link href="/welcome" className="btn btn-primary">
            Start: choose what your child loves
          </Link>
        </p>
      </header>

      <section aria-labelledby="steps" className="mt-10">
        <h2 id="steps" className="sr-only">
          How Primer works
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <div key={title} className="card p-4">
              <p className="text-sm font-bold text-muted">
                <span aria-hidden="true">{i + 1}. </span>
                {title}
              </p>
              <p className="mt-1">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="experiences" className="mt-12">
        <h2 id="experiences" className="text-3xl font-bold">
          Choose a world
        </h2>
        <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {THEMES.map((theme) => (
            <ExperienceCard
              key={theme.id}
              name={theme.displayName}
              description={theme.cardDescription}
              href={theme.href}
              linkLabel={theme.cardLinkLabel}
              art={ART[theme.id]}
              themeClass={theme.className}
            />
          ))}
        </ul>
        <p className="mt-4 text-muted">
          All five worlds share one curriculum and one learning engine; only the
          story and pictures change.
        </p>
      </section>

      <section aria-labelledby="check" className="card mt-12 p-5 sm:p-6">
        <h2 id="check" className="text-2xl font-bold">
          Independent check
        </h2>
        <p className="mt-2 max-w-2xl text-muted">
          A short check with no hints and no right-or-wrong feedback. Guided
          practice can use hints; this check cannot, so it shows what was
          answered independently. When it ends, a summary for a grown-up opens
          from the last screen. It uses made-up demo sessions only and does not
          award mastery.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/assessment" className="btn btn-secondary">
            Try the independent check
          </Link>
          <span className="rounded-full border-2 border-current px-3 py-0.5 text-sm font-semibold">
            Draft demo
          </span>
        </div>
      </section>

      <p className="mt-12 border-t border-border pt-6 text-sm text-muted">
        Primer is in early development. The playable missions and the check are
        draft demonstrations that have not been reviewed by an educator. This
        site collects no information.
      </p>
    </main>
  );
}
