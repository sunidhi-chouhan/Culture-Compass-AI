import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  destinationCatalogSchema,
  selectFeaturedLocations,
  type DestinationCatalogEntry,
  type Location,
} from "@culturecompass/shared";

let cachedCatalog: DestinationCatalogEntry[] | null = null;

function loadCatalogFromDisk(): DestinationCatalogEntry[] {
  const filePath = join(process.cwd(), "data", "destinations.catalog.json");
  const raw = readFileSync(filePath, "utf8");
  return destinationCatalogSchema.parse(JSON.parse(raw));
}

export function getDestinationCatalog(): DestinationCatalogEntry[] {
  if (!cachedCatalog) {
    cachedCatalog = loadCatalogFromDisk();
  }
  return cachedCatalog;
}

export function queryFeaturedDestinations(seed: number, limit = 5): Location[] {
  return selectFeaturedLocations(getDestinationCatalog(), { seed, limit });
}

/** Clears in-memory cache (for tests). */
export function resetDestinationCatalogCache(): void {
  cachedCatalog = null;
}
