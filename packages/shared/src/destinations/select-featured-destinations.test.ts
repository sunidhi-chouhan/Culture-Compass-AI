import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DestinationCatalogEntry } from "../schemas/destination-catalog";
import {
  catalogEntryToLocation,
  selectFeaturedDestinations,
} from "./index";

const sampleCatalog: DestinationCatalogEntry[] = [
  {
    id: "dest:jaipur-in",
    name: "Jaipur",
    country: "India",
    countryCode: "IN",
    region: "Rajasthan",
    continent: "Asia",
    latitude: 26.9124,
    longitude: 75.7873,
    popularity: 96,
    tags: ["culture"],
  },
  {
    id: "dest:kyoto-jp",
    name: "Kyoto",
    country: "Japan",
    countryCode: "JP",
    region: "Kyoto",
    continent: "Asia",
    latitude: 35.0116,
    longitude: 135.7681,
    popularity: 98,
    tags: ["temples"],
  },
  {
    id: "dest:rome-it",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    region: "Lazio",
    continent: "Europe",
    latitude: 41.9028,
    longitude: 12.4964,
    popularity: 98,
    tags: ["history"],
  },
  {
    id: "dest:cape-town-za",
    name: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    region: "Western Cape",
    continent: "Africa",
    latitude: -33.9249,
    longitude: 18.4241,
    popularity: 95,
    tags: ["coast"],
  },
  {
    id: "dest:rio-br",
    name: "Rio de Janeiro",
    country: "Brazil",
    countryCode: "BR",
    region: "Rio de Janeiro",
    continent: "South America",
    latitude: -22.9068,
    longitude: -43.1729,
    popularity: 95,
    tags: ["beach"],
  },
  {
    id: "dest:sydney-au",
    name: "Sydney",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    continent: "Oceania",
    latitude: -33.8688,
    longitude: 151.2093,
    popularity: 94,
    tags: ["harbour"],
  },
  {
    id: "dest:nyc-us",
    name: "New York City",
    country: "United States",
    countryCode: "US",
    region: "New York",
    continent: "North America",
    latitude: 40.7128,
    longitude: -74.006,
    popularity: 98,
    tags: ["city"],
  },
  {
    id: "dest:paris-fr",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    region: "Île-de-France",
    continent: "Europe",
    latitude: 48.8566,
    longitude: 2.3522,
    popularity: 99,
    tags: ["art"],
  },
];

describe("selectFeaturedDestinations", () => {
  it("returns deterministic results for the same seed", () => {
    const first = selectFeaturedDestinations(sampleCatalog, { seed: 42, limit: 5 });
    const second = selectFeaturedDestinations(sampleCatalog, { seed: 42, limit: 5 });
    assert.deepEqual(
      first.map((entry) => entry.id),
      second.map((entry) => entry.id),
    );
  });

  it("returns different results for different seeds", () => {
    const first = selectFeaturedDestinations(sampleCatalog, { seed: 1, limit: 5 });
    const second = selectFeaturedDestinations(sampleCatalog, { seed: 2, limit: 5 });
    assert.notDeepEqual(
      first.map((entry) => entry.id),
      second.map((entry) => entry.id),
    );
  });

  it("does not return duplicate destinations", () => {
    const selected = selectFeaturedDestinations(sampleCatalog, { seed: 99, limit: 5 });
    const ids = selected.map((entry) => entry.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("prefers geographic diversity across continents", () => {
    const selected = selectFeaturedDestinations(sampleCatalog, { seed: 7, limit: 5 });
    const continents = new Set(selected.map((entry) => entry.continent));
    assert.equal(continents.size, 5);
  });

  it("avoids selecting only destinations from one country when alternatives exist", () => {
    const diverseAsiaCatalog: DestinationCatalogEntry[] = [
      sampleCatalog[0],
      sampleCatalog[1],
      {
        id: "dest:bangkok-th",
        name: "Bangkok",
        country: "Thailand",
        countryCode: "TH",
        region: "Bangkok",
        continent: "Asia",
        latitude: 13.7563,
        longitude: 100.5018,
        popularity: 93,
        tags: ["food"],
      },
    ];

    const selected = selectFeaturedDestinations(diverseAsiaCatalog, { seed: 11, limit: 3 });
    const countries = new Set(selected.map((entry) => entry.countryCode));
    assert.equal(countries.size, selected.length);
  });

  it("maps catalog entries to normalized Location objects", () => {
    const location = catalogEntryToLocation(sampleCatalog[0]);
    assert.equal(location.kind, "destination");
    assert.equal(location.displayLabel, "Jaipur, Rajasthan, India");
    assert.equal(location.id, "dest:jaipur-in");
  });
});
