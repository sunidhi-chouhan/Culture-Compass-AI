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
});

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
