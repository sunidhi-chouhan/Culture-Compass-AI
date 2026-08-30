import type { CompassPlanRequest, CompassPlanResponse, ItineraryRequest } from "@culturecompass/shared";

/** Build itinerary request from the active compass request + featured destination. */
export function buildItineraryRequest(
  request: CompassPlanRequest,
  plan: CompassPlanResponse,
): ItineraryRequest {
  const destination =
    request.destination?.trim() ||
    plan.featuredDestination.name ||
    "your destination";

  const interests =
    request.interests.length > 0
      ? request.interests
      : ["culture", "history"];

  const culturalContext = [
    plan.featuredDestination.tagline,
    plan.featuredDestination.rationale,
    ...plan.attractions.slice(0, 4).map((a) => a.name),
    ...plan.hiddenGems.slice(0, 3).map((g) => g.name),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    destination,
    interests,
    duration: request.duration || "3 days",
    travelStyle: request.travelStyle,
    budget: request.budget,
    culturalContext: culturalContext.slice(0, 1200),
    modelPreset: "balanced" as const,
  };
}
