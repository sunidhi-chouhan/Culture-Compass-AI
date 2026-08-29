import { z } from "zod";
import { ERROR_CODES, INPUT_LIMITS } from "../constants";

export const modelPresetSchema = z.enum(["fast", "balanced", "quality"]);

export const lensModeSchema = z.enum(["tourist", "local"]);

export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.AI_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
  ]),
});

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export const compassPlanRequestSchema = z.object({
  destination: z.string().max(INPUT_LIMITS.destination).optional(),
  interests: z
    .array(z.string().max(INPUT_LIMITS.interestTagMax))
    .min(1, "At least one interest is required")
    .max(INPUT_LIMITS.interestsMax),
  budget: z.string().min(1, "Budget is required").max(INPUT_LIMITS.budget),
  duration: z.string().min(1, "Duration is required").max(INPUT_LIMITS.duration),
  travelStyle: z.string().min(1, "Travel style is required").max(INPUT_LIMITS.travelStyle),
  notes: z.string().max(INPUT_LIMITS.notes).optional().default(""),
  modelPreset: modelPresetSchema.optional(),
  lensMode: lensModeSchema.optional().default("tourist"),
});

export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  tagline: z.string(),
  rationale: z.string(),
  bestTimeToVisit: z.string(),
  estimatedBudget: z.string(),
});

export const attractionSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tip: z.string(),
});

export const hiddenGemSchema = z.object({
  name: z.string(),
  description: z.string(),
  whyVisit: z.string(),
  localTip: z.string(),
});

export const heritageSchema = z.object({
  highlights: z.array(z.string()),
  traditions: z.array(z.string()),
  etiquetteTips: z.array(z.string()),
  culturalSignificance: z.string(),
});

export const eventSchema = z.object({
  name: z.string(),
  date: z.string(),
  description: z.string(),
  location: z.string(),
});

export const experienceSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.string(),
  duration: z.string(),
  authenticityNote: z.string(),
});

export const storySnippetSchema = z.object({
  title: z.string(),
  preview: z.string(),
  narrative: z.string(),
  tone: z.string(),
});

export const dashboardMetaSchema = z.object({
  weather: z.string(),
  culturalRating: z.number().min(1).max(10),
  aiMatchScore: z.number().int().min(50).max(100),
  foodHighlights: z.array(z.string()).min(1).max(8),
  localTips: z.array(z.string()).min(1).max(8),
  shoppingGuide: z.array(z.string()).min(1).max(8),
});

/** Morning / afternoon / evening, or flexible. */
export const itineraryDayPartSchema = z.enum([
  "morning",
  "afternoon",
  "evening",
  "night",
  "flexible",
]);

export const itinerarySlotSchema = z.object({
  id: z.string().min(1),
  dayPart: itineraryDayPartSchema.default("flexible"),
  timeLabel: z.string().max(40).optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).default(""),
  placeName: z.string().max(INPUT_LIMITS.placeName).optional(),
  category: z.string().max(80).optional(),
  /** Activity length in minutes — shown as "1h 30m". */
  durationMinutes: z.number().int().min(15).max(720).optional(),
  /** Walking / transit gap before the next slot — shown as "↓ 15 min". */
  travelMinutesToNext: z.number().int().min(0).max(180).optional(),
  /** Short tags e.g. Food, Local life. */
  tags: z.array(z.string().max(40)).max(6).default([]),
  /** At most one featured stop per day should show a small image. */
  featured: z.boolean().default(false),
  /** Stable seed for placeholder imagery (place name or slot id). */
  imageSeed: z.string().max(120).optional(),
});

export const dayItinerarySchema = z.object({
  dayNumber: z.number().int().min(1).max(31),
  title: z.string().max(200).optional(),
  summary: z.string().max(500).optional(),
  slots: z.array(itinerarySlotSchema).max(20),
});

export const tripItinerarySchema = z.object({
  days: z.array(dayItinerarySchema).min(1).max(31),
  notes: z.string().max(1000).optional(),
  generatedAt: z.string().datetime({ offset: true }).optional(),
});

export const tripMateSuggestionKindSchema = z.enum([
  "conflict",
  "gap",
  "reorder",
  "cultural",
  "pacing",
  "other",
]);

export const tripMateSuggestionActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("set_travel_minutes"),
    slotId: z.string().min(1),
    travelMinutesToNext: z.number().int().min(0).max(180),
  }),
  z.object({
    type: z.literal("set_time_label"),
    slotId: z.string().min(1),
    timeLabel: z.string().min(1).max(40),
  }),
  z.object({
    type: z.literal("swap_slots"),
    slotIdA: z.string().min(1),
    slotIdB: z.string().min(1),
  }),
  z.object({
    type: z.literal("add_slot"),
    dayNumber: z.number().int().min(1).max(31),
    slot: itinerarySlotSchema,
  }),
  z.object({
    type: z.literal("shorten_duration"),
    slotId: z.string().min(1),
    durationMinutes: z.number().int().min(15).max(720),
  }),
]);

export const tripMateSuggestionSchema = z.object({
  id: z.string().min(1),
  kind: tripMateSuggestionKindSchema,
  severity: z.enum(["info", "warning", "critical"]).default("info"),
  title: z.string().min(1).max(200),
  detail: z.string().max(1000),
  relatedSlotIds: z.array(z.string()).max(20).default([]),
  /** Display label e.g. "DAY 2". */
  dayLabel: z.string().max(40).optional(),
  /** Short connector e.g. "Museum → Market". */
  headline: z.string().max(200).optional(),
  /** Concrete recommendation line for the finding card. */
  recommendation: z.string().max(400).optional(),
  /** Structured patch so Apply can mutate the itinerary without a full rewrite. */
  action: tripMateSuggestionActionSchema.optional(),
});

export const tripMateResultSchema = z.object({
  analysisSummary: z.string().max(2000),
  suggestions: z.array(tripMateSuggestionSchema).max(30),
  improvedItinerary: tripItinerarySchema.optional(),
  verificationNotes: z.string().max(2000).optional(),
  applied: z.boolean().default(false),
});

export const tripMateRequestSchema = z.object({
  destination: z.string().min(1).max(INPUT_LIMITS.destination),
  interests: z
    .array(z.string().max(INPUT_LIMITS.interestTagMax))
    .max(INPUT_LIMITS.interestsMax)
    .default([]),
  duration: z.string().max(INPUT_LIMITS.duration).optional(),
  travelStyle: z.string().max(INPUT_LIMITS.travelStyle).optional(),
  itinerary: tripItinerarySchema.optional(),
  pastedSchedule: z.string().max(8000).optional(),
  culturalContext: z.string().max(4000).optional(),
  modelPreset: modelPresetSchema.optional(),
});

export const packingItemSourceSchema = z.enum([
  "essentials",
  "itinerary",
  "weather",
  "preference",
  "personal",
]);

export const packingItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  category: z.string().max(80).default("general"),
  packed: z.boolean().default(false),
  essential: z.boolean().default(false),
  notes: z.string().max(300).optional(),
  /** Short trip-specific reason shown under the label. */
  reason: z.string().max(300).optional(),
  quantity: z.number().int().min(1).max(30).optional(),
  quantityLabel: z.string().max(40).optional(),
  source: packingItemSourceSchema.optional().default("essentials"),
});

export const packingPreferencesSchema = z.object({
  climateNotes: z.string().max(300).optional(),
  activityNotes: z.string().max(300).optional(),
  extras: z.array(z.string().max(100)).max(20).default([]),
});

export const packingInsightsSchema = z.object({
  weather: z.array(z.string().max(120)).max(8).default([]),
  activity: z.array(z.string().max(120)).max(8).default([]),
  itineraryAddedCount: z.number().int().min(0).max(50).default(0),
});

export const packingListSchema = z.object({
  items: z.array(packingItemSchema).max(100),
  preferences: packingPreferencesSchema.default({ extras: [] }),
  generatedAt: z.string().datetime({ offset: true }).optional(),
  tripSummary: z.string().max(200).optional(),
  insights: packingInsightsSchema.optional(),
  /** Fingerprint of journey context used to generate this list. */
  contextFingerprint: z.string().max(500).optional(),
});

export const packingRequestSchema = z.object({
  destination: z.string().min(1).max(INPUT_LIMITS.destination),
  interests: z
    .array(z.string().max(INPUT_LIMITS.interestTagMax))
    .max(INPUT_LIMITS.interestsMax)
    .default([]),
  duration: z.string().max(INPUT_LIMITS.duration).optional(),
  travelStyle: z.string().max(INPUT_LIMITS.travelStyle).optional(),
  budget: z.string().max(INPUT_LIMITS.budget).optional(),
  culturalContext: z.string().max(4000).optional(),
  preferences: packingPreferencesSchema.optional(),
  /** Short hints from the itinerary (e.g. food, heritage, markets). */
  activityHints: z.array(z.string().max(80)).max(20).default([]),
  modelPreset: modelPresetSchema.optional(),
});

export const packingResponseSchema = z.object({
  packing: packingListSchema,
});

export const compassPlanResponseSchema = z.object({
  destinations: z.array(destinationSchema).min(1),
  featuredDestination: destinationSchema,
  attractions: z.array(attractionSchema),
  hiddenGems: z.array(hiddenGemSchema),
  heritage: heritageSchema,
  events: z.array(eventSchema),
  experiences: z.array(experienceSchema),
  storySnippet: storySnippetSchema,
  dashboard: dashboardMetaSchema.optional(),
  /** Optional day-wise itinerary (Phase 3+). Absent on older plans. */
  itinerary: tripItinerarySchema.optional(),
});

/** Snapshot of planner answers stored with a saved journey. */
export const journeyPreferencesSchema = z.object({
  destination: z.string().max(INPUT_LIMITS.destination).default(""),
  interests: z
    .array(z.string().max(INPUT_LIMITS.interestTagMax))
    .max(INPUT_LIMITS.interestsMax)
    .default([]),
  companion: z.string().max(40).nullable().default(null),
  budget: z.string().max(INPUT_LIMITS.budget).nullable().default(null),
  duration: z.string().max(INPUT_LIMITS.duration).nullable().default(null),
  customDuration: z.string().max(INPUT_LIMITS.duration).default(""),
});

/**
 * Full saved journey document for the local multi-journey library.
 * `userId` is null for anonymous device saves.
 */
export const savedJourneySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  preferences: journeyPreferencesSchema,
  culturalPlan: compassPlanResponseSchema,
  itinerary: tripItinerarySchema.optional(),
  packing: packingListSchema.optional(),
  tripMate: tripMateResultSchema.optional(),
  compassRequest: compassPlanRequestSchema.optional(),
  userId: z.string().nullable().default(null),
});

export const journeyLibrarySchema = z.object({
  version: z.literal(1).default(1),
  journeys: z.array(savedJourneySchema).max(50),
});

/**
 * Active session pointer — separate from the library collection.
 * `activeJourneyId` null means a new unsaved draft.
 */
export const activeJourneySessionSchema = z.object({
  activeJourneyId: z.string().nullable().default(null),
  isDraft: z.boolean().default(true),
  updatedAt: z.string().datetime({ offset: true }).optional(),
});

export const itineraryRequestSchema = z.object({
  destination: z.string().min(1).max(INPUT_LIMITS.destination),
  interests: z
    .array(z.string().max(INPUT_LIMITS.interestTagMax))
    .min(1)
    .max(INPUT_LIMITS.interestsMax),
  duration: z.string().min(1).max(INPUT_LIMITS.duration),
  travelStyle: z.string().max(INPUT_LIMITS.travelStyle).optional(),
  budget: z.string().max(INPUT_LIMITS.budget).optional(),
  culturalContext: z.string().max(4000).optional(),
  modelPreset: modelPresetSchema.optional(),
});

export const itineraryResponseSchema = z.object({
  itinerary: tripItinerarySchema,
});

export const JOURNEY_LIBRARY_STORAGE_KEY = "journeymind.library.v1";
export const ACTIVE_JOURNEY_SESSION_STORAGE_KEY = "journeymind.activeSession.v1";
export const JOURNEY_PACKING_SESSION_KEY = "journeymind.session.packing.v1";

export const destinationsRequestSchema = z.object({
  interests: z.array(z.string()).min(1),
  budget: z.string().min(1),
  duration: z.string().min(1),
  travelStyle: z.string().min(1),
  modelPreset: modelPresetSchema.optional(),
});

export const destinationsResponseSchema = z.object({
  destinations: z.array(destinationSchema),
});

export const attractionsRequestSchema = z.object({
  destination: z.string().min(1),
  interests: z.array(z.string()).min(1),
  groupSize: z.number().int().min(1).default(1),
  modelPreset: modelPresetSchema.optional(),
});

export const attractionsResponseSchema = z.object({
  attractions: z.array(attractionSchema),
});

export const hiddenGemsRequestSchema = z.object({
  destination: z.string().min(1),
  vibe: z.string().min(1),
  modelPreset: modelPresetSchema.optional(),
});

export const hiddenGemsResponseSchema = z.object({
  hiddenGems: z.array(hiddenGemSchema),
});

export const storyRequestSchema = z.object({
  placeName: z.string().min(1).max(INPUT_LIMITS.placeName),
  era: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  tone: z.string().max(50).default("immersive"),
  modelPreset: modelPresetSchema.optional(),
});

export const storyResponseSchema = z.object({
  title: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      content: z.string(),
    }),
  ),
  tone: z.string(),
});

export const heritageRequestSchema = z.object({
  destination: z.string().min(1),
  modelPreset: modelPresetSchema.optional(),
});

export const heritageResponseSchema = heritageSchema;

export const eventsRequestSchema = z.object({
  destination: z.string().min(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  modelPreset: modelPresetSchema.optional(),
});

export const eventsResponseSchema = z.object({
  events: z.array(eventSchema),
});

export const experiencesRequestSchema = z.object({
  destination: z.string().min(1),
  preferences: z.array(z.string()).default([]),
  modelPreset: modelPresetSchema.optional(),
});

export const experiencesResponseSchema = z.object({
  experiences: z.array(experienceSchema),
});

export * from "./location";
export * from "./destination-catalog";
