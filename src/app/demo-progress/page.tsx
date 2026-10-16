import type { Metadata } from "next";
import Link from "next/link";
import { ProgressSummary } from "@/components/assessment/ProgressSummary";

export const metadata: Metadata = {
  title: "Demo learning evidence summary — Primer",
  description:
    "A synthetic-data demonstration of an adult-facing summary of one independent check.",
};

export default function DemoProgressPage() {
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
        Learning evidence summary (demo)
      </h1>
      <div className="mt-6">
        <ProgressSummary />
      </div>
    </main>
  );
}
