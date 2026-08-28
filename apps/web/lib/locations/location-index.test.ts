import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { queryLocations, resetLocationIndexCache } from "./location-index";
import { MOCK_LOCATION_INDEX } from "@/lib/mock/locations";
import { searchLocations } from "@culturecompass/shared";

describe("queryLocations with mock index", () => {
  it("returns Indore for ind query when USE_MOCK_LOCATIONS is true", () => {
    const previous = process.env.USE_MOCK_LOCATIONS;
    process.env.USE_MOCK_LOCATIONS = "true";
    resetLocationIndexCache();

    try {
      const results = queryLocations("ind");
      assert.ok(results.some((r) => r.name === "Indore"));
    } finally {
      process.env.USE_MOCK_LOCATIONS = previous;
    }
  });
});

describe("mock location index", () => {
  it("mock index search is deterministic", () => {
    const a = searchLocations(MOCK_LOCATION_INDEX, "ind");
    const b = searchLocations(MOCK_LOCATION_INDEX, "ind");
    assert.deepEqual(a, b);
  });
});
