import { describe, it, mock, afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import type { Location } from "@culturecompass/shared";
import { fetchLocationSearch } from "./search-api";

const mockLocation: Location = {
  id: "geoname:1269743",
  name: "Indore",
  country: "India",
  countryCode: "IN",
  adminRegion: "Madhya Pradesh",
  latitude: 22.71792,
  longitude: 75.8333,
  population: 1994397,
  displayLabel: "Indore, Madhya Pradesh, India",
  kind: "city",
};

describe("fetchLocationSearch", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  it("returns results on success", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => ({ results: [mockLocation] }),
    }));

    const results = await fetchLocationSearch("indore");
    assert.equal(results.length, 1);
    assert.equal(results[0].displayLabel, "Indore, Madhya Pradesh, India");
  });

  it("throws on API failure", async () => {
    mock.method(globalThis, "fetch", async () => ({
      ok: false,
      json: async () => ({ error: "Query parameter q is required." }),
    }));

    await assert.rejects(() => fetchLocationSearch("indore"), /required/i);
  });

  it("selected result contains complete Location object", () => {
    assert.equal(mockLocation.id, "geoname:1269743");
    assert.equal(mockLocation.name, "Indore");
    assert.equal(mockLocation.country, "India");
    assert.equal(mockLocation.countryCode, "IN");
    assert.equal(mockLocation.latitude, 22.71792);
    assert.equal(mockLocation.longitude, 75.8333);
    assert.equal(mockLocation.displayLabel, "Indore, Madhya Pradesh, India");
    assert.equal(mockLocation.kind, "city");
  });
});
