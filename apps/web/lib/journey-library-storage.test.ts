import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  JOURNEY_LIBRARY_STORAGE_KEY,
  ACTIVE_JOURNEY_SESSION_STORAGE_KEY,
  type SavedJourney,
} from "@culturecompass/shared";
import {
  clearAllSavedJourneys,
  clearActiveJourneySession,
  createJourneyId,
  deleteSavedJourney,
  emptyLibrary,
  getSavedJourney,
  listSavedJourneys,
  readActiveJourneySession,
  readJourneyLibrary,
  upsertSavedJourney,
  writeActiveJourneySession,
} from "./journey-library-storage";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    dump: () => Object.fromEntries(map),
  };
}

function sampleJourney(overrides: Partial<SavedJourney> = {}): SavedJourney {
  const base: SavedJourney = {
    id: "journey-1",
    title: "Oaxaca · 3 Days",
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T12:00:00.000Z",
    preferences: {
      destination: "Oaxaca",
      interests: ["food"],
      companion: "Solo",
      budget: "moderate",
      duration: "3 Days",
      customDuration: "",
    },
    culturalPlan: {
      destinations: [
        {
          id: "oaxaca",
          name: "Oaxaca",
          country: "Mexico",
          tagline: "Mole and markets",
          rationale: "Food culture",
          bestTimeToVisit: "Oct–Mar",
          estimatedBudget: "₹₹",
        },
      ],
      featuredDestination: {
        id: "oaxaca",
        name: "Oaxaca",
        country: "Mexico",
        tagline: "Mole and markets",
        rationale: "Food culture",
        bestTimeToVisit: "Oct–Mar",
        estimatedBudget: "₹₹",
      },
      attractions: [],
      hiddenGems: [],
      heritage: {
        highlights: ["Zócalo"],
        traditions: ["Guelaguetza"],
        etiquetteTips: ["Greet vendors"],
        culturalSignificance: "Zapotec roots",
      },
      events: [],
      experiences: [],
      storySnippet: {
        title: "Story",
        preview: "Markets at dawn",
        narrative: "Once…",
        tone: "immersive",
      },
    },
    userId: null,
    ...overrides,
  };
  return base;
}

describe("journey-library-storage", () => {
  it("returns empty library when missing or corrupt", () => {
    const storage = memoryStorage();
    assert.deepEqual(readJourneyLibrary(storage), emptyLibrary());

    storage.setItem(JOURNEY_LIBRARY_STORAGE_KEY, "not-json");
    assert.deepEqual(readJourneyLibrary(storage), emptyLibrary());
  });

  it("upserts, lists newest first, and fetches by id", () => {
    const storage = memoryStorage();
    const older = sampleJourney({
      id: "a",
      title: "Older",
      updatedAt: "2026-08-28T10:00:00.000Z",
    });
    const newer = sampleJourney({
      id: "b",
      title: "Newer",
      updatedAt: "2026-08-29T10:00:00.000Z",
    });

    upsertSavedJourney(storage, older);
    upsertSavedJourney(storage, newer);

    const listed = listSavedJourneys(storage);
    assert.equal(listed[0]?.id, "b");
    assert.equal(listed[1]?.id, "a");
    assert.equal(getSavedJourney(storage, "a")?.title, "Older");
  });

  it("updates an existing journey in place", () => {
    const storage = memoryStorage();
    upsertSavedJourney(storage, sampleJourney({ id: "x", title: "First" }));
    upsertSavedJourney(
      storage,
      sampleJourney({
        id: "x",
        title: "Updated",
        updatedAt: "2026-08-30T10:00:00.000Z",
      }),
    );

    const listed = listSavedJourneys(storage);
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.title, "Updated");
  });

  it("deletes one journey and clears all without touching other keys", () => {
    const storage = memoryStorage({ theme: "dark" });
    upsertSavedJourney(storage, sampleJourney({ id: "keep" }));
    upsertSavedJourney(storage, sampleJourney({ id: "gone" }));

    assert.equal(deleteSavedJourney(storage, "gone"), true);
    assert.equal(deleteSavedJourney(storage, "missing"), false);
    assert.equal(listSavedJourneys(storage).length, 1);

    clearAllSavedJourneys(storage);
    assert.equal(listSavedJourneys(storage).length, 0);
    assert.equal(storage.getItem("theme"), "dark");
  });

  it("caps library at 50 journeys", () => {
    const storage = memoryStorage();
    for (let i = 0; i < 51; i++) {
      upsertSavedJourney(
        storage,
        sampleJourney({
          id: `j-${i}`,
          title: `Journey ${i}`,
          updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
        }),
      );
    }
    assert.equal(listSavedJourneys(storage).length, 50);
    assert.equal(getSavedJourney(storage, "j-0"), null);
    assert.ok(getSavedJourney(storage, "j-50"));
  });

  it("reads and clears active journey session pointer", () => {
    const storage = memoryStorage();
    const initial = readActiveJourneySession(storage);
    assert.equal(initial.activeJourneyId, null);
    assert.equal(initial.isDraft, true);

    writeActiveJourneySession(storage, {
      activeJourneyId: "journey-1",
      isDraft: false,
      updatedAt: "2026-08-29T12:00:00.000Z",
    });
    assert.equal(readActiveJourneySession(storage).activeJourneyId, "journey-1");

    clearActiveJourneySession(storage);
    assert.equal(storage.getItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY), null);
  });

  it("createJourneyId returns a non-empty string", () => {
    assert.ok(createJourneyId().length > 8);
  });
});
