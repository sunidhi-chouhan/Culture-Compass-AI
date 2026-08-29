import type { Location } from "@culturecompass/shared";

export type TryDestinationsStatus = "loading" | "ready" | "empty" | "error";

interface TryDestinationsSectionProps {
  status: TryDestinationsStatus;
  destinations: Location[];
  skeletonCount: number;
  onSelect: (destination: Location) => void;
}

function TryChipSkeleton({ widthClass }: { widthClass: string }) {
  return (
    <span
      aria-hidden="true"
      className={`theme-chip pointer-events-none inline-flex animate-pulse border-transparent px-3 py-1.5 text-sm ${widthClass}`}
      style={{ background: "var(--muted)", opacity: 0.35, color: "transparent" }}
    >
      Placeholder
    </span>
  );
}

const SKELETON_WIDTHS = ["w-14", "w-16", "w-[4.5rem]", "w-20", "w-[4.75rem]"] as const;

export function TryDestinationsSection({
  status,
  destinations,
  skeletonCount,
  onSelect,
}: TryDestinationsSectionProps) {
  return (
    <div
      className="mt-4 flex min-h-[2.125rem] flex-wrap items-center justify-center gap-2"
      aria-busy={status === "loading"}
      aria-live="polite"
    >
      <span className="theme-text-subtle shrink-0 text-xs">Try:</span>

      {status === "loading" &&
        Array.from({ length: skeletonCount }, (_, index) => (
          <TryChipSkeleton
            key={`try-skeleton-${index}`}
            widthClass={SKELETON_WIDTHS[index % SKELETON_WIDTHS.length]}
          />
        ))}

      {status === "ready" &&
        destinations.map((destination) => (
          <button
            key={destination.id}
            type="button"
            onClick={() => onSelect(destination)}
            className="theme-chip text-xs sm:text-sm"
          >
            {destination.name}
          </button>
        ))}

      {status === "empty" && (
        <span className="theme-text-subtle text-xs sm:text-sm">
          Suggestions unavailable right now
        </span>
      )}

      {status === "error" && (
        <span className="theme-text-subtle text-xs sm:text-sm">
          Could not load suggestions
        </span>
      )}
    </div>
  );
}
