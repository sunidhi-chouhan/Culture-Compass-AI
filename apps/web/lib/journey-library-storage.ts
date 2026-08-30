import {
  ACTIVE_JOURNEY_SESSION_STORAGE_KEY,
  JOURNEY_LIBRARY_STORAGE_KEY,
  activeJourneySessionSchema,
  journeyLibrarySchema,
  savedJourneySchema,
  type ActiveJourneySession,
  type JourneyLibrary,
  type SavedJourney,
} from "@culturecompass/shared";

const MAX_JOURNEYS = 50;

export function emptyLibrary(): JourneyLibrary {
  return { version: 1, journeys: [] };
}

export function readJourneyLibrary(
  storage: Pick<Storage, "getItem">,
): JourneyLibrary {
  const raw = storage.getItem(JOURNEY_LIBRARY_STORAGE_KEY);
  if (!raw) return emptyLibrary();

  try {
    const parsed = journeyLibrarySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return emptyLibrary();
    return parsed.data;
  } catch {
    return emptyLibrary();
  }
}

export function writeJourneyLibrary(
  storage: Pick<Storage, "setItem">,
  library: JourneyLibrary,
): void {
  const parsed = journeyLibrarySchema.parse(library);
  storage.setItem(JOURNEY_LIBRARY_STORAGE_KEY, JSON.stringify(parsed));
}

export function listSavedJourneys(storage: Pick<Storage, "getItem">): SavedJourney[] {
  const library = readJourneyLibrary(storage);
  return [...library.journeys].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getSavedJourney(
  storage: Pick<Storage, "getItem">,
  id: string,
): SavedJourney | null {
  return readJourneyLibrary(storage).journeys.find((j) => j.id === id) ?? null;
}

/**
 * Insert or replace a journey. Caps at 50 by dropping the oldest updated entry
 * when inserting a new id would overflow.
 */
export function upsertSavedJourney(
  storage: Pick<Storage, "getItem" | "setItem">,
  journey: SavedJourney,
): SavedJourney {
  const validated = savedJourneySchema.parse(journey);
  const library = readJourneyLibrary(storage);
  const existingIndex = library.journeys.findIndex((j) => j.id === validated.id);

  let journeys: SavedJourney[];
  if (existingIndex >= 0) {
    journeys = [...library.journeys];
    journeys[existingIndex] = validated;
  } else {
    journeys = [validated, ...library.journeys];
    if (journeys.length > MAX_JOURNEYS) {
      journeys = [...journeys]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, MAX_JOURNEYS);
    }
  }

  writeJourneyLibrary(storage, { version: 1, journeys });
  return validated;
}

export function deleteSavedJourney(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
): boolean {
  const library = readJourneyLibrary(storage);
  const next = library.journeys.filter((j) => j.id !== id);
  if (next.length === library.journeys.length) return false;
  writeJourneyLibrary(storage, { version: 1, journeys: next });
  return true;
}

/** Clears library keys only — never theme or active planner session. */
export function clearAllSavedJourneys(
  storage: Pick<Storage, "removeItem">,
): void {
  storage.removeItem(JOURNEY_LIBRARY_STORAGE_KEY);
}

export function readActiveJourneySession(
  storage: Pick<Storage, "getItem">,
): ActiveJourneySession {
  const raw = storage.getItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY);
  if (!raw) {
    return activeJourneySessionSchema.parse({});
  }
  try {
    const parsed = activeJourneySessionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return activeJourneySessionSchema.parse({});
    return parsed.data;
  } catch {
    return activeJourneySessionSchema.parse({});
  }
}

export function writeActiveJourneySession(
  storage: Pick<Storage, "setItem">,
  session: ActiveJourneySession,
): void {
  const parsed = activeJourneySessionSchema.parse(session);
  storage.setItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY, JSON.stringify(parsed));
}

export function clearActiveJourneySession(
  storage: Pick<Storage, "removeItem">,
): void {
  storage.removeItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY);
}

export function createJourneyId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `journey-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
