"use client";

import Image from "next/image";
import type { ItinerarySlot } from "@culturecompass/shared";
import { PlaceLink } from "@/components/place/place-link";
import {
  formatDurationMinutes,
  formatTravelToNext,
  getSlotImageUrl,
  slotImageSeed,
} from "@/lib/itinerary/format-schedule";

interface ItineraryActivityCardProps {
  slot: ItinerarySlot;
  destinationContext: string;
  showImage?: boolean;
}

export function ItineraryActivityCard({
  slot,
  destinationContext,
  showImage = false,
}: ItineraryActivityCardProps) {
  const duration = formatDurationMinutes(slot.durationMinutes);
  const travel = formatTravelToNext(slot.travelMinutesToNext);
  const tags = slot.tags?.length ? slot.tags : slot.category ? [slot.category] : [];
  const seed = slotImageSeed(slot);

  return (
    <article className="glass-card overflow-hidden rounded-2xl border">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <div className="min-w-0 flex-1">
          {slot.timeLabel ? (
            <p className="theme-text text-xs font-semibold tabular-nums tracking-wide sm:text-sm">
              {slot.timeLabel}
            </p>
          ) : null}

          <div className="mt-1.5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="theme-text text-sm font-semibold leading-snug sm:text-base">
                {slot.placeName ? (
                  <PlaceLink
                    name={slot.placeName}
                    destinationContext={destinationContext}
                    className="font-semibold no-underline hover:underline"
                  />
                ) : (
                  slot.title
                )}
              </h4>
              {slot.placeName && slot.title !== slot.placeName ? (
                <p className="theme-text-muted mt-0.5 text-xs sm:text-sm">{slot.title}</p>
              ) : null}
              {tags.length > 0 ? (
                <p className="theme-text-subtle mt-1 text-[11px] uppercase tracking-[0.08em]">
                  {tags.join(" · ")}
                </p>
              ) : null}
            </div>

            {showImage ? (
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-28">
                <Image
                  src={getSlotImageUrl(seed)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            ) : null}
          </div>

          {slot.description ? (
            <p className="theme-text-muted mt-2 text-sm leading-relaxed">{slot.description}</p>
          ) : null}

          {(duration || travel) && (
            <p className="theme-text-subtle mt-3 text-xs">
              {[duration, travel].filter(Boolean).join("  ·  ")}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
