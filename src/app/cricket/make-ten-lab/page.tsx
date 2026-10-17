import type { Metadata } from "next";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { MakeTenLab } from "@/components/practice/cricket/MakeTenLab";

export const metadata: Metadata = {
  title: "Draft make-ten activity — Primer Cricket demo",
  description:
    "An adult-operated, unreviewed draft of a make-ten strategy activity. Not part of the scored practice.",
  robots: { index: false, follow: false },
};

export default function MakeTenLabPage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-4xl flex-1 px-4 py-5 sm:px-6 sm:py-8"
    >
      <SiteHeader />
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:mt-6 sm:text-4xl">
        Make a ten with the coach
      </h1>
      <p className="notice mt-2 px-3 py-2 text-sm sm:mt-3 sm:px-4 sm:py-3">
        Draft activity for a grown-up to run. These five steps are a proposal
        that no educator has reviewed. They are separate from the practice and
        the independent check: nothing here is scored, saved or counted as
        evidence, and nothing changes any hint. The lesson uses the
        mission&apos;s numbers (13 take away 5), so run it after the mission,
        not before.
      </p>
      <div className="mt-4 sm:mt-6">
        <MakeTenLab />
      </div>
    </main>
  );
}
