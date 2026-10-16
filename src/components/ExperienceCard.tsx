type ExperienceCardProps = {
  name: string;
  description: string;
};

export function ExperienceCard({ name, description }: ExperienceCardProps) {
  return (
    <li className="rounded-lg border border-border p-5">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-muted">{description}</p>
      <p className="mt-3 text-sm font-medium">Planned — not yet available</p>
    </li>
  );
}
