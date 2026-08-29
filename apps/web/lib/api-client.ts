import type {
  CompassPlanRequest,
  CompassPlanResponse,
  DestinationsRequest,
  DestinationsResponse,
  AttractionsRequest,
  AttractionsResponse,
  HiddenGemsRequest,
  HiddenGemsResponse,
  StoryRequest,
  StoryResponse,
  HeritageRequest,
  HeritageResponse,
  EventsRequest,
  EventsResponse,
  ExperiencesRequest,
  ExperiencesResponse,
  ItineraryRequest,
  ItineraryResponse,
  TripMateRequest,
  TripMateResult,
  PackingRequest,
  PackingResponse,
  ApiError,
} from "@culturecompass/shared";
import { ApiRequestError, resolveApiError } from "@/lib/errors";
import { ERROR_CODES } from "@culturecompass/shared";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as ApiError | null;
      throw resolveApiError(errorBody, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiRequestError(
        "Unable to reach the server. Check your connection and try again.",
        ERROR_CODES.INTERNAL_ERROR,
        0,
      );
    }

    throw error;
  }
}

export function createCompassPlan(payload: CompassPlanRequest): Promise<CompassPlanResponse> {
  return apiFetch("/api/compass/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createItinerary(payload: ItineraryRequest): Promise<ItineraryResponse> {
  return apiFetch("/api/itinerary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function runTripMate(payload: TripMateRequest): Promise<TripMateResult> {
  return apiFetch("/api/tripmate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createPackingList(payload: PackingRequest): Promise<PackingResponse> {
  return apiFetch("/api/packing", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDestinations(
  payload: DestinationsRequest,
): Promise<DestinationsResponse> {
  return apiFetch("/api/discover/destinations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchAttractions(
  payload: AttractionsRequest,
): Promise<AttractionsResponse> {
  return apiFetch("/api/discover/attractions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchHiddenGems(payload: HiddenGemsRequest): Promise<HiddenGemsResponse> {
  return apiFetch("/api/discover/hidden-gems", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchStory(payload: StoryRequest): Promise<StoryResponse> {
  return apiFetch("/api/culture/story", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchHeritage(payload: HeritageRequest): Promise<HeritageResponse> {
  return apiFetch("/api/culture/heritage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchEvents(payload: EventsRequest): Promise<EventsResponse> {
  return apiFetch("/api/culture/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchExperiences(
  payload: ExperiencesRequest,
): Promise<ExperiencesResponse> {
  return apiFetch("/api/culture/experiences", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkHealth(): Promise<{ status: string; timestamp: string }> {
  return apiFetch("/api/health");
}
