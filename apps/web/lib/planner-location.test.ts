import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Location } from "@culturecompass/shared";
import {
  PLANNER_LOCATION_STORAGE_KEY,
  readStoredPlannerLocation,
  resolvePlannerLocation,
  writePlannerLocation,
} from "./planner-location";

const jaipurLocation: Location = {
  id: "dest:jaipur-in",
  name: "Jaipur",
  country: "India",
  countryCode: "IN",
  adminRegion: "Rajasthan",
  latitude: 26.9124,
  longitude: 75.7873,
  displayLabel: "Jaipur, Rajasthan, India",
  kind: "destination",
};

const tokyoLocation: Location = {
  id: "dest:tokyo-jp",
  name: "Tokyo",
  country: "Japan",
  countryCode: "JP",
  adminRegion: "Tokyo",
  latitude: 35.6762,
  longitude: 139.6503,
  displayLabel: "Tokyo, Japan",
  kind: "destination",
};

function createMemoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
  };
}

describe("resolvePlannerLocation", () => {
  it("prefers explicit initialLocation over sessionStorage", () => {
    const storage = createMemoryStorage({
      [PLANNER_LOCATION_STORAGE_KEY]: JSON.stringify(jaipurLocation),
    });

    const resolved = resolvePlannerLocation("", tokyoLocation, storage);
    assert.equal(resolved.location?.id, tokyoLocation.id);
  });

  it("clears stale sessionStorage when destination param conflicts", () => {
    const storage = createMemoryStorage({
      [PLANNER_LOCATION_STORAGE_KEY]: JSON.stringify(jaipurLocation),
    });

    const resolved = resolvePlannerLocation(tokyoLocation.displayLabel, null, storage);
    assert.equal(resolved.location, null);
    assert.equal(storage.getItem(PLANNER_LOCATION_STORAGE_KEY), null);
  });
});

describe("writePlannerLocation", () => {
  it("stores complete Location objects", () => {
    const storage = createMemoryStorage();
    writePlannerLocation(storage, jaipurLocation);
    const stored = readStoredPlannerLocation(storage);
    assert.deepEqual(stored, jaipurLocation);
  });

  it("clears storage when location is null", () => {
    const storage = createMemoryStorage({
      [PLANNER_LOCATION_STORAGE_KEY]: JSON.stringify(jaipurLocation),
    });
    writePlannerLocation(storage, null);
    assert.equal(storage.getItem(PLANNER_LOCATION_STORAGE_KEY), null);
  });
});
