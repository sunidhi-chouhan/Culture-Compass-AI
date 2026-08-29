import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPlaceSearchUrl } from "./place-search-url";

describe("buildPlaceSearchUrl", () => {
  it("builds a Google search URL for a place name", () => {
    const url = buildPlaceSearchUrl("Alley Kitchen");
    assert.equal(url, "https://www.google.com/search?q=Alley%20Kitchen");
  });

  it("includes destination context when provided", () => {
    const url = buildPlaceSearchUrl("Alley Kitchen", "Fatih, Istanbul, Turkey");
    assert.equal(
      url,
      "https://www.google.com/search?q=Alley%20Kitchen%20Fatih%2C%20Istanbul%2C%20Turkey",
    );
  });
});
