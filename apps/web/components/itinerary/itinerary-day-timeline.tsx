"use client";

import type { DayItinerary, ItinerarySlot } from "@culturecompass/shared";
import { ItineraryActivityCard } from "@/components/itinerary/itinerary-activity-card";
import { formatTravelToNext } from "@/lib/itinerary/format-schedule";

interface ItineraryDayTimelineProps {
  day: DayItinerary;
  destinationContext: string;
}

function shouldShowImage(slot: ItinerarySlot, slots: ItinerarySlot[]): boolean {
  if (slot.featured) return true;
  const anyFeatured = slots.some((s) => s.featured);
  if (anyFeatured) return false;
  const firstWithPlace = slots.find((s) => Boolean(s.placeName));
  return firstWithPlace?.id === slot.id;
}

export function ItineraryDayTimeline({ day, destinationContext }: ItineraryDayTimelineProps) {
  const themeLine = day.summary?.includes("·")
    ? day.summary.split("·")[0]?.trim()
    : day.title?.replace(/^Day\s+\d+\s*·?\s*/i, "").trim();
  const placeLine = day.summary?.includes("·")
    ? day.summary.split("·").slice(1).join("·").trim()
    : day.summary;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <p className="theme-text-subtle text-[11px] font-medium uppercase tracking-[0.14em]">
          Day {day.dayNumber}
        </p>
        {themeLine ? (
          <h3 className="theme-text font-serif text-xl font-semibold tracking-tight sm:text-2xl">
            {themeLine}
          </h3>
        ) : (
          <h3 className="theme-text font-serif text-xl font-semibold tracking-tight sm:text-2xl">
            {day.title?.trim() || `Day ${day.dayNumber}`}
          </h3>
        )}
        {placeLine ? (
          <p className="theme-text-muted text-sm leading-relaxed">{placeLine}</p>
        ) : null}
      </header>

      <ol className="space-y-0">
        {day.slots.map((slot, index) => {
          const isLast = index === day.slots.length - 1;
          const travelLabel = formatTravelToNext(slot.travelMinutesToNext);

          return (
            <li key={slot.id} className="relative">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex w-12 shrink-0 flex-col items-center sm:w-14">
                  <span className="theme-text pt-3 text-xs font-semibold tabular-nums sm:text-sm">
                    {slot.timeLabel || "—"}
                  </span>
                  {!isLast ? (
                    <span
                      className="mt-2 w-px flex-1 bg-[var(--border)]"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1 pb-4">
                  <div className="mb-3 hidden h-px w-full bg-[var(--border)] sm:block" aria-hidden="true" />
                  <ItineraryActivityCard
                    slot={slot}
                    destinationContext={destinationContext}
                    showImage={shouldShowImage(slot, day.slots)}
                  />
                  {!isLast && travelLabel ? (
                    <p className="theme-text-subtle mt-3 pl-1 text-xs">
                      ↓ {slot.travelMinutesToNext} min
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
