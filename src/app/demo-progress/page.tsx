import type { Metadata } from "next";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { ProgressSummary } from "@/components/assessment/ProgressSummary";

export const metadata: Metadata = {
  title: "Demo learning evidence summary — Primer",
  description:
    "A synthetic-data demonstration of an adult-facing summary of one independent check.",
  // The URL carries a session id that works as an access capability.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function DemoProgressPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6"
    >
      <SiteHeader />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Learning evidence summary (demo)
      </h1>
      <div className="mt-6">
        <ProgressSummary />
      </div>
    </main>
  );
}
