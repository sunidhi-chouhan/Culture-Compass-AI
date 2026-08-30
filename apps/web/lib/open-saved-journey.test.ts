import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SavedJourney } from "@culturecompass/shared";
import { openSavedJourneyIntoSession } from "./open-saved-journey";
import { readActiveJourneySession } from "./journey-library-storage";
import { readSessionPacking } from "./packing-session-storage";
import { readPlannerSession } from "./planner-session-storage";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const journey = {
  id: "journey-open",
  title: "Lisbon · Weekend",
  createdAt: "2026-08-29T10:00:00.000Z",
  updatedAt: "2026-08-29T12:00:00.000Z",
  preferences: {
    destination: "Lisbon",
    interests: ["food"],
    companion: "Solo",
    budget: "moderate",
    duration: "Weekend",
    customDuration: "",
  },
  culturalPlan: {
    destinations: [
      {
        id: "lisbon",
        name: "Lisbon",
        country: "Portugal",
        tagline: "Hills and tiles",
        rationale: "Light and food",
        bestTimeToVisit: "Spring",
        estimatedBudget: "₹₹",
      },
    ],
    featuredDestination: {
      id: "lisbon",
      name: "Lisbon",
      country: "Portugal",
      tagline: "Hills and tiles",
      rationale: "Light and food",
      bestTimeToVisit: "Spring",
      estimatedBudget: "₹₹",
    },
    attractions: [],
    hiddenGems: [],
    heritage: {
      highlights: ["Alfama"],
      traditions: ["Fado"],
      etiquetteTips: ["Greet shopkeepers"],
      culturalSignificance: "Atlantic capital",
    },
    events: [],
    experiences: [],
    storySnippet: {
      title: "Story",
      preview: "Tram 28",
      narrative: "Once…",
      tone: "immersive",
    },
  },
  itinerary: {
    days: [
      {
        dayNumber: 1,
        title: "Arrival",
        summary: "Settle",
        slots: [
          {
            id: "s1",
            dayPart: "morning",
            title: "Pastéis",
            description: "Breakfast",
            category: "food",
            tags: [],
            featured: false,
          },
        ],
      },
    ],
  },
  packing: {
    items: [
      {
        id: "p1",
        label: "Walking shoes",
        category: "clothing",
        packed: true,
        essential: true,
      },
    ],
    preferences: { extras: [] },
    generatedAt: "2026-08-29T11:00:00.000Z",
  },
  compassRequest: {
    destination: "Lisbon",
    interests: ["food"],
    budget: "₹₹ Comfortable",
    duration: "Weekend",
    travelStyle: "solo",
    notes: "",
    lensMode: "tourist",
  },
  userId: null,
} as SavedJourney;

describe("openSavedJourneyIntoSession", () => {
  it("writes plan, request, and active journey pointer", () => {
    const storage = memoryStorage();
    openSavedJourneyIntoSession(journey, storage);

    const session = readPlannerSession(storage);
    assert.equal(session?.plan.featuredDestination.name, "Lisbon");
    assert.equal(session?.plan.itinerary?.days.length, 1);
    assert.equal(session?.request.destination, "Lisbon");

    const active = readActiveJourneySession(storage);
    assert.equal(active.activeJourneyId, "journey-open");
    assert.equal(active.isDraft, false);

    const packing = readSessionPacking(storage);
    assert.equal(packing?.items[0]?.label, "Walking shoes");
    assert.equal(packing?.items[0]?.packed, true);
  });
});
