import Link from "next/link";
import { Wordmark } from "./Wordmark";

/** Slim header for every page except the home page, which has its own hero. */
export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <Wordmark className="text-2xl" />
      <Link href="/" className="font-semibold underline underline-offset-4">
        Back to Primer home
      </Link>
    </header>
  );
}
