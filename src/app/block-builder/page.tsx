import type { Metadata } from "next";
import Link from "next/link";
import { BridgeMission } from "@/components/block-builder/BridgeMission";

export const metadata: Metadata = {
  title: "The Broken Bridge — Primer Block Builder demo",
  description:
    "A draft demonstration of one Block Builder practice mission: subtraction within 20.",
};

export default function BlockBuilderPage() {
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
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Block Builder</h1>
      <p className="mt-3 rounded-lg border-2 border-border p-3 text-sm">
        Draft demonstration. This practice mission and its hints have not been
        reviewed by an educator, and it is not a tested learning product. It
        collects no information and saves nothing.
      </p>
      <div className="mt-6">
        <BridgeMission />
      </div>
    </main>
  );
}
