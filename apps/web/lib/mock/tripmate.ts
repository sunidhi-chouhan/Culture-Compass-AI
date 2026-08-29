import type {
  TripItinerary,
  TripMateRequest,
  TripMateResult,
  TripMateSuggestion,
} from "@culturecompass/shared";

function cloneItinerary(itinerary: TripItinerary): TripItinerary {
  return JSON.parse(JSON.stringify(itinerary)) as TripItinerary;
}

function analyzeSchedule(itinerary: TripItinerary): TripMateSuggestion[] {
  const suggestions: TripMateSuggestion[] = [];
  let id = 1;

  for (const day of itinerary.days) {
    for (let i = 0; i < day.slots.length; i++) {
      const slot = day.slots[i];
      const next = day.slots[i + 1];
      const travel = slot.travelMinutesToNext;

      if (travel != null && travel > 0 && travel < 15 && next) {
        suggestions.push({
          id: `tm-${id++}`,
          kind: "conflict",
          severity: "warning",
          title: "Tight schedule",
          dayLabel: `DAY ${day.dayNumber}`,
          headline: `${slot.placeName ?? slot.title} → ${next.placeName ?? next.title}`,
          detail: `Only ${travel} min available between stops — queues and walking will cascade.`,
          recommendation: `Increase the buffer to 25 minutes after ${slot.placeName ?? slot.title}.`,
          relatedSlotIds: [slot.id, next.id],
          action: {
            type: "set_travel_minutes",
            slotId: slot.id,
            travelMinutesToNext: 25,
          },
        });
      }

      if (travel != null && travel >= 45 && next) {
        suggestions.push({
          id: `tm-${id++}`,
          kind: "gap",
          severity: "info",
          title: "Long travel gap",
          dayLabel: `DAY ${day.dayNumber}`,
          headline: `${slot.placeName ?? slot.title} → ${next.placeName ?? next.title}`,
          detail: `${travel} minutes between stops — use the gap or tighten the route.`,
          recommendation: `Move ${next.placeName ?? next.title} earlier to 16:30 to close the gap.`,
          relatedSlotIds: [slot.id, next.id],
          action: {
            type: "set_time_label",
            slotId: next.id,
            timeLabel: "16:30",
          },
        });
      }
    }

    if (day.slots.length >= 2) {
      const a = day.slots[0];
      const b = day.slots[1];
      if (a && b && day.dayNumber % 2 === 0) {
        suggestions.push({
          id: `tm-${id++}`,
          kind: "reorder",
          severity: "info",
          title: "Better activity ordering",
          dayLabel: `DAY ${day.dayNumber}`,
          headline: `${a.placeName ?? a.title} ↔ ${b.placeName ?? b.title}`,
          detail: "Doing the farther stop first often saves backtracking midday.",
          recommendation: `Swap morning and afternoon: visit ${b.placeName ?? b.title} first.`,
          relatedSlotIds: [a.id, b.id],
          action: {
            type: "swap_slots",
            slotIdA: a.id,
            slotIdB: b.id,
          },
        });
      }
    }

    if (day.slots.length >= 3) {
      const totalDuration = day.slots.reduce((sum, s) => sum + (s.durationMinutes ?? 60), 0);
      const longSlot = day.slots.find((s) => (s.durationMinutes ?? 0) > 120);
      if (totalDuration > 360 && longSlot) {
        suggestions.push({
          id: `tm-${id++}`,
          kind: "pacing",
          severity: "warning",
          title: "Overloaded day",
          dayLabel: `DAY ${day.dayNumber}`,
          headline: longSlot.placeName ?? longSlot.title,
          detail: `About ${Math.round(totalDuration / 60)} hours of activities on this day.`,
          recommendation: `Shorten ${longSlot.placeName ?? longSlot.title} to 90 minutes.`,
          relatedSlotIds: [longSlot.id],
          action: {
            type: "shorten_duration",
            slotId: longSlot.id,
            durationMinutes: 90,
          },
        });
      }
    }
  }

  const lastDay = itinerary.days[itinerary.days.length - 1];
  if (lastDay) {
    const eveningId = `tm-add-${lastDay.dayNumber}-evening`;
    suggestions.push({
      id: `tm-${id++}`,
      kind: "cultural",
      severity: "info",
      title: "Nearby experience",
      dayLabel: `DAY ${lastDay.dayNumber}`,
      headline: "Historic district · artisan workshop",
      detail: "You're already near cultural sites — a short workshop rounds out the evening.",
      recommendation: "Add a local artisan workshop at 19:00.",
      relatedSlotIds: [],
      action: {
        type: "add_slot",
        dayNumber: lastDay.dayNumber,
        slot: {
          id: eveningId,
          dayPart: "evening",
          timeLabel: "19:00",
          title: "Local artisan workshop",
          description: "A short hands-on stop with a neighbourhood maker.",
          placeName: "Local artisan workshop",
          category: "experience",
          durationMinutes: 75,
          tags: ["Craft", "Local life"],
          featured: false,
        },
      },
    });
  }

  // Dedupe by id and cap
  const seen = new Set<string>();
  return suggestions
    .filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    })
    .slice(0, 6);
}

function improveItinerary(itinerary: TripItinerary): TripItinerary {
  const next = cloneItinerary(itinerary);
  for (const day of next.days) {
    for (const slot of day.slots) {
      if (slot.travelMinutesToNext != null && slot.travelMinutesToNext < 15) {
        slot.travelMinutesToNext = 20;
      }
    }
  }
  next.notes = next.notes
    ? `${next.notes} TripMate buffer pass available.`
    : "TripMate buffer pass available — prefer applying individual suggestions.";
  next.generatedAt = new Date().toISOString();
  return next;
}

/**
 * Deterministic TripMate mock with actionable per-suggestion patches.
 */
export function getMockTripMateResult(input: TripMateRequest): TripMateResult {
  const destination = input.destination;

  if (!input.itinerary?.days.length && !input.pastedSchedule?.trim()) {
    return {
      analysisSummary: `No schedule yet for ${destination}. Build your days first, or paste / upload an existing plan.`,
      suggestions: [
        {
          id: "tm-empty",
          kind: "other",
          severity: "info",
          title: "Waiting on a schedule",
          detail: "Generate a day-wise itinerary above, or use Already have a plan.",
          recommendation: "Complete Explore days, then tap Analyze my itinerary.",
          relatedSlotIds: [],
        },
      ],
      verificationNotes: "Skipped verification — nothing to check.",
      applied: false,
    };
  }

  if (input.pastedSchedule?.trim() && !input.itinerary?.days.length) {
    return {
      analysisSummary: `Reviewed your external plan for ${destination}. Found pacing risks and a missing cultural evening.`,
      suggestions: [
        {
          id: "tm-paste-1",
          kind: "conflict",
          severity: "warning",
          title: "Morning looks overpacked",
          dayLabel: "DAY 1",
          headline: "Stacked morning sites",
          detail: "Back-to-back major stops leave no buffer for queues or walking.",
          recommendation: "Leave at least 30 minutes between major sites.",
          relatedSlotIds: [],
        },
        {
          id: "tm-paste-2",
          kind: "cultural",
          severity: "info",
          title: "Missing evening texture",
          dayLabel: "DAY 1",
          headline: "Add a local evening",
          detail: "The day ends on sightseeing — a market dinner adds cultural finish.",
          recommendation: "Finish with a neighbourhood market dinner instead of another museum.",
          relatedSlotIds: [],
        },
      ],
      verificationNotes: "Verified pasted notes for pacing language; no structured days to patch.",
      applied: false,
    };
  }

  const itinerary = input.itinerary!;
  const suggestions = analyzeSchedule(itinerary);

  return {
    analysisSummary: `TripMate found ${suggestions.length} opportunit${suggestions.length === 1 ? "y" : "ies"} across ${itinerary.days.length} day(s) in ${destination}.`,
    suggestions,
    improvedItinerary: improveItinerary(itinerary),
    verificationNotes:
      "Checked buffers, order, and durations. Apply suggestions one at a time to stay in control.",
    applied: false,
  };
}

/** Mock extract from an uploaded image filename for demo (no OCR). */
export function mockExtractFromUpload(
  destination: string,
  fileName: string,
): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "uploaded plan";
  return [
    `Extracted from ${base} (demo — no OCR):`,
    `Destination context: ${destination}`,
    "Day 1: 09:00 Heritage site, 12:00 Museum, 15:00 Market, 19:00 Dinner",
    "Day 2: 10:00 Viewpoint, 13:30 Workshop, 18:00 Old town walk",
  ].join("\n");
}
