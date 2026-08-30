import { z } from "zod";

export const LOCATION_SEARCH_LIMITS = {
  minQueryLength: 2,
  maxQueryLength: 64,
  defaultLimit: 8,
  maxLimit: 8,
} as const;

export const locationKindSchema = z.enum(["city", "country", "destination"]);

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string(),
  adminRegion: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  population: z.number().optional(),
  displayLabel: z.string(),
  kind: locationKindSchema,
});

/** Internal index entry — includes normalized searchText (not returned by API). */
export const locationIndexEntrySchema = locationSchema.extend({
  searchText: z.string(),
});

export const locationSuggestionSchema = locationSchema;

export const locationSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(LOCATION_SEARCH_LIMITS.minQueryLength, "Query must be at least 2 characters")
    .max(LOCATION_SEARCH_LIMITS.maxQueryLength),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(LOCATION_SEARCH_LIMITS.maxLimit)
    .optional()
    .default(LOCATION_SEARCH_LIMITS.defaultLimit),
});

export const locationSearchResponseSchema = z.object({
  results: z.array(locationSuggestionSchema),
});
