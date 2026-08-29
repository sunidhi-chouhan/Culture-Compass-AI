import type {
  CompassPlanRequest,
  CompassPlanResponse,
  JourneyPreferences,
  PackingList,
  SavedJourney,
  TripItinerary,
  TripMateResult,
} from "@culturecompass/shared";
import { createJourneyId } from "@/lib/journey-library-storage";

const STYLE_TO_COMPANION: Record<string, string> = {
  solo: "Solo",
  relaxed: "Couple",
  adventurous: "Friends",
  family: "Family",
};

export function preferencesFromRequest(
  request: CompassPlanRequest,
  destinationFallback = "",
): JourneyPreferences {
  return {
    destination: request.destination?.trim() || destinationFallback,
    interests: request.interests,
    companion: STYLE_TO_COMPANION[request.travelStyle] ?? null,
    budget: request.budget,
    duration: request.duration,
    customDuration: "",
  };
}

export function defaultJourneyTitle(
  destination: string,
  duration?: string | null,
): string {
  const place = destination.trim() || "Untitled journey";
  const when = duration?.trim();
  return when ? `${place} · ${when}` : place;
}

export function requestFromSavedJourney(journey: SavedJourney): CompassPlanRequest {
  if (journey.compassRequest) return journey.compassRequest;

  const prefs = journey.preferences;
  const companionToStyle: Record<string, string> = {
    Solo: "solo",
    Couple: "relaxed",
    Friends: "adventurous",
    Family: "family",
  };

  return {
    destination: prefs.destination || journey.culturalPlan.featuredDestination.name,
    interests: prefs.interests.length ? prefs.interests : ["Culture"],
    budget: prefs.budget || "moderate",
    duration: prefs.duration || prefs.customDuration || "3 Days",
    travelStyle: (prefs.companion && companionToStyle[prefs.companion]) || "solo",
    notes: "",
    lensMode: "tourist",
  };
}

export interface BuildSavedJourneyInput {
  plan: CompassPlanResponse;
  request: CompassPlanRequest;
  itinerary?: TripItinerary | null;
  tripMate?: TripMateResult | null;
  packing?: PackingList | null;
  existing?: SavedJourney | null;
  title?: string;
  now?: Date;
}

export function buildSavedJourney(input: BuildSavedJourneyInput): SavedJourney {
  const nowIso = (input.now ?? new Date()).toISOString();
  const destination =
    input.request.destination?.trim() ||
    input.plan.featuredDestination.name ||
    "Journey";
  const itinerary = input.itinerary ?? input.plan.itinerary;
  const title =
    input.title?.trim() ||
    input.existing?.title ||
    defaultJourneyTitle(destination, input.request.duration);

  const culturalPlan: CompassPlanResponse = itinerary
    ? { ...input.plan, itinerary }
    : input.plan;

  return {
    id: input.existing?.id ?? createJourneyId(),
    title,
    createdAt: input.existing?.createdAt ?? nowIso,
    updatedAt: nowIso,
    preferences: preferencesFromRequest(input.request, destination),
    culturalPlan,
    itinerary: itinerary ?? undefined,
    packing: input.packing ?? input.existing?.packing,
    tripMate: input.tripMate ?? input.existing?.tripMate,
    compassRequest: input.request,
    userId: null,
  };
}
