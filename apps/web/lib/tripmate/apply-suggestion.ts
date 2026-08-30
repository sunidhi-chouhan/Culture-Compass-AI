import type {
  TripItinerary,
  TripMateSuggestion,
  TripMateSuggestionAction,
} from "@culturecompass/shared";

function cloneItinerary(itinerary: TripItinerary): TripItinerary {
  return JSON.parse(JSON.stringify(itinerary)) as TripItinerary;
}

function findSlot(
  itinerary: TripItinerary,
  slotId: string,
): { dayIndex: number; slotIndex: number } | null {
  for (let d = 0; d < itinerary.days.length; d++) {
    const slotIndex = itinerary.days[d].slots.findIndex((s) => s.id === slotId);
    if (slotIndex >= 0) return { dayIndex: d, slotIndex };
  }
  return null;
}

export interface ApplySuggestionResult {
  itinerary: TripItinerary;
  summary: string;
  dayNumber: number | null;
}

function summarizeAction(
  itinerary: TripItinerary,
  action: TripMateSuggestionAction,
): { summary: string; dayNumber: number | null } {
  switch (action.type) {
    case "set_travel_minutes": {
      const loc = findSlot(itinerary, action.slotId);
      const dayNumber = loc ? itinerary.days[loc.dayIndex].dayNumber : null;
      const place =
        loc != null
          ? itinerary.days[loc.dayIndex].slots[loc.slotIndex].placeName ??
            itinerary.days[loc.dayIndex].slots[loc.slotIndex].title
          : "stop";
      return {
        dayNumber,
        summary: `Day ${dayNumber ?? "?"} · buffer after ${place} → ${action.travelMinutesToNext} min`,
      };
    }
    case "set_time_label": {
      const loc = findSlot(itinerary, action.slotId);
      const dayNumber = loc ? itinerary.days[loc.dayIndex].dayNumber : null;
      const place =
        loc != null
          ? itinerary.days[loc.dayIndex].slots[loc.slotIndex].placeName ??
            itinerary.days[loc.dayIndex].slots[loc.slotIndex].title
          : "stop";
      return {
        dayNumber,
        summary: `Day ${dayNumber ?? "?"} · ${place} moved to ${action.timeLabel}`,
      };
    }
    case "shorten_duration": {
      const loc = findSlot(itinerary, action.slotId);
      const dayNumber = loc ? itinerary.days[loc.dayIndex].dayNumber : null;
      const place =
        loc != null
          ? itinerary.days[loc.dayIndex].slots[loc.slotIndex].placeName ??
            itinerary.days[loc.dayIndex].slots[loc.slotIndex].title
          : "stop";
      return {
        dayNumber,
        summary: `Day ${dayNumber ?? "?"} · ${place} shortened to ${action.durationMinutes} min`,
      };
    }
    case "swap_slots": {
      const a = findSlot(itinerary, action.slotIdA);
      const dayNumber = a ? itinerary.days[a.dayIndex].dayNumber : null;
      return {
        dayNumber,
        summary: `Day ${dayNumber ?? "?"} · swapped morning/afternoon order`,
      };
    }
    case "add_slot": {
      return {
        dayNumber: action.dayNumber,
        summary: `Day ${action.dayNumber} · added ${action.slot.placeName ?? action.slot.title}`,
      };
    }
    default:
      return { dayNumber: null, summary: "Schedule updated" };
  }
}

export function applySuggestionAction(
  itinerary: TripItinerary,
  action: TripMateSuggestionAction,
): ApplySuggestionResult | null {
  const next = cloneItinerary(itinerary);
  const meta = summarizeAction(itinerary, action);

  switch (action.type) {
    case "set_travel_minutes": {
      const loc = findSlot(next, action.slotId);
      if (!loc) return null;
      next.days[loc.dayIndex].slots[loc.slotIndex].travelMinutesToNext =
        action.travelMinutesToNext;
      break;
    }
    case "set_time_label": {
      const loc = findSlot(next, action.slotId);
      if (!loc) return null;
      next.days[loc.dayIndex].slots[loc.slotIndex].timeLabel = action.timeLabel;
      break;
    }
    case "shorten_duration": {
      const loc = findSlot(next, action.slotId);
      if (!loc) return null;
      next.days[loc.dayIndex].slots[loc.slotIndex].durationMinutes = action.durationMinutes;
      break;
    }
    case "swap_slots": {
      const a = findSlot(next, action.slotIdA);
      const b = findSlot(next, action.slotIdB);
      if (!a || !b || a.dayIndex !== b.dayIndex) return null;
      const day = next.days[a.dayIndex];
      const tmp = day.slots[a.slotIndex];
      const timeA = tmp.timeLabel;
      const timeB = day.slots[b.slotIndex].timeLabel;
      day.slots[a.slotIndex] = { ...day.slots[b.slotIndex], timeLabel: timeA };
      day.slots[b.slotIndex] = { ...tmp, timeLabel: timeB };
      break;
    }
    case "add_slot": {
      const day = next.days.find((d) => d.dayNumber === action.dayNumber);
      if (!day) return null;
      if (day.slots.some((s) => s.id === action.slot.id)) return null;
      day.slots.push(action.slot);
      day.slots.sort((x, y) => (x.timeLabel ?? "").localeCompare(y.timeLabel ?? ""));
      break;
    }
    default:
      return null;
  }

  next.generatedAt = new Date().toISOString();
  return {
    itinerary: next,
    summary: meta.summary,
    dayNumber: meta.dayNumber,
  };
}

export function applySuggestion(
  itinerary: TripItinerary,
  suggestion: TripMateSuggestion,
): ApplySuggestionResult | null {
  if (!suggestion.action) return null;
  return applySuggestionAction(itinerary, suggestion.action);
}

/**
 * Prove mock TripMate actions mutate a real itinerary.
 * Returns per-suggestion before/after digests for tests and eval.
 */
export function proveMockApplyPath(itinerary: TripItinerary, suggestions: TripMateSuggestion[]) {
  let current = cloneItinerary(itinerary);
  const steps: Array<{
    suggestionId: string;
    actionType: string;
    summary: string;
    changed: boolean;
  }> = [];

  for (const suggestion of suggestions) {
    if (!suggestion.action) continue;
    const before = JSON.stringify(current);
    const applied = applySuggestion(current, suggestion);
    if (!applied) {
      steps.push({
        suggestionId: suggestion.id,
        actionType: suggestion.action.type,
        summary: "apply failed",
        changed: false,
      });
      continue;
    }
    current = applied.itinerary;
    steps.push({
      suggestionId: suggestion.id,
      actionType: suggestion.action.type,
      summary: applied.summary,
      changed: JSON.stringify(current) !== before,
    });
  }

  return { itinerary: current, steps };
}
