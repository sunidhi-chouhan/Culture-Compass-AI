import { JOURNEY_STAGES, type JourneyStage } from "@/lib/journey-stages";

interface JourneyStageRailProps {
  current: JourneyStage;
  /** Visually quieter rail (planner chrome, sticky bars). */
  compact?: boolean;
  className?: string;
}

/**
 * Cross-flow stage labels: Discover → Prepare.
 * Current stage is emphasized; earlier stages read as completed.
 */
export function JourneyStageRail({
  current,
  compact = false,
  className = "",
}: JourneyStageRailProps) {
  const currentIndex = JOURNEY_STAGES.indexOf(current);

  return (
    <nav
      aria-label="Journey stages"
      className={`overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      <ol
        className={`mx-auto flex w-max max-w-full items-center ${
          compact ? "gap-1.5 sm:gap-2" : "gap-2 sm:gap-2.5"
        }`}
      >
        {JOURNEY_STAGES.map((stage, index) => {
          const isCurrent = stage === current;
          const isPast = index < currentIndex;
          return (
            <li key={stage} className="flex items-center gap-1.5 sm:gap-2">
              {index > 0 ? (
                <span
                  className={`block h-px w-2 shrink-0 sm:w-3 ${
                    isPast || isCurrent
                      ? "bg-[var(--accent)]/50"
                      : "bg-[var(--border)]"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={
                  isCurrent
                    ? compact
                      ? "theme-text text-[10px] font-semibold tracking-wide sm:text-[11px]"
                      : "theme-badge text-[9px] tracking-[0.14em] sm:text-[10px]"
                    : isPast
                      ? "theme-text-muted text-[10px] font-medium tracking-wide sm:text-[11px]"
                      : "theme-text-subtle text-[10px] tracking-wide sm:text-[11px]"
                }
                aria-current={isCurrent ? "step" : undefined}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
