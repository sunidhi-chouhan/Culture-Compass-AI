import { buildPlaceSearchUrl } from "@/lib/place-search-url";

interface PlaceLinkProps {
  name: string;
  destinationContext?: string;
  className?: string;
}

export function PlaceLink({ name, destinationContext, className = "" }: PlaceLinkProps) {
  return (
    <a
      href={buildPlaceSearchUrl(name, destinationContext)}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline decoration-[var(--border)] underline-offset-2 transition-colors hover:text-[var(--foreground)] hover:decoration-[var(--foreground)] ${className}`}
    >
      {name}
    </a>
  );
}
