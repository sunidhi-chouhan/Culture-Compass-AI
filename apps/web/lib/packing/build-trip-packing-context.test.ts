import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CompassPlanRequest, CompassPlanResponse, TripItinerary } from "@culturecompass/shared";
import { buildTripPackingContext } from "./build-trip-packing-context";

const plan = {
  destinations: [
    {
      id: "oaxaca",
      name: "Oaxaca",
      country: "Mexico",
      tagline: "Mole and markets",
      rationale: "Food",
      bestTimeToVisit: "Oct–Mar · mild evenings",
      estimatedBudget: "₹₹",
    },
  ],
  featuredDestination: {
    id: "oaxaca",
    name: "Oaxaca",
    country: "Mexico",
    tagline: "Mole and markets",
    rationale: "Food",
    bestTimeToVisit: "Oct–Mar · mild evenings",
    estimatedBudget: "₹₹",
  },
  attractions: [{ name: "Santo Domingo", description: "Church", category: "heritage", tip: "Morning" }],
  hiddenGems: [],
  heritage: {
    highlights: ["Zapotec"],
    traditions: ["Guelaguetza"],
    etiquetteTips: ["Greet"],
    culturalSignificance: "Roots",
  },
  events: [],
  experiences: [],
  storySnippet: {
    title: "Story",
    preview: "Dawn",
    narrative: "Once",
    tone: "immersive",
  },
} as CompassPlanResponse;

const request: CompassPlanRequest = {
  destination: "Oaxaca",
  interests: ["Food", "Festivals"],
  budget: "₹₹ Comfortable",
  duration: "3 Days",
  travelStyle: "adventurous",
  notes: "",
  lensMode: "tourist",
};

const itinerary: TripItinerary = {
  days: [
    {
      dayNumber: 1,
      title: "Markets",
      summary: "Food",
      slots: [
        {
          id: "s1",
          dayPart: "morning",
          title: "Central market",
          description: "Street food",
          placeName: "Mercado 20 de Noviembre",
          category: "food",
          durationMinutes: 120,
          travelMinutesToNext: 20,
          tags: ["Food", "Markets"],
          featured: true,
        },
        {
          id: "s2",
          dayPart: "afternoon",
          title: "Santo Domingo",
          description: "Temple courtyard",
          placeName: "Templo de Santo Domingo",
          category: "sightseeing",
          durationMinutes: 100,
          tags: ["Heritage", "Temple"],
          featured: true,
        },
        {
          id: "s3",
          dayPart: "evening",
          title: "Festival plaza",
          description: "Local celebration",
          category: "culture",
          durationMinutes: 90,
          tags: ["Festivals"],
          featured: false,
        },
      ],
    },
  ],
  generatedAt: "2026-08-29T12:00:00.000Z",
};

describe("buildTripPackingContext", () => {
  it("builds trip summary and activity signals from itinerary", () => {
    const ctx = buildTripPackingContext({
      plan,
      request,
      itinerary,
      climateNotes: "Mild evenings",
    });

    assert.match(ctx.tripSummary, /Oaxaca/);
    assert.match(ctx.tripSummary, /3 Days/);
    assert.match(ctx.tripSummary, /Friends/);
    assert.equal(ctx.dayCount, 3);
    assert.equal(ctx.activitySignals.temples, true);
    assert.equal(ctx.activitySignals.festivals, true);
    assert.equal(ctx.activitySignals.markets, true);
    assert.ok(ctx.fingerprint.includes("Oaxaca"));
    assert.ok(ctx.weatherInsightLines.length >= 1);

    const payload = ctx.toPackingRequest({ climateNotes: "Mild evenings", extras: [] });
    assert.equal(payload.destination, "Oaxaca");
    assert.ok(payload.activityHints?.includes("temples") || payload.activityHints?.includes("Festivals"));
  });
});
