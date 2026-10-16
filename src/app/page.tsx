import { ExperienceCard } from "@/components/ExperienceCard";

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
          Planned experiences
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          <ExperienceCard
            name="Block Builder"
            description="Build bridges and structures while practicing subtraction."
          />
          <ExperienceCard
            name="Space Construction"
            description="Assemble a space station while practicing subtraction."
          />
        </ul>
        <p className="mt-4 text-muted">
          Both experiences will share one curriculum and one learning engine.
        </p>
      </section>

      <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
        Primer is in early development. This page collects no information and
        has no playable game yet.
      </p>
    </main>
  );
}
