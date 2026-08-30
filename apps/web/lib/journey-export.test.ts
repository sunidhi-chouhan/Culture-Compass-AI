import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CompassPlanResponse, TripItinerary } from "@culturecompass/shared";
import { buildJourneyExport, journeyPdfFilename } from "./journey-export";

const plan: CompassPlanResponse = {
  destinations: [],
  featuredDestination: {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    tagline: "Temples in the hills",
    rationale: "Heritage",
    bestTimeToVisit: "Spring",
    estimatedBudget: "₹₹₹",
  },
  attractions: [],
  hiddenGems: [
    {
      name: "Philosopher’s Path",
      description: "Quiet canal walk",
      whyVisit: "Cherry trees and bookshops",
      localTip: "Go at dawn",
    },
  ],
  heritage: {
    highlights: ["Fushimi Inari"],
    traditions: ["Tea"],
    etiquetteTips: ["Remove shoes"],
    culturalSignificance: "Former capital",
  },
  events: [],
  experiences: [],
  storySnippet: { title: "", preview: "", narrative: "", tone: "immersive" },
};

const itinerary: TripItinerary = {
  days: [
    {
      dayNumber: 1,
      title: "Day 1",
      summary: "Arrival",
      slots: [
        {
          id: "a",
          dayPart: "morning",
          timeLabel: "09:00",
          title: "Fushimi Inari",
          description: "Walk the torii gates.",
          placeName: "Fushimi Inari",
          durationMinutes: 90,
          tags: ["Heritage"],
          featured: true,
        },
      ],
    },
  ],
};

describe("buildJourneyExport", () => {
  it("includes itinerary, packing groups, and hidden gems", () => {
    const model = buildJourneyExport({
      plan,
      request: {
        destination: "Kyoto",
        interests: ["history"],
        budget: "moderate",
        duration: "2 days",
        travelStyle: "solo",
        notes: "",
        lensMode: "tourist",
      },
      itinerary,
      packing: {
        items: [
          { id: "1", label: "Walking shoes", category: "gear", packed: false, essential: true },
        ],
        preferences: { extras: [] },
        tripSummary: "Kyoto · 2 days",
      },
    });

    assert.equal(model.destination, "Kyoto");
    assert.equal(model.durationLabel, "2 days");
    assert.equal(model.days.length, 1);
    assert.equal(model.days[0].slots[0].title, "Fushimi Inari");
    assert.equal(model.packingGroups[0].category, "gear");
    assert.equal(model.hiddenGems[0].name, "Philosopher’s Path");
    assert.ok(model.insights.some((s) => s.id === "heritage"));
    assert.ok(model.insights.some((s) => s.id === "etiquette"));
    assert.ok(model.insights.some((s) => s.id === "budget"));
    assert.ok(model.insights.some((s) => s.id === "food"));
    assert.equal(journeyPdfFilename("Kyoto, Japan"), "journeymind-kyoto-japan.pdf");
  });
});
