import { SiteHeader } from "@/components/brand/SiteHeader";
import type { ThemeConfig } from "@/themes";
import { PracticeMission } from "./PracticeMission";

/** Page frame shared by every themed mission route. A server component. */
export function MissionPage({ theme }: { theme: ThemeConfig }) {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 sm:px-6 sm:py-8"
    >
      <SiteHeader />
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:mt-6 sm:text-4xl">
        {theme.displayName}
      </h1>
      <p className="notice mt-2 px-3 py-2 text-sm sm:mt-3 sm:px-4 sm:py-3">
        Draft demonstration. This practice mission and its hints have not been
        reviewed by an educator, and it is not a tested learning product. It
        collects no information and saves nothing. Starting over, or refreshing
        this page, begins a new practice session; each mission has its own.
      </p>
      <div className="mt-4 sm:mt-6">
        <PracticeMission theme={theme} />
      </div>
    </main>
  );
}
