import type { Location } from "@culturecompass/shared";
import { locationSchema } from "@culturecompass/shared";

export const PLANNER_LOCATION_STORAGE_KEY = "plannerLocation";

export interface ResolvedPlannerLocation {
  destination: string;
  location: Location | null;
}

function parseStoredLocation(raw: string): Location | null {
  try {
    return locationSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Resolves the planner's initial destination from props and sessionStorage.
 * Stale session entries are ignored when they conflict with the URL destination.
 */
export function resolvePlannerLocation(
  initialDestination: string,
  initialLocation: Location | null,
  storage: Pick<Storage, "getItem" | "removeItem"> | null,
): ResolvedPlannerLocation {
  if (initialLocation) {
    return {
      destination: initialLocation.displayLabel,
      location: initialLocation,
    };
  }

  const trimmedDestination = initialDestination.trim();
  const storedRaw = storage?.getItem(PLANNER_LOCATION_STORAGE_KEY) ?? null;

  if (storedRaw) {
    const storedLocation = parseStoredLocation(storedRaw);

    if (storedLocation) {
      if (!trimmedDestination || storedLocation.displayLabel === trimmedDestination) {
        return {
          destination: storedLocation.displayLabel,
          location: storedLocation,
        };
      }

      storage?.removeItem(PLANNER_LOCATION_STORAGE_KEY);
    } else {
      storage?.removeItem(PLANNER_LOCATION_STORAGE_KEY);
    }
  }

  return {
    destination: trimmedDestination,
    location: null,
  };
}

export function writePlannerLocation(
  storage: Pick<Storage, "setItem" | "removeItem">,
  location: Location | null,
  destinationText = "",
): void {
  if (location) {
    storage.setItem(PLANNER_LOCATION_STORAGE_KEY, JSON.stringify(location));
    return;
  }

  storage.removeItem(PLANNER_LOCATION_STORAGE_KEY);

  if (!destinationText.trim()) {
    storage.removeItem(PLANNER_LOCATION_STORAGE_KEY);
  }
}

export function readStoredPlannerLocation(
  storage: Pick<Storage, "getItem"> | null,
): Location | null {
  const raw = storage?.getItem(PLANNER_LOCATION_STORAGE_KEY) ?? null;
  if (!raw) return null;
  return parseStoredLocation(raw);
}
