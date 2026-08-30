import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { searchLocations } from "./search-locations";
import type { LocationIndexEntry } from "../types";
import { locationSuggestionSchema } from "../schemas/location";

const FIXTURE_INDEX: LocationIndexEntry[] = [
  {
    id: "geoname:1269743",
    name: "Indore",
    country: "India",
    countryCode: "IN",
    adminRegion: "Madhya Pradesh",
    latitude: 22.71792,
    longitude: 75.8333,
    population: 1994397,
    kind: "city",
    displayLabel: "Indore, Madhya Pradesh, India",
    searchText: "indore madhya pradesh india in indore, madhya pradesh, india",
  },
  {
    id: "geoname:1277333",
    name: "Indi",
    country: "India",
    countryCode: "IN",
    adminRegion: "Maharashtra",
    latitude: 17.74425,
    longitude: 75.18333,
    population: 25000,
    kind: "city",
    displayLabel: "Indi, Maharashtra, India",
    searchText: "indi maharashtra india in indi, maharashtra, india",
  },
  {
    id: "country:IN",
    name: "India",
    country: "India",
    countryCode: "IN",
    latitude: 0,
    longitude: 0,
    population: 0,
    kind: "country",
    displayLabel: "India",
    searchText: "india in india",
  },
  {
    id: "country:JP",
    name: "Japan",
    country: "Japan",
    countryCode: "JP",
    latitude: 0,
    longitude: 0,
    population: 0,
    kind: "country",
    displayLabel: "Japan",
    searchText: "japan jp japan",
  },
  {
    id: "geoname:1850147",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    adminRegion: "Tokyo",
    latitude: 35.6895,
    longitude: 139.69171,
    population: 9733276,
    kind: "city",
    displayLabel: "Tokyo, Tokyo, Japan",
    searchText: "tokyo tokyo japan jp tokyo, tokyo, japan",
  },
  {
    id: "geoname:9999999",
    name: "Indianapolis",
    country: "United States",
    countryCode: "US",
    adminRegion: "Indiana",
    latitude: 39.7684,
    longitude: -86.158,
    population: 887642,
    kind: "city",
    displayLabel: "Indianapolis, Indiana, United States",
    searchText: "indianapolis indiana united states us indianapolis, indiana, united states",
  },
];

describe("searchLocations", () => {
  it('"Ind" returns Indore when present in fixture', () => {
    const results = searchLocations(FIXTURE_INDEX, "Ind");
    assert.ok(results.some((r) => r.name === "Indore"));
  });

  it('"indore" returns Indore', () => {
    const results = searchLocations(FIXTURE_INDEX, "indore");
    assert.equal(results[0]?.name, "Indore");
  });

  it('"INDORE" behaves correctly', () => {
    const lower = searchLocations(FIXTURE_INDEX, "indore");
    const upper = searchLocations(FIXTURE_INDEX, "INDORE");
    assert.deepEqual(upper.map((r) => r.id), lower.map((r) => r.id));
  });

  it("country search works", () => {
    const results = searchLocations(FIXTURE_INDEX, "india");
    assert.ok(results.some((r) => r.kind === "country" && r.name === "India"));
  });

  it("partial search works", () => {
    const results = searchLocations(FIXTURE_INDEX, "jap");
    assert.ok(results.some((r) => r.name === "Japan" || r.country === "Japan"));
  });

  it("empty query returns no results", () => {
    assert.deepEqual(searchLocations(FIXTURE_INDEX, ""), []);
    assert.deepEqual(searchLocations(FIXTURE_INDEX, " "), []);
  });

  it("query shorter than 2 characters is ignored", () => {
    assert.deepEqual(searchLocations(FIXTURE_INDEX, "i"), []);
  });

  it("query longer than maximum returns no results", () => {
    const longQuery = "a".repeat(65);
    assert.deepEqual(searchLocations(FIXTURE_INDEX, longQuery), []);
  });

  it("no-results state works", () => {
    const results = searchLocations(FIXTURE_INDEX, "zzzznotaplace");
    assert.equal(results.length, 0);
  });

  it("search results are valid LocationSuggestion objects", () => {
    const results = searchLocations(FIXTURE_INDEX, "tokyo");
    for (const result of results) {
      assert.equal(locationSuggestionSchema.safeParse(result).success, true);
      assert.equal("searchText" in result, false);
    }
  });

  it("results never contain fabricated locations", () => {
    const fixtureIds = new Set(FIXTURE_INDEX.map((e) => e.id));
    const results = searchLocations(FIXTURE_INDEX, "ind");
    for (const result of results) {
      assert.ok(fixtureIds.has(result.id));
    }
  });

  it("ranking prioritizes relevant prefix matches", () => {
    const results = searchLocations(FIXTURE_INDEX, "ind");
    assert.equal(results[0]?.name, "Indore");
  });

  it("maximum result count is respected", () => {
    const results = searchLocations(FIXTURE_INDEX, "ind", { limit: 2 });
    assert.equal(results.length, 2);
  });

  it('"tokyo" returns Tokyo', () => {
    const results = searchLocations(FIXTURE_INDEX, "tokyo");
    assert.equal(results[0]?.name, "Tokyo");
  });
});
