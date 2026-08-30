import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_JOURNEY_SESSION_STORAGE_KEY,
  JOURNEY_PACKING_SESSION_KEY,
  type CompassPlanResponse,
  type CompassPlanRequest,
} from "@culturecompass/shared";
import {
  clearActivePlannerSession,
  COMPASS_PLAN_STORAGE_KEY,
  COMPASS_REQUEST_STORAGE_KEY,
  readPlannerSession,
} from "./planner-session-storage";
import { PLANNER_LOCATION_STORAGE_KEY } from "./planner-location";

const mockPlan = { id: "plan" } as unknown as CompassPlanResponse;
const mockRequest = { lensMode: "local" } as CompassPlanRequest;

function createStorage(entries: Record<string, string | null>): Pick<Storage, "getItem"> {
  return {
    getItem: (key: string) => entries[key] ?? null,
  };
}

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe("readPlannerSession", () => {
  it("returns null when plan is missing", () => {
    const result = readPlannerSession(createStorage({ compassRequest: "{}" }));
    assert.equal(result, null);
  });

  it("returns null when request is missing", () => {
    const result = readPlannerSession(createStorage({ compassPlan: "{}" }));
    assert.equal(result, null);
  });

  it("returns null for invalid JSON", () => {
    const result = readPlannerSession(
      createStorage({ compassPlan: "not-json", compassRequest: "{}" }),
    );
    assert.equal(result, null);
  });

  it("restores plan, request, and lens mode", () => {
    const result = readPlannerSession(
      createStorage({
        compassPlan: JSON.stringify(mockPlan),
        compassRequest: JSON.stringify(mockRequest),
      }),
    );
    assert.deepEqual(result?.plan, mockPlan);
    assert.deepEqual(result?.request, mockRequest);
    assert.equal(result?.lensMode, "local");
  });

  it("defaults lens mode to tourist", () => {
    const result = readPlannerSession(
      createStorage({
        compassPlan: JSON.stringify(mockPlan),
        compassRequest: JSON.stringify({}),
      }),
    );
    assert.equal(result?.lensMode, "tourist");
  });
});

describe("clearActivePlannerSession", () => {
  it("clears session plan keys and active journey pointer, keeps theme", () => {
    const storage = memoryStorage({
      [COMPASS_PLAN_STORAGE_KEY]: "{}",
      [COMPASS_REQUEST_STORAGE_KEY]: "{}",
      [ACTIVE_JOURNEY_SESSION_STORAGE_KEY]: JSON.stringify({
        activeJourneyId: "j1",
        isDraft: false,
      }),
      [JOURNEY_PACKING_SESSION_KEY]: JSON.stringify({ items: [], preferences: { extras: [] } }),
      [PLANNER_LOCATION_STORAGE_KEY]: "{}",
      theme: "dark",
    });

    clearActivePlannerSession(storage);

    assert.equal(storage.getItem(COMPASS_PLAN_STORAGE_KEY), null);
    assert.equal(storage.getItem(COMPASS_REQUEST_STORAGE_KEY), null);
    assert.equal(storage.getItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY), null);
    assert.equal(storage.getItem(JOURNEY_PACKING_SESSION_KEY), null);
    assert.equal(storage.getItem(PLANNER_LOCATION_STORAGE_KEY), null);
    assert.equal(storage.getItem("theme"), "dark");
  });
});
