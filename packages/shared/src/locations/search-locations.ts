import type { Location, LocationIndexEntry } from "../types";
import { LOCATION_SEARCH_LIMITS } from "../schemas/location";
import { normalizeSearchText } from "./normalize";

export interface SearchLocationsOptions {
  limit?: number;
  minQueryLength?: number;
}

interface ScoredLocation {
  location: LocationIndexEntry;
  score: number;
}

function scoreLocation(location: LocationIndexEntry, normalizedQuery: string): number | null {
  const nameNorm = normalizeSearchText(location.name);
  const countryNorm = normalizeSearchText(location.country);
  const searchBlob = location.searchText;

  let score = 0;
  let matched = false;

  if (nameNorm === normalizedQuery) {
    score += 5000;
    matched = true;
  } else if (nameNorm.startsWith(normalizedQuery)) {
    score += 3000;
    matched = true;
    if (location.kind === "city" || location.kind === "destination") {
      score += 800;
    }
  } else if (nameNorm.includes(normalizedQuery)) {
    score += 1500;
    matched = true;
  }

  if (location.kind === "country") {
    if (countryNorm === normalizedQuery || nameNorm === normalizedQuery) {
      score += 4000;
      matched = true;
    } else if (countryNorm.startsWith(normalizedQuery) || nameNorm.startsWith(normalizedQuery)) {
      score += 2500;
      matched = true;
    }
  }

  if (countryNorm.startsWith(normalizedQuery)) {
    score += 800;
    matched = true;
  }

  if (searchBlob.includes(normalizedQuery)) {
    score += 400;
    matched = true;
  }

  if (!matched) {
    return null;
  }

  if (location.population) {
    score += Math.min(Math.log10(location.population + 1) * 100, 500);
  }

  score += Math.max(0, 120 - nameNorm.length * 4);

  if (location.kind === "country") {
    score += 200;
    if (normalizedQuery.length < nameNorm.length) {
      score -= 2000;
    }
  }

  return score;
}

/**
 * Pure location search over a provided index. Every result originates from `locations`.
 */
export function searchLocations(
  locations: readonly LocationIndexEntry[],
  query: string,
  options: SearchLocationsOptions = {},
): Location[] {
  const minLength = options.minQueryLength ?? LOCATION_SEARCH_LIMITS.minQueryLength;
  const limit = Math.min(
    options.limit ?? LOCATION_SEARCH_LIMITS.defaultLimit,
    LOCATION_SEARCH_LIMITS.maxLimit,
  );

  const normalizedQuery = normalizeSearchText(query);

  if (normalizedQuery.length < minLength) {
    return [];
  }

  if (normalizedQuery.length > LOCATION_SEARCH_LIMITS.maxQueryLength) {
    return [];
  }

  const scored: ScoredLocation[] = [];

  for (const location of locations) {
    const score = scoreLocation(location, normalizedQuery);
    if (score !== null) {
      scored.push({ location, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.location.population ?? 0) - (a.location.population ?? 0);
  });

  const seen = new Set<string>();
  const results: Location[] = [];

  for (const { location } of scored) {
    if (seen.has(location.id)) continue;
    seen.add(location.id);
    results.push(toPublicLocation(location));
    if (results.length >= limit) break;
  }

  return results;
}

function toPublicLocation(location: LocationIndexEntry): Location {
  const { searchText: _searchText, ...publicLocation } = location;
  return publicLocation;
}
