"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TripItinerary } from "@culturecompass/shared";
import { ItineraryDayNav } from "@/components/itinerary/itinerary-day-nav";
import { ItineraryDayTimeline } from "@/components/itinerary/itinerary-day-timeline";

interface ItineraryScheduleProps {
  itinerary: TripItinerary;
  destinationContext: string;
  /** After TripMate Apply, jump to the day that changed. */
  focusDayNumber?: number | null;
}

export function ItinerarySchedule({
  itinerary,
  destinationContext,
  focusDayNumber = null,
}: ItineraryScheduleProps) {
  const days = itinerary.days;
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const dayCount = days.length;
  const activeDay = days[activeIndex] ?? days[0];
  const stickyNav = dayCount >= 4;
  const showCarouselChrome = dayCount >= 2;

  useEffect(() => {
    if (focusDayNumber != null) {
      const idx = itinerary.days.findIndex((d) => d.dayNumber === focusDayNumber);
      if (idx >= 0) {
        setActiveIndex(idx);
        return;
      }
    }
    setActiveIndex(0);
  }, [itinerary.generatedAt, itinerary.days, dayCount, focusDayNumber]);
  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= dayCount) return;
      setActiveIndex(index);
    },
    [dayCount],
  );

  const onSelectDay = useCallback(
    (dayNumber: number) => {
      const idx = days.findIndex((d) => d.dayNumber === dayNumber);
      if (idx >= 0) goTo(idx);
    },
    [days, goTo],
  );

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goTo(activeIndex + 1);
    else goTo(activeIndex - 1);
  }

  if (!activeDay) return null;

  return (
    <div className="space-y-2">
      <ItineraryDayNav
        dayCount={dayCount}
        activeDay={activeDay.dayNumber}
        onSelectDay={onSelectDay}
        sticky={stickyNav}
      />

      {showCarouselChrome ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="theme-text-subtle inline-flex items-center gap-1 text-sm disabled:opacity-30"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Prev
          </button>
          <p className="theme-text-subtle text-xs tabular-nums">
            {activeIndex + 1} / {dayCount}
          </p>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            disabled={activeIndex >= dayCount - 1}
            className="theme-text-subtle inline-flex items-center gap-1 text-sm disabled:opacity-30"
            aria-label="Next day"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="min-h-[12rem]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${activeDay.dayNumber}-${itinerary.generatedAt}`}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <ItineraryDayTimeline day={activeDay} destinationContext={destinationContext} />
          </motion.div>
        </AnimatePresence>
      </div>

      {itinerary.notes ? (
        <p className="theme-text-muted mt-4 text-sm leading-relaxed">{itinerary.notes}</p>
      ) : null}
    </div>
  );
}
