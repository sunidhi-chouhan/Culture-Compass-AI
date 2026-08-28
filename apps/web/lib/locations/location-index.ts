import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  locationIndexEntrySchema,
  searchLocations,
  type Location,
  type LocationIndexEntry,
} from "@culturecompass/shared";
import { z } from "zod";
import { MOCK_LOCATION_INDEX } from "@/lib/mock/locations";

const indexSchema = z.array(locationIndexEntrySchema);

let cachedIndex: LocationIndexEntry[] | null = null;

function isMockIndexEnabled(): boolean {
  return process.env.USE_MOCK_LOCATIONS === "true";
}

function loadIndexFromDisk(): LocationIndexEntry[] {
  const filePath = join(process.cwd(), "data", "locations.index.json");
  const raw = readFileSync(filePath, "utf8");
  return indexSchema.parse(JSON.parse(raw));
}

export function getLocationIndex(): LocationIndexEntry[] {
  if (isMockIndexEnabled()) {
    return MOCK_LOCATION_INDEX;
  }

  if (!cachedIndex) {
    cachedIndex = loadIndexFromDisk();
  }

  return cachedIndex;
}

export function queryLocations(query: string, limit = 8): Location[] {
  return searchLocations(getLocationIndex(), query, { limit });
}

/** Clears in-memory cache (for tests). */
export function resetLocationIndexCache(): void {
  cachedIndex = null;
}
