import Link from "next/link";

type ExperienceCardProps = {
  name: string;
  description: string;
  /** When set, the experience is playable and the card links to it. */
  href?: string;
  linkLabel?: string;
};

export function ExperienceCard({
  name,
  description,
  href,
  linkLabel,
}: ExperienceCardProps) {
  return (
    <li className="rounded-lg border border-border p-5">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-muted">{description}</p>
      {href === undefined ? (
        <p className="mt-3 text-sm font-medium">Planned — not yet available</p>
      ) : (
        <p className="mt-3 text-sm font-medium">
          Draft demo —{" "}
          <Link href={href} className="underline">
            {linkLabel ?? "Try it"}
          </Link>
        </p>
      )}
    </li>
  );
}
