import Link from "next/link";
import { ExperienceCard } from "@/components/ExperienceCard";
import { THEMES } from "@/themes";

export default function Home() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16"
    >
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Primer</h1>
      <p className="mt-4 text-lg text-muted">
        Primer turns a child&rsquo;s interests into a math adventure for ages
        6&ndash;9, starting with subtraction within 20. It is designed to
        measure real understanding, not just engagement.
      </p>

      <section aria-labelledby="experiences" className="mt-10">
        <h2 id="experiences" className="text-2xl font-semibold">
          Experiences
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {THEMES.map((theme) => (
            <ExperienceCard
              key={theme.id}
              name={theme.displayName}
              description={theme.cardDescription}
              href={theme.href}
              linkLabel={theme.cardLinkLabel}
            />
          ))}
        </ul>
        <p className="mt-4 text-muted">
          Both experiences share one curriculum and one learning engine.
        </p>
      </section>

      <section aria-labelledby="check" className="mt-10">
        <h2 id="check" className="text-2xl font-semibold">
          Independent check
        </h2>
        <p className="mt-2 text-muted">
          A short check with no hints and no right-or-wrong feedback. Guided
          practice above can use hints; this check cannot, so it shows what was
          answered independently. When it ends, a summary for a grown-up opens
          from the last screen. It uses made-up demo sessions only and does not
          award mastery.
        </p>
        <p className="mt-3 font-medium">
          Draft demo &mdash;{" "}
          <Link href="/assessment" className="underline">
            Try the independent check
          </Link>
        </p>
      </section>

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        Primer is in early development. The playable missions and the check are
        draft demonstrations that have not been reviewed by an educator. This
        site collects no information.
      </p>
    </main>
  );
}
