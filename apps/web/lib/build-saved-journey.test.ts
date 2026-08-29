import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CompassPlanRequest, CompassPlanResponse } from "@culturecompass/shared";
import {
  buildSavedJourney,
  defaultJourneyTitle,
  preferencesFromRequest,
  requestFromSavedJourney,
} from "./build-saved-journey";

const plan = {
  destinations: [
    {
      id: "kyoto",
      name: "Kyoto",
      country: "Japan",
      tagline: "Temples",
      rationale: "Heritage",
      bestTimeToVisit: "Spring",
      estimatedBudget: "₹₹₹",
    },
  ],
  featuredDestination: {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    tagline: "Temples",
    rationale: "Heritage",
    bestTimeToVisit: "Spring",
    estimatedBudget: "₹₹₹",
  },
  attractions: [],
  hiddenGems: [],
  heritage: {
    highlights: ["Temples"],
    traditions: ["Tea"],
    etiquetteTips: ["Remove shoes"],
    culturalSignificance: "Former capital",
  },
  events: [],
  experiences: [],
  storySnippet: {
    title: "Story",
    preview: "Lanterns",
    narrative: "Once",
    tone: "immersive",
  },
} as CompassPlanResponse;

const request: CompassPlanRequest = {
  destination: "Kyoto",
  interests: ["heritage"],
  budget: "₹₹ Comfortable",
  duration: "1 Week",
  travelStyle: "solo",
  notes: "",
  lensMode: "tourist",
};

describe("buildSavedJourney", () => {
  it("builds a titled journey with preferences and itinerary", () => {
    const itinerary = {
      days: [
        {
          dayNumber: 1,
          title: "Arrival",
          summary: "Settle in",
          slots: [
            {
              id: "s1",
              dayPart: "morning" as const,
              title: "Tea",
              description: "Matcha",
              category: "food" as const,
            },
          ],
        },
      ],
      generatedAt: "2026-08-29T10:00:00.000Z",
    };

    const saved = buildSavedJourney({
      plan,
      request,
      itinerary,
      now: new Date("2026-08-29T12:00:00.000Z"),
    });

    assert.equal(saved.title, "Kyoto · 1 Week");
    assert.equal(saved.preferences.destination, "Kyoto");
    assert.equal(saved.preferences.companion, "Solo");
    assert.equal(saved.itinerary?.days.length, 1);
    assert.equal(saved.culturalPlan.itinerary?.days.length, 1);
    assert.equal(saved.compassRequest?.destination, "Kyoto");
    assert.equal(saved.userId, null);
  });

  it("preserves id and createdAt when updating", () => {
    const first = buildSavedJourney({
      plan,
      request,
      now: new Date("2026-08-29T10:00:00.000Z"),
    });
    const second = buildSavedJourney({
      plan,
      request,
      existing: first,
      title: "Kyoto spring",
      now: new Date("2026-08-30T10:00:00.000Z"),
    });

    assert.equal(second.id, first.id);
    assert.equal(second.createdAt, first.createdAt);
    assert.equal(second.title, "Kyoto spring");
    assert.equal(second.updatedAt, "2026-08-30T10:00:00.000Z");
  });
});

describe("preferencesFromRequest / requestFromSavedJourney", () => {
  it("round-trips essential request fields", () => {
    const prefs = preferencesFromRequest(request);
    assert.equal(prefs.companion, "Solo");

    const saved = buildSavedJourney({ plan, request });
    const restored = requestFromSavedJourney(saved);
    assert.equal(restored.destination, "Kyoto");
    assert.deepEqual(restored.interests, ["heritage"]);
    assert.equal(restored.travelStyle, "solo");
  });

  it("defaultJourneyTitle falls back without duration", () => {
    assert.equal(defaultJourneyTitle("Lisbon"), "Lisbon");
    assert.equal(defaultJourneyTitle("  "), "Untitled journey");
  });
});
