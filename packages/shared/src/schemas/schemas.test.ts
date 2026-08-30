import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compassPlanRequestSchema,
  compassPlanResponseSchema,
  storyRequestSchema,
  destinationsRequestSchema,
  healthResponseSchema,
  apiErrorSchema,
  tripItinerarySchema,
  tripMateRequestSchema,
  tripMateResultSchema,
  packingListSchema,
  packingRequestSchema,
  savedJourneySchema,
  journeyLibrarySchema,
  activeJourneySessionSchema,
  itineraryRequestSchema,
  JOURNEY_LIBRARY_STORAGE_KEY,
  ACTIVE_JOURNEY_SESSION_STORAGE_KEY,
} from "./index";

describe("compassPlanRequestSchema", () => {
  const validRequest = {
    interests: ["history", "food"],
    budget: "$2000",
    duration: "5 days",
    travelStyle: "cultural",
    notes: "",
  };

  it("accepts a valid request", () => {
    const result = compassPlanRequestSchema.safeParse(validRequest);
    assert.equal(result.success, true);
  });

  it("rejects empty interests", () => {
    const result = compassPlanRequestSchema.safeParse({
      ...validRequest,
      interests: [],
    });
    assert.equal(result.success, false);
  });

  it("rejects notes over 500 characters", () => {
    const result = compassPlanRequestSchema.safeParse({
      ...validRequest,
      notes: "a".repeat(501),
    });
    assert.equal(result.success, false);
  });

  it("rejects more than 10 interests", () => {
    const result = compassPlanRequestSchema.safeParse({
      ...validRequest,
      interests: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
    });
    assert.equal(result.success, false);
  });

  it("defaults lens mode to tourist", () => {
    const result = compassPlanRequestSchema.safeParse({
      interests: ["history"],
      budget: "$1000",
      duration: "3 days",
      travelStyle: "cultural",
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.lensMode, "tourist");
    }
  });

  it("accepts local lens mode", () => {
    const result = compassPlanRequestSchema.safeParse({
      interests: ["history"],
      budget: "$1000",
      duration: "3 days",
      travelStyle: "cultural",
      lensMode: "local",
    });
    assert.equal(result.success, true);
  });
});

describe("compassPlanResponseSchema", () => {
  it("requires at least one destination", () => {
    const result = compassPlanResponseSchema.safeParse({
      destinations: [],
      featuredDestination: {
        id: "kyoto",
        name: "Kyoto",
        country: "Japan",
        tagline: "Ancient capital",
        rationale: "Rich heritage",
        bestTimeToVisit: "Spring",
        estimatedBudget: "$1500",
      },
      attractions: [],
      hiddenGems: [],
      heritage: {
        highlights: [],
        traditions: [],
        etiquetteTips: [],
        culturalSignificance: "Significant",
      },
      events: [],
      experiences: [],
      storySnippet: { title: "T", preview: "P", narrative: "You arrive.", tone: "immersive" },
    });
    assert.equal(result.success, false);
  });
});

describe("storyRequestSchema", () => {
  it("accepts valid story request", () => {
    const result = storyRequestSchema.safeParse({ placeName: "Kyoto" });
    assert.equal(result.success, true);
  });

  it("rejects empty place name", () => {
    const result = storyRequestSchema.safeParse({ placeName: "" });
    assert.equal(result.success, false);
  });

  it("rejects place name over 100 characters", () => {
    const result = storyRequestSchema.safeParse({ placeName: "a".repeat(101) });
    assert.equal(result.success, false);
  });
});

describe("destinationsRequestSchema", () => {
  it("requires budget and duration", () => {
    const result = destinationsRequestSchema.safeParse({
      interests: ["art"],
      budget: "",
      duration: "5 days",
      travelStyle: "cultural",
    });
    assert.equal(result.success, false);
  });
});

describe("healthResponseSchema", () => {
  it("accepts ok status", () => {
    const result = healthResponseSchema.safeParse({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
    assert.equal(result.success, true);
  });
});

describe("apiErrorSchema", () => {
  it("accepts valid error codes", () => {
    const result = apiErrorSchema.safeParse({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    });
    assert.equal(result.success, true);
  });

  it("rejects unknown error codes", () => {
    const result = apiErrorSchema.safeParse({
      error: "Oops",
      code: "UNKNOWN",
    });
    assert.equal(result.success, false);
  });
});

const samplePlan = {
  destinations: [
    {
      id: "kyoto",
      name: "Kyoto",
      country: "Japan",
      tagline: "Ancient capital",
      rationale: "Rich heritage",
      bestTimeToVisit: "Spring",
      estimatedBudget: "$1500",
    },
  ],
  featuredDestination: {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    tagline: "Ancient capital",
    rationale: "Rich heritage",
    bestTimeToVisit: "Spring",
    estimatedBudget: "$1500",
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
    title: "Lantern Path",
    preview: "Evening light",
    narrative: "You arrive as lanterns glow.",
    tone: "immersive",
  },
};

const sampleItinerary = {
  days: [
    {
      dayNumber: 1,
      title: "Arrival",
      summary: "Historic centre",
      slots: [
        {
          id: "d1-s1",
          dayPart: "morning",
          timeLabel: "09:00",
          title: "Temple walk",
          description: "Quiet start among the hillside halls.",
          placeName: "Kiyomizu-dera",
          category: "sightseeing",
          durationMinutes: 90,
          travelMinutesToNext: 20,
          tags: ["Heritage", "Views"],
          featured: true,
          imageSeed: "kiyomizu-dera",
        },
      ],
    },
  ],
};

describe("tripItinerarySchema", () => {
  it("accepts a valid day-wise itinerary", () => {
    const result = tripItinerarySchema.safeParse(sampleItinerary);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.days[0].slots[0].durationMinutes, 90);
      assert.equal(result.data.days[0].slots[0].featured, true);
      assert.deepEqual(result.data.days[0].slots[0].tags, ["Heritage", "Views"]);
    }
  });

  it("defaults tags and featured when omitted", () => {
    const result = tripItinerarySchema.safeParse({
      days: [
        {
          dayNumber: 1,
          slots: [{ id: "s1", title: "Walk" }],
        },
      ],
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.deepEqual(result.data.days[0].slots[0].tags, []);
      assert.equal(result.data.days[0].slots[0].featured, false);
    }
  });

  it("rejects empty days", () => {
    const result = tripItinerarySchema.safeParse({ days: [] });
    assert.equal(result.success, false);
  });
});

describe("compassPlanResponseSchema itinerary", () => {
  it("accepts plans without itinerary (backward compatible)", () => {
    const result = compassPlanResponseSchema.safeParse(samplePlan);
    assert.equal(result.success, true);
  });

  it("accepts plans with optional itinerary", () => {
    const result = compassPlanResponseSchema.safeParse({
      ...samplePlan,
      itinerary: sampleItinerary,
    });
    assert.equal(result.success, true);
  });
});

describe("tripMate schemas", () => {
  it("accepts a TripMate improve request with pasted schedule", () => {
    const result = tripMateRequestSchema.safeParse({
      destination: "Rome",
      interests: ["history"],
      pastedSchedule: "10:00 Colosseum\n10:30 Vatican\n11:00 Forum",
    });
    assert.equal(result.success, true);
  });

  it("accepts a TripMate result with actionable suggestions", () => {
    const result = tripMateResultSchema.safeParse({
      analysisSummary: "Morning is overpacked.",
      suggestions: [
        {
          id: "s1",
          kind: "conflict",
          title: "Too many sites before lunch",
          detail: "Leave a gap between Colosseum and Vatican.",
          dayLabel: "DAY 1",
          headline: "Colosseum → Vatican",
          recommendation: "Add 30 minutes of buffer between stops.",
          action: {
            type: "set_travel_minutes",
            slotId: "d1-s1",
            travelMinutesToNext: 30,
          },
        },
      ],
      improvedItinerary: sampleItinerary,
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.applied, false);
      assert.equal(result.data.suggestions[0].severity, "info");
      assert.equal(result.data.suggestions[0].action?.type, "set_travel_minutes");
    }
  });
});

describe("packingListSchema", () => {
  it("accepts packing items with defaults and journey-aware fields", () => {
    const result = packingListSchema.safeParse({
      items: [
        {
          id: "p1",
          label: "Comfortable shoes",
          reason: "Walking-heavy itinerary",
          quantity: 1,
          source: "itinerary",
        },
      ],
      tripSummary: "Kyoto · 3 Days · Heritage",
      insights: { weather: ["Mild evenings"], activity: ["Temples"], itineraryAddedCount: 1 },
    });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.items[0].packed, false);
      assert.equal(result.data.items[0].category, "general");
      assert.equal(result.data.items[0].reason, "Walking-heavy itinerary");
      assert.equal(result.data.items[0].source, "itinerary");
      assert.equal(result.data.insights?.itineraryAddedCount, 1);
    }
  });
});

describe("packingRequestSchema", () => {
  it("accepts a trip-aware packing request", () => {
    const result = packingRequestSchema.safeParse({
      destination: "Kyoto",
      interests: ["heritage"],
      duration: "3 Days",
      preferences: { climateNotes: "Mild", extras: ["Tea thermos"] },
      activityHints: ["temples"],
    });
    assert.equal(result.success, true);
  });
});

describe("savedJourneySchema and library", () => {
  const saved = {
    id: "journey-1",
    title: "Kyoto spring",
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T12:00:00.000Z",
    preferences: {
      destination: "Kyoto",
      interests: ["heritage"],
      companion: "Solo",
      budget: "moderate",
      duration: "3 Days",
      customDuration: "",
    },
    culturalPlan: samplePlan,
    itinerary: sampleItinerary,
    packing: {
      items: [{ id: "p1", label: "Light jacket", category: "clothing", packed: false }],
    },
    userId: null,
  };

  it("accepts a full saved journey document", () => {
    const result = savedJourneySchema.safeParse(saved);
    assert.equal(result.success, true);
  });

  it("accepts a multi-journey library", () => {
    const result = journeyLibrarySchema.safeParse({
      version: 1,
      journeys: [saved],
    });
    assert.equal(result.success, true);
  });

  it("rejects more than 50 journeys", () => {
    const result = journeyLibrarySchema.safeParse({
      version: 1,
      journeys: Array.from({ length: 51 }, (_, i) => ({
        ...saved,
        id: `journey-${i}`,
      })),
    });
    assert.equal(result.success, false);
  });
});

describe("activeJourneySessionSchema", () => {
  it("defaults to draft with no active id", () => {
    const result = activeJourneySessionSchema.safeParse({});
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.activeJourneyId, null);
      assert.equal(result.data.isDraft, true);
    }
  });
});

describe("itineraryRequestSchema", () => {
  it("requires destination, interests, and duration", () => {
    const ok = itineraryRequestSchema.safeParse({
      destination: "Kyoto",
      interests: ["food"],
      duration: "3 days",
    });
    assert.equal(ok.success, true);

    const bad = itineraryRequestSchema.safeParse({
      destination: "Kyoto",
      interests: [],
      duration: "3 days",
    });
    assert.equal(bad.success, false);
  });
});

describe("journey storage keys", () => {
  it("exposes stable library and session key constants", () => {
    assert.equal(JOURNEY_LIBRARY_STORAGE_KEY, "journeymind.library.v1");
    assert.equal(ACTIVE_JOURNEY_SESSION_STORAGE_KEY, "journeymind.activeSession.v1");
  });
});
