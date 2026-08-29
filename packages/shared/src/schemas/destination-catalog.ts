import { z } from "zod";

export const destinationContinentSchema = z.enum([
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
]);

export const destinationCatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string(),
  countryCode: z.string().length(2),
  region: z.string(),
  continent: destinationContinentSchema,
  latitude: z.number(),
  longitude: z.number(),
  popularity: z.number().min(1).max(100),
  tags: z.array(z.string()).min(1),
});

export const destinationCatalogSchema = z.array(destinationCatalogEntrySchema);

export const featuredDestinationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).optional().default(5),
  seed: z.coerce.number().int().nonnegative().optional().default(0),
});

export const featuredDestinationsResponseSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      country: z.string(),
      countryCode: z.string(),
      adminRegion: z.string().optional(),
      latitude: z.number(),
      longitude: z.number(),
      population: z.number().optional(),
      displayLabel: z.string(),
      kind: z.enum(["city", "country", "destination"]),
    }),
  ),
  seed: z.number().int().nonnegative(),
});

export type DestinationContinent = z.infer<typeof destinationContinentSchema>;
export type DestinationCatalogEntry = z.infer<typeof destinationCatalogEntrySchema>;
