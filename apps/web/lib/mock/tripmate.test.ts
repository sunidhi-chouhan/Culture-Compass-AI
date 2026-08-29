import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tripMateResultSchema } from "@culturecompass/shared";
import { getMockTripMateResult } from "./tripmate";
import { getMockItinerary } from "./itinerary";

describe("getMockTripMateResult", () => {
  it("returns schema-valid suggestions for a structured itinerary", () => {
    const itinerary = getMockItinerary({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "3 days",
    });
    // Force a tight gap so conflict suggestions fire.
    itinerary.days[0].slots[0].travelMinutesToNext = 5;

    const result = getMockTripMateResult({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "3 days",
      itinerary,
    });

    const parsed = tripMateResultSchema.safeParse(result);
    assert.equal(parsed.success, true);
    assert.ok(result.suggestions.length >= 1);
    assert.ok(result.improvedItinerary);
    assert.equal(result.applied, false);
  });

  it("handles missing schedule without throwing", () => {
    const result = getMockTripMateResult({
      destination: "Kyoto",
      interests: ["history"],
    });
    assert.ok(result.analysisSummary.length > 0);
    assert.equal(result.improvedItinerary, undefined);
  });

  it("emits actionable patches for structured itineraries", () => {
    const itinerary = getMockItinerary({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "3 days",
    });
    itinerary.days[0].slots[0].travelMinutesToNext = 5;
    const result = getMockTripMateResult({
      destination: "Oaxaca",
      interests: ["food"],
      itinerary,
    });
    assert.ok(result.suggestions.some((s) => s.action?.type === "set_travel_minutes"));
    assert.ok(result.suggestions.some((s) => s.recommendation));
  });
});
