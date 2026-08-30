import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseItineraryResponse } from "./parse-itinerary-response";

const days = [
  {
    dayNumber: 1,
    title: "Day 1",
    slots: [{ id: "d1-a", title: "Plaza", dayPart: "Morning", durationMinutes: "90" }],
  },
];

describe("parseItineraryResponse", () => {
  it("accepts root-level days (Gemini prompt shape)", () => {
    const result = parseItineraryResponse({
      days,
      notes: "Pace yourself",
      generatedAt: "2026-08-29T18:02:00.724Z",
    });
    assert.equal(result.itinerary.days.length, 1);
    assert.equal(result.itinerary.days[0].slots[0].title, "Plaza");
    assert.equal(result.itinerary.days[0].slots[0].dayPart, "morning");
    assert.equal(result.itinerary.days[0].slots[0].durationMinutes, 90);
  });

  it("accepts wrapped { itinerary } API shape", () => {
    const result = parseItineraryResponse({ itinerary: { days } });
    assert.equal(result.itinerary.days.length, 1);
  });

  it("drops invalid generatedAt instead of failing", () => {
    const result = parseItineraryResponse({
      days,
      generatedAt: "tomorrow morning",
    });
    assert.equal(result.itinerary.generatedAt, undefined);
  });
});
