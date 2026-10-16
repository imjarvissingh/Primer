import type { Metadata } from "next";
import Link from "next/link";
import { AssessmentCheck } from "@/components/assessment/AssessmentCheck";

export const metadata: Metadata = {
  title: "Independent check — Primer demo",
  description:
    "A draft demonstration of a short independent subtraction check with no hints.",
};

export default function AssessmentPage() {
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
        Independent check
      </h1>
      <p className="mt-3 rounded-lg border-2 border-border p-3 text-sm">
        Draft demonstration. These questions have not been reviewed by an
        educator, and this is not a tested assessment. It collects no
        information and saves nothing beyond a short-lived in-memory session.
      </p>
      <div className="mission-panel mt-6">
        <AssessmentCheck />
      </div>
    </main>
  );
}
