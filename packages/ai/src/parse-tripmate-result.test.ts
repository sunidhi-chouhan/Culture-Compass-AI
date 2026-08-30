import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseTripMateResult } from "./parse-tripmate-result";

describe("parseTripMateResult", () => {
  it("keeps suggestions when one action is malformed", () => {
    const result = parseTripMateResult({
      analysisSummary: "Day 2 travel is unrealistic.",
      suggestions: [
        {
          id: "s1",
          kind: "pacing",
          title: "Buffer the citadel transfer",
          detail: "Cusco to Machu Picchu is not a 15-minute hop.",
          action: { type: "set_travel_minutes", slotId: "d2-morning", travelMinutesToNext: 45 },
        },
        {
          id: "s2",
          kind: "mystery-kind",
          title: "Bad action still listed",
          detail: "Shown without apply payload.",
          action: { type: "teleport", slotId: "nope" },
        },
      ],
      improvedItinerary: { not: "an itinerary" },
      applied: false,
    });

    assert.equal(result.suggestions.length, 2);
    assert.equal(result.suggestions[0].action?.type, "set_travel_minutes");
    assert.equal(result.suggestions[1].kind, "other");
    assert.equal(result.suggestions[1].action, undefined);
    assert.equal(result.improvedItinerary, undefined);
  });
});
