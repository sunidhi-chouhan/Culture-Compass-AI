"use client";

interface ItineraryDayNavProps {
  dayCount: number;
  activeDay: number;
  onSelectDay: (dayNumber: number) => void;
  sticky?: boolean;
}

export function ItineraryDayNav({
  dayCount,
  activeDay,
  onSelectDay,
  sticky = false,
}: ItineraryDayNavProps) {
  if (dayCount <= 1) return null;

  return (
    <div
      className={
        sticky
          ? "sticky top-16 z-20 -mx-1 mb-4 bg-[var(--background)]/90 px-1 py-2 backdrop-blur-md"
          : "mb-4"
      }
      role="tablist"
      aria-label="Itinerary days"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: dayCount }, (_, i) => {
          const dayNumber = i + 1;
          const selected = dayNumber === activeDay;
          return (
            <button
              key={dayNumber}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onSelectDay(dayNumber)}
              className={`theme-chip shrink-0 text-sm ${selected ? "theme-chip-active" : ""}`}
            >
              Day {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}
