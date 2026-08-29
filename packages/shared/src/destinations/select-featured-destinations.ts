import type { DestinationCatalogEntry, DestinationContinent } from "../schemas/destination-catalog";
import { catalogEntryToLocation } from "./catalog-entry-to-location";
import { createSeededRng, shuffleInPlace } from "./seeded-rng";
import type { Location } from "../types";

export const DESTINATION_CONTINENTS: DestinationContinent[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

export interface SelectFeaturedDestinationsOptions {
  limit?: number;
  seed?: number;
}

function weightedPick(
  items: DestinationCatalogEntry[],
  rng: () => number,
): DestinationCatalogEntry {
  const total = items.reduce((sum, item) => sum + item.popularity, 0);
  let roll = rng() * total;

  for (const item of items) {
    roll -= item.popularity;
    if (roll <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

function groupByContinent(
  catalog: DestinationCatalogEntry[],
): Map<DestinationContinent, DestinationCatalogEntry[]> {
  const map = new Map<DestinationContinent, DestinationCatalogEntry[]>();

  for (const entry of catalog) {
    const bucket = map.get(entry.continent) ?? [];
    bucket.push(entry);
    map.set(entry.continent, bucket);
  }

  return map;
}

/**
 * Selects featured destinations with geographic diversity and popularity weighting.
 * Deterministic for a given seed — no Math.random().
 */
export function selectFeaturedDestinations(
  catalog: DestinationCatalogEntry[],
  options: SelectFeaturedDestinationsOptions = {},
): DestinationCatalogEntry[] {
  const limit = options.limit ?? 5;
  const seed = options.seed ?? 0;

  if (catalog.length === 0 || limit <= 0) {
    return [];
  }

  const rng = createSeededRng(seed);
  const byContinent = groupByContinent(catalog);
  const selected: DestinationCatalogEntry[] = [];
  const selectedIds = new Set<string>();
  const selectedCountries = new Set<string>();

  const continentOrder = shuffleInPlace([...DESTINATION_CONTINENTS], rng);

  for (const continent of continentOrder) {
    if (selected.length >= limit) break;

    const pool = (byContinent.get(continent) ?? []).filter((entry) => !selectedIds.has(entry.id));
    if (pool.length === 0) continue;

    const pick = weightedPick(pool, rng);
    selected.push(pick);
    selectedIds.add(pick.id);
    selectedCountries.add(pick.countryCode);
  }

  let guard = 0;
  while (selected.length < limit && guard < catalog.length * 3) {
    guard += 1;

    const remaining = catalog.filter((entry) => !selectedIds.has(entry.id));
    if (remaining.length === 0) break;

    const diversePool = remaining.filter((entry) => !selectedCountries.has(entry.countryCode));
    const pool = diversePool.length > 0 ? diversePool : remaining;
    const pick = weightedPick(pool, rng);

    selected.push(pick);
    selectedIds.add(pick.id);
    selectedCountries.add(pick.countryCode);
  }

  return selected;
}

export function selectFeaturedLocations(
  catalog: DestinationCatalogEntry[],
  options: SelectFeaturedDestinationsOptions = {},
): Location[] {
  return selectFeaturedDestinations(catalog, options).map(catalogEntryToLocation);
}
