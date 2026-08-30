"use client";

import {
  EXPLORE_JUMP_HREFS,
  EXPLORE_JUMP_STAGES,
  type ExploreJumpStage,
} from "@/lib/journey-stages";

interface JourneyCompanionNavProps {
  /** Highlight which Explore-workspace stage the user is focused on. */
  active?: ExploreJumpStage;
}

/**
 * Sticky jump links for Explore → Improve → Prepare on the workspace.
 * Respects prefers-reduced-motion via CSS scroll-behavior + globals.
 */
export function JourneyCompanionNav({ active = "Explore" }: JourneyCompanionNavProps) {
  return (
    <nav
      aria-label="Companion stages on this journey"
      className="sticky top-14 z-20 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--background)]/75"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:gap-2 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="theme-text-subtle mr-1 hidden shrink-0 text-[10px] uppercase tracking-[0.16em] sm:block">
          On this journey
        </p>
        {EXPLORE_JUMP_STAGES.map((stage) => {
          const isActive = stage === active;
          return (
            <a
              key={stage}
              href={EXPLORE_JUMP_HREFS[stage]}
              className={
                isActive
                  ? "theme-badge shrink-0 text-[9px] tracking-[0.12em] sm:text-[10px]"
                  : "theme-text-muted shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-colors hover:text-[var(--foreground)] sm:text-[11px]"
              }
              aria-current={isActive ? "true" : undefined}
            >
              {stage}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
