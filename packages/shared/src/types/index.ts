import { z } from "zod";
import type { ModelPreset } from "../constants";
import {
  apiErrorSchema,
  healthResponseSchema,
  compassPlanRequestSchema,
  compassPlanResponseSchema,
  destinationsRequestSchema,
  destinationsResponseSchema,
  attractionsRequestSchema,
  attractionsResponseSchema,
  hiddenGemsRequestSchema,
  hiddenGemsResponseSchema,
  storyRequestSchema,
  storyResponseSchema,
  heritageRequestSchema,
  heritageResponseSchema,
  eventsRequestSchema,
  eventsResponseSchema,
  experiencesRequestSchema,
  experiencesResponseSchema,
  destinationSchema,
  attractionSchema,
  hiddenGemSchema,
  heritageSchema,
  eventSchema,
  experienceSchema,
  storySnippetSchema,
  dashboardMetaSchema,
  itinerarySlotSchema,
  dayItinerarySchema,
  tripItinerarySchema,
  tripMateSuggestionSchema,
  tripMateSuggestionActionSchema,
  tripMateResultSchema,
  tripMateRequestSchema,
  packingItemSchema,
  packingItemSourceSchema,
  packingPreferencesSchema,
  packingInsightsSchema,
  packingListSchema,
  packingRequestSchema,
  packingResponseSchema,
  journeyPreferencesSchema,
  savedJourneySchema,
  journeyLibrarySchema,
  activeJourneySessionSchema,
  itineraryRequestSchema,
  itineraryResponseSchema,
} from "../schemas";
import {
  locationSchema,
  locationSuggestionSchema,
  locationSearchResponseSchema,
  locationSearchQuerySchema,
  locationIndexEntrySchema,
} from "../schemas/location";

export type ApiError = z.infer<typeof apiErrorSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type CompassPlanRequest = z.infer<typeof compassPlanRequestSchema>;
export type CompassPlanResponse = z.infer<typeof compassPlanResponseSchema>;
export type DestinationsRequest = z.infer<typeof destinationsRequestSchema>;
export type DestinationsResponse = z.infer<typeof destinationsResponseSchema>;
export type AttractionsRequest = z.infer<typeof attractionsRequestSchema>;
export type AttractionsResponse = z.infer<typeof attractionsResponseSchema>;
export type HiddenGemsRequest = z.infer<typeof hiddenGemsRequestSchema>;
export type HiddenGemsResponse = z.infer<typeof hiddenGemsResponseSchema>;
export type StoryRequest = z.infer<typeof storyRequestSchema>;
export type StoryResponse = z.infer<typeof storyResponseSchema>;
export type HeritageRequest = z.infer<typeof heritageRequestSchema>;
export type HeritageResponse = z.infer<typeof heritageResponseSchema>;
export type EventsRequest = z.infer<typeof eventsRequestSchema>;
export type EventsResponse = z.infer<typeof eventsResponseSchema>;
export type ExperiencesRequest = z.infer<typeof experiencesRequestSchema>;
export type ExperiencesResponse = z.infer<typeof experiencesResponseSchema>;
export type Destination = z.infer<typeof destinationSchema>;
export type Attraction = z.infer<typeof attractionSchema>;
export type HiddenGem = z.infer<typeof hiddenGemSchema>;
export type Heritage = z.infer<typeof heritageSchema>;
export type Event = z.infer<typeof eventSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type StorySnippet = z.infer<typeof storySnippetSchema>;
export type DashboardMeta = z.infer<typeof dashboardMetaSchema>;
export type ItinerarySlot = z.infer<typeof itinerarySlotSchema>;
export type DayItinerary = z.infer<typeof dayItinerarySchema>;
export type TripItinerary = z.infer<typeof tripItinerarySchema>;
export type TripMateSuggestion = z.infer<typeof tripMateSuggestionSchema>;
export type TripMateSuggestionAction = z.infer<typeof tripMateSuggestionActionSchema>;
export type TripMateResult = z.infer<typeof tripMateResultSchema>;
export type TripMateRequest = z.infer<typeof tripMateRequestSchema>;
export type PackingItem = z.infer<typeof packingItemSchema>;
export type PackingItemSource = z.infer<typeof packingItemSourceSchema>;
export type PackingPreferences = z.infer<typeof packingPreferencesSchema>;
export type PackingInsights = z.infer<typeof packingInsightsSchema>;
export type PackingList = z.infer<typeof packingListSchema>;
export type PackingRequest = z.infer<typeof packingRequestSchema>;
export type PackingResponse = z.infer<typeof packingResponseSchema>;
export type JourneyPreferences = z.infer<typeof journeyPreferencesSchema>;
export type SavedJourney = z.infer<typeof savedJourneySchema>;
export type JourneyLibrary = z.infer<typeof journeyLibrarySchema>;
export type ActiveJourneySession = z.infer<typeof activeJourneySessionSchema>;
export type ItineraryRequest = z.infer<typeof itineraryRequestSchema>;
export type ItineraryResponse = z.infer<typeof itineraryResponseSchema>;
export type Location = z.infer<typeof locationSchema>;
export type LocationIndexEntry = z.infer<typeof locationIndexEntrySchema>;
export type LocationSuggestion = z.infer<typeof locationSuggestionSchema>;
export type LocationSearchResponse = z.infer<typeof locationSearchResponseSchema>;
export type LocationSearchQuery = z.infer<typeof locationSearchQuerySchema>;
export type { ModelPreset };
