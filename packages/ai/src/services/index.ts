import {
  compassPlanResponseSchema,
  destinationsResponseSchema,
  attractionsResponseSchema,
  hiddenGemsResponseSchema,
  storyResponseSchema,
  heritageResponseSchema,
  eventsResponseSchema,
  experiencesResponseSchema,
  itineraryResponseSchema,
  tripMateResultSchema,
  packingListSchema,
  type CompassPlanRequest,
  type CompassPlanResponse,
  type DestinationsRequest,
  type DestinationsResponse,
  type AttractionsRequest,
  type AttractionsResponse,
  type HiddenGemsRequest,
  type HiddenGemsResponse,
  type StoryRequest,
  type StoryResponse,
  type HeritageRequest,
  type HeritageResponse,
  type EventsRequest,
  type EventsResponse,
  type ExperiencesRequest,
  type ExperiencesResponse,
  type ItineraryRequest,
  type ItineraryResponse,
  type TripMateRequest,
  type TripMateResult,
  type PackingRequest,
  type PackingResponse,
} from "@culturecompass/shared";
import { generateJson } from "../client";
import { buildCompassPlanPrompt } from "../prompts/compassPlan";
import { buildDestinationsPrompt } from "../prompts/destinations";
import { buildAttractionsPrompt } from "../prompts/attractions";
import { buildHiddenGemsPrompt } from "../prompts/hiddenGems";
import { buildStoryPrompt } from "../prompts/storytelling";
import { buildHeritagePrompt } from "../prompts/heritage";
import { buildEventsPrompt } from "../prompts/events";
import { buildExperiencesPrompt } from "../prompts/experiences";
import { buildItineraryPrompt } from "../prompts/itinerary";
import { buildTripMatePrompt } from "../prompts/tripmate";
import { buildPackingPrompt } from "../prompts/packing";

export async function generateCompassPlan(
  input: CompassPlanRequest,
): Promise<CompassPlanResponse> {
  const { modelPreset, ...planInput } = input;
  const prompt = buildCompassPlanPrompt(planInput);
  return generateJson(prompt, (raw) => compassPlanResponseSchema.parse(raw), { modelPreset });
}

export async function generateDestinations(
  input: DestinationsRequest,
): Promise<DestinationsResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildDestinationsPrompt(requestInput);
  return generateJson(prompt, (raw) => destinationsResponseSchema.parse(raw), { modelPreset });
}

export async function generateAttractions(
  input: AttractionsRequest,
): Promise<AttractionsResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildAttractionsPrompt(requestInput);
  return generateJson(prompt, (raw) => attractionsResponseSchema.parse(raw), { modelPreset });
}

export async function generateHiddenGems(
  input: HiddenGemsRequest,
): Promise<HiddenGemsResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildHiddenGemsPrompt(requestInput);
  return generateJson(prompt, (raw) => hiddenGemsResponseSchema.parse(raw), { modelPreset });
}

export async function generateStory(input: StoryRequest): Promise<StoryResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildStoryPrompt(requestInput);
  return generateJson(prompt, (raw) => storyResponseSchema.parse(raw), { modelPreset });
}

export async function generateHeritage(
  input: HeritageRequest,
): Promise<HeritageResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildHeritagePrompt(requestInput);
  return generateJson(prompt, (raw) => heritageResponseSchema.parse(raw), { modelPreset });
}

export async function generateEvents(input: EventsRequest): Promise<EventsResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildEventsPrompt(requestInput);
  return generateJson(prompt, (raw) => eventsResponseSchema.parse(raw), { modelPreset });
}

export async function generateExperiences(
  input: ExperiencesRequest,
): Promise<ExperiencesResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildExperiencesPrompt(requestInput);
  return generateJson(prompt, (raw) => experiencesResponseSchema.parse(raw), { modelPreset });
}

export async function generateItinerary(
  input: ItineraryRequest,
): Promise<ItineraryResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildItineraryPrompt(requestInput);
  return generateJson(prompt, (raw) => itineraryResponseSchema.parse(raw), { modelPreset });
}

export async function generateTripMate(input: TripMateRequest): Promise<TripMateResult> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildTripMatePrompt(requestInput);
  return generateJson(prompt, (raw) => tripMateResultSchema.parse(raw), { modelPreset });
}

export async function generatePacking(input: PackingRequest): Promise<PackingResponse> {
  const { modelPreset, ...requestInput } = input;
  const prompt = buildPackingPrompt(requestInput);
  const packing = await generateJson(
    prompt,
    (raw) => packingListSchema.parse(raw),
    { modelPreset },
  );
  return { packing };
}
