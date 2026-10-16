import { SiteHeader } from "@/components/brand/SiteHeader";
import type { ThemeConfig } from "@/themes";
import { PracticeMission } from "./PracticeMission";

/** Page frame shared by every themed mission route. A server component. */
export function MissionPage({ theme }: { theme: ThemeConfig }) {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6"
    >
      <SiteHeader />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {theme.displayName}
      </h1>
      <p className="notice mt-3 text-sm">
        Draft demonstration. This practice mission and its hints have not been
        reviewed by an educator, and it is not a tested learning product. It
        collects no information and saves nothing. Starting over, or refreshing
        this page, begins a new practice session; each mission has its own.
      </p>
      <div className="mt-6">
        <PracticeMission theme={theme} />
      </div>
    </main>
  );
}
