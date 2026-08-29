import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { tripItinerarySchema } from "@culturecompass/shared";
import { getMockItinerary } from "./itinerary";

describe("getMockItinerary", () => {
  it("builds a schema-valid multi-day itinerary", () => {
    const itinerary = getMockItinerary({
      destination: "Kyoto",
      interests: ["history", "food"],
      duration: "3 days",
    });
    const parsed = tripItinerarySchema.safeParse(itinerary);
    assert.equal(parsed.success, true);
    assert.equal(itinerary.days.length, 3);
    assert.equal(itinerary.days[0].slots.length, 3);
  });

  it("scales day count from duration", () => {
    const week = getMockItinerary({
      destination: "Bali",
      interests: ["nature"],
      duration: "1 week",
    });
    assert.equal(week.days.length, 7);
  });

  it("uses place-led titles and schedule metadata", () => {
    const itinerary = getMockItinerary({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "3 days",
    });
    const slot = itinerary.days[0].slots[0];
    assert.ok(slot.placeName);
    assert.equal(slot.title, slot.placeName);
    assert.ok((slot.durationMinutes ?? 0) > 0);
    assert.ok((slot.tags?.length ?? 0) > 0);
    assert.equal(slot.featured, true);
    assert.doesNotMatch(slot.description, /paced|shaped around/i);
  });
});
