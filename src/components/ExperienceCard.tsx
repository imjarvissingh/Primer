import type { ReactNode } from "react";
import Link from "next/link";

type ExperienceCardProps = {
  name: string;
  description: string;
  /** When set, the experience is playable and the card links to it. */
  href?: string;
  linkLabel?: string;
  /** Decorative artwork shown above the text (hidden from assistive tech). */
  art?: ReactNode;
  /** Theme class (e.g. "theme-space") so the card wears its world's palette. */
  themeClass?: string;
};

export function ExperienceCard({
  name,
  description,
  href,
  linkLabel,
  art,
  themeClass = "",
}: ExperienceCardProps) {
  return (
    <li className={`${themeClass} card flex flex-col overflow-hidden`}>
      {art !== undefined && <div className="overflow-hidden">{art}</div>}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold">{name}</h3>
        <p className="mt-2 flex-1 text-muted">{description}</p>
        {href === undefined ? (
          <p className="mt-4 text-sm font-medium">
            Planned — not yet available
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={href} className="btn btn-primary">
              {linkLabel ?? "Try it"}
            </Link>
            <span className="rounded-full border-2 border-current px-3 py-0.5 text-sm font-semibold">
              Draft demo
            </span>
          </div>
        )}
      </div>
    </li>
  );
}
