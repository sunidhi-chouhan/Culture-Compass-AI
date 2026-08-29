import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Location } from "@culturecompass/shared";
import { initializePlannerState } from "./initialize-planner-state";

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

describe("initializePlannerState", () => {
  it("starts on destination step when no location is supplied", () => {
    const state = initializePlannerState({ initialDestination: "", initialLocation: null });

    assert.equal(state.step, "destination");
    assert.equal(state.destinationLocation, null);
    assert.equal(state.messages.at(-1)?.text, "Where is this journey headed?");
  });

  it("skips destination when a valid Location is supplied", () => {
    const state = initializePlannerState({
      initialDestination: jaipurLocation.displayLabel,
      initialLocation: jaipurLocation,
    });

    assert.equal(state.step, "interests");
    assert.equal(state.destinationLocation?.id, jaipurLocation.id);
    assert.equal(state.answers.destination, jaipurLocation.displayLabel);
    assert.equal(state.messages.at(-1)?.text, "What should shape the trip? Pick everything that matters.");
    assert.ok(state.messages.some((message) => message.role === "user"));
  });

  it("uses improve-mode welcome when entryMode is improve", () => {
    const state = initializePlannerState({ entryMode: "improve" });
    assert.match(state.messages[0]?.text ?? "", /trip you already have/);
  });
  it("restores location from sessionStorage when URL destination matches", () => {
    const storage = createMemoryStorage({
      plannerLocation: JSON.stringify(jaipurLocation),
    });

    const state = initializePlannerState({
      initialDestination: jaipurLocation.displayLabel,
      storage,
    });

    assert.equal(state.step, "interests");
    assert.equal(state.destinationLocation?.id, jaipurLocation.id);
  });

  it("ignores stale sessionStorage when URL destination differs", () => {
    const storage = createMemoryStorage({
      plannerLocation: JSON.stringify(jaipurLocation),
    });

    const state = initializePlannerState({
      initialDestination: tokyoLocation.displayLabel,
      storage,
    });

    assert.equal(state.step, "destination");
    assert.equal(state.destinationLocation, null);
    assert.equal(storage.getItem("plannerLocation"), null);
  });

  it("keeps free-text destination without skipping the destination step", () => {
    const state = initializePlannerState({
      initialDestination: "Kyoto",
      initialLocation: null,
    });

    assert.equal(state.step, "destination");
    assert.equal(state.destinationInput, "Kyoto");
    assert.equal(state.destinationLocation, null);
  });
});
