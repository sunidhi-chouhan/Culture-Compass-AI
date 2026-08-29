import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMockPackingList } from "./packing";

describe("getMockPackingList", () => {
  it("returns essentials with reasons and quantities", () => {
    const packing = getMockPackingList({
      destination: "Kyoto",
      interests: ["heritage"],
      duration: "3 Days",
      activityHints: ["temples", "walking"],
    });

    assert.ok(packing.items.length >= 8);
    assert.ok(packing.items.some((i) => /passport/i.test(i.label)));
    assert.ok(packing.items.every((i) => i.packed === false));
    assert.ok(packing.items.every((i) => Boolean(i.reason)));
    assert.ok(packing.tripSummary?.includes("Kyoto"));
    assert.ok((packing.insights?.itineraryAddedCount ?? 0) >= 1);

    const tees = packing.items.find((i) => /t-shirts/i.test(i.label));
    assert.ok(tees);
    assert.equal(tees!.quantity, 3);
    assert.equal(tees!.quantityLabel, "3");
  });

  it("adds market and preference items for culinary trips", () => {
    const packing = getMockPackingList({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "Weekend",
      activityHints: ["markets"],
      preferences: { extras: ["Reusable tote"], climateNotes: "Warm days" },
    });

    assert.ok(packing.items.some((i) => /sanitizer|wipes/i.test(i.label)));
    assert.ok(packing.items.some((i) => i.label === "Reusable tote"));
    assert.ok(packing.items.some((i) => i.source === "weather"));
    assert.equal(packing.preferences.climateNotes, "Warm days");
  });

  it("adds outdoor and weather items for nature trips", () => {
    const packing = getMockPackingList({
      destination: "Patagonia",
      interests: ["nature"],
      duration: "1 Week",
      activityHints: ["hike"],
      preferences: { climateNotes: "Cold mornings, chance of rain", extras: [] },
    });

    assert.ok(packing.items.some((i) => /water bottle|hiking|umbrella|fleece|warm/i.test(i.label)));
    assert.ok(packing.items.some((i) => i.source === "itinerary"));
    assert.ok((packing.insights?.weather?.length ?? 0) >= 1);
  });
});
