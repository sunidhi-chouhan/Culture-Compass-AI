import { itineraryResponseSchema, type ItineraryResponse } from "@culturecompass/shared";

/**
 * Gemini often returns the itinerary object at the root (`{ days }`) while
 * the API contract is `{ itinerary: { days } }`. Accept both.
 */
export function parseItineraryResponse(raw: unknown): ItineraryResponse {
  const wrapped = wrapItineraryPayload(raw);
  const itinerary = sanitizeItineraryFields({ ...wrapped.itinerary });
  return itineraryResponseSchema.parse({ itinerary });
}

function wrapItineraryPayload(raw: unknown): { itinerary: Record<string, unknown> } {
  if (!raw || typeof raw !== "object") {
    return { itinerary: {} };
  }

  const obj = raw as Record<string, unknown>;
  const nested = obj.itinerary;

  if (nested && typeof nested === "object" && !Array.isArray(nested) && "days" in nested) {
    return { itinerary: { ...(nested as Record<string, unknown>) } };
  }

  if (Array.isArray(obj.days)) {
    return { itinerary: { ...obj } };
  }

  return { itinerary: obj };
}

function sanitizeItineraryFields(itinerary: Record<string, unknown>): Record<string, unknown> {
  if (itinerary.generatedAt != null && typeof itinerary.generatedAt !== "string") {
    delete itinerary.generatedAt;
  } else if (typeof itinerary.generatedAt === "string") {
    const isoOffset =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (!isoOffset.test(itinerary.generatedAt)) {
      delete itinerary.generatedAt;
    }
  }

  if (Array.isArray(itinerary.days)) {
    itinerary.days = itinerary.days.map((day) => {
      if (!day || typeof day !== "object") return day;
      const next = { ...(day as Record<string, unknown>) };
      if (!Array.isArray(next.slots)) return next;
      next.slots = next.slots.map((slot) => coerceSlot(slot));
      return next;
    });
  }

  return itinerary;
}

const DAY_PARTS = new Set(["morning", "afternoon", "evening", "night", "flexible"]);

function coerceSlot(slot: unknown): unknown {
  if (!slot || typeof slot !== "object") return slot;
  const next = { ...(slot as Record<string, unknown>) };

  if (typeof next.dayPart === "string") {
    const normalized = next.dayPart.trim().toLowerCase();
    next.dayPart = DAY_PARTS.has(normalized) ? normalized : "flexible";
  }

  if (typeof next.durationMinutes === "string" && next.durationMinutes.trim()) {
    const n = Number(next.durationMinutes);
    if (Number.isFinite(n)) next.durationMinutes = Math.round(n);
  }

  if (typeof next.travelMinutesToNext === "string" && next.travelMinutesToNext.trim()) {
    const n = Number(next.travelMinutesToNext);
    if (Number.isFinite(n)) next.travelMinutesToNext = Math.round(n);
  }

  return next;
}
