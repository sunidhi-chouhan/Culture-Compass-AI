import {
  tripItinerarySchema,
  tripMateResultSchema,
  tripMateSuggestionActionSchema,
  tripMateSuggestionKindSchema,
  tripMateSuggestionSchema,
  type TripMateResult,
} from "@culturecompass/shared";

/**
 * Keep TripMate usable when Gemini returns extra fields or a malformed action:
 * drop bad actions / itineraries instead of failing the whole improve call.
 */
export function parseTripMateResult(raw: unknown): TripMateResult {
  if (!raw || typeof raw !== "object") {
    return tripMateResultSchema.parse(raw);
  }

  const obj = { ...(raw as Record<string, unknown>) };

  if (Array.isArray(obj.suggestions)) {
    obj.suggestions = obj.suggestions.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const suggestion = { ...(item as Record<string, unknown>) };

      if (suggestion.action != null) {
        const action = tripMateSuggestionActionSchema.safeParse(suggestion.action);
        if (action.success) {
          suggestion.action = action.data;
        } else {
          delete suggestion.action;
        }
      }

      if (suggestion.kind != null) {
        const kind = tripMateSuggestionKindSchema.safeParse(suggestion.kind);
        suggestion.kind = kind.success ? kind.data : "other";
      }

      const parsed = tripMateSuggestionSchema.safeParse(suggestion);
      return parsed.success ? [parsed.data] : [];
    });
  }

  if (obj.improvedItinerary != null) {
    const improved = tripItinerarySchema.safeParse(obj.improvedItinerary);
    if (improved.success) {
      obj.improvedItinerary = improved.data;
    } else {
      delete obj.improvedItinerary;
    }
  }

  return tripMateResultSchema.parse(obj);
}
