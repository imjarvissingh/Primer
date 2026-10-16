import type { ReactNode } from "react";
import Link from "next/link";
import type { ThemeConfig } from "@/themes";
import { PracticeMission } from "./PracticeMission";

/** Page frame shared by every themed mission route. A server component. */
export function MissionPage({
  theme,
  scene,
}: {
  theme: ThemeConfig;
  scene: ReactNode;
}) {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6"
    >
      <p>
        <Link href="/" className="underline">
          Back to Primer home
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        {theme.displayName}
      </h1>
      <p className="mt-3 rounded-lg border-2 border-border p-3 text-sm">
        Draft demonstration. This practice mission and its hints have not been
        reviewed by an educator, and it is not a tested learning product. It
        collects no information and saves nothing. Starting over begins a new
        practice session; each mission has its own.
      </p>
      <div className="mt-6">
        <PracticeMission theme={theme} scene={scene} />
      </div>
    </main>
  );
}
