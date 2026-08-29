import type { Location } from "../types";
import type { DestinationCatalogEntry } from "../schemas/destination-catalog";

export function buildDestinationDisplayLabel(entry: Pick<DestinationCatalogEntry, "name" | "region" | "country">): string {
  if (entry.region && entry.region !== entry.name) {
    return `${entry.name}, ${entry.region}, ${entry.country}`;
  }
  return `${entry.name}, ${entry.country}`;
}

export function catalogEntryToLocation(entry: DestinationCatalogEntry): Location {
  return {
    id: entry.id,
    name: entry.name,
    country: entry.country,
    countryCode: entry.countryCode,
    adminRegion: entry.region,
    latitude: entry.latitude,
    longitude: entry.longitude,
    displayLabel: buildDestinationDisplayLabel(entry),
    kind: "destination",
  };
}
