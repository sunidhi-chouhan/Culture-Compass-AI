"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, RefreshCw } from "lucide-react";
import type { TripItinerary } from "@culturecompass/shared";
import { ItinerarySchedule } from "@/components/itinerary/itinerary-schedule";

export type ItineraryPanelStatus = "idle" | "loading" | "ready" | "empty" | "error";

interface DayItineraryPanelProps {
  status: ItineraryPanelStatus;
  itinerary: TripItinerary | null;
  destinationContext: string;
  errorMessage?: string | null;
  statusLine?: string;
  isRefreshing?: boolean;
  onRetry?: () => void;
  /** Scroll this panel into view when Explore opens. */
  autoFocus?: boolean;
  /** Day to show after TripMate Apply. */
  focusDayNumber?: number | null;
}

export function DayItineraryPanel({
  status,
  itinerary,
  destinationContext,
  errorMessage,
  statusLine = "Charting your days…",
  isRefreshing = false,
  onRetry,
  autoFocus = false,
  focusDayNumber = null,
}: DayItineraryPanelProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const hasDays = Boolean(itinerary?.days.length);
  const showList = (status === "ready" || status === "error") && hasDays;
  const showLoading = (status === "loading" || status === "idle") && !hasDays;
  const showHardError = status === "error" && !hasDays;
  const showEmpty = status === "empty" && !hasDays;
  const dayCount = itinerary?.days.length ?? 0;

  useEffect(() => {
    if (!autoFocus || !sectionRef.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sectionRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [autoFocus]);

  return (
    <section
      ref={sectionRef}
      id="explore-days"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6"
      aria-label="Your itinerary"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="theme-badge text-[10px] tracking-[0.18em]">Explore · Your days</p>
          <h2 className="theme-text mt-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Your itinerary
          </h2>
          <p className="theme-text-muted mt-1 max-w-xl text-sm">
            A day-by-day schedule you can skim, jump, and refine — culture sits just below.
          </p>
        </div>
        {hasDays ? (
          <div className="flex flex-col items-end gap-1">
            <p className="theme-text text-sm font-medium tabular-nums">
              {dayCount} day{dayCount === 1 ? "" : "s"}
            </p>
            {isRefreshing ? (
              <p className="theme-text-subtle text-[11px]" aria-live="polite">
                {statusLine}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="glass-card rounded-2xl border p-4 sm:p-6">
        {errorMessage && hasDays ? (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
            role="status"
          >
            <p className="theme-text text-sm">
              Showing a draft schedule — refresh didn&apos;t complete.
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="theme-chip inline-flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        {showLoading && <LoadingState statusLine={statusLine} />}
        {showHardError && (
          <ErrorState message={errorMessage ?? "Could not chart your days."} onRetry={onRetry} />
        )}
        {showEmpty && <EmptyState onRetry={onRetry} />}
        {showList && itinerary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <ItinerarySchedule
              itinerary={itinerary}
              destinationContext={destinationContext}
              focusDayNumber={focusDayNumber}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

function LoadingState({ statusLine }: { statusLine: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2">
        <CalendarDays className="theme-text-subtle h-4 w-4 animate-pulse" aria-hidden="true" />
        <p className="theme-text text-sm font-medium">{statusLine}</p>
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--surface)]/60"
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="space-y-3" role="alert">
      <p className="theme-text text-sm font-medium">We couldn&apos;t finish your day plan</p>
      <p className="theme-text-muted text-sm leading-relaxed">{message}</p>
      <p className="theme-text-subtle text-xs">
        Your cultural journey below is still available — retry when you&apos;re ready.
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="theme-chip inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry itinerary
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="space-y-3">
      <p className="theme-text text-sm font-medium">No days to show yet</p>
      <p className="theme-text-muted text-sm leading-relaxed">
        JourneyMind couldn&apos;t shape a schedule from this trip context.
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="theme-chip inline-flex items-center gap-2 text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : null}
    </div>
  );
}
