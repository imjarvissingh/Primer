import Link from "next/link";
import { Wordmark } from "./Wordmark";

/** Slim header for every page except the home page, which has its own hero. */
export function SiteHeader({
  showInterestLink = true,
}: {
  showInterestLink?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <Wordmark className="text-2xl" />
      <nav aria-label="Primer" className="flex flex-wrap gap-x-4 gap-y-1">
        {showInterestLink && (
          <Link
            href="/welcome"
            className="font-semibold underline underline-offset-4"
          >
            Choose an interest
          </Link>
        )}
        <Link href="/" className="font-semibold underline underline-offset-4">
          Back to Primer home
        </Link>
      </nav>
    </header>
  );
}
